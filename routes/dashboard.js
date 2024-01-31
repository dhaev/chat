// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');

// Import models and middleware
const { User, Message, Conversation } = require("../models/user");
const { ensureAuth, ensureGuest } = require('../middleware/auth');

// Initialize router
const router = express.Router();

// Validators
const searchQueryValidator = check('searchQuery')
  .trim() // Remove leading and trailing whitespace
  .escape() // Replace HTML characters (<, >, &, ', ") with their corresponding HTML entities
  .isLength({ min: 1 }) // Ensure the query is not empty
  .withMessage('Search query must not be empty');

const participantIdValidator = check('id')
  .trim()
  .escape()
  .isLength({ min: 1 })
  .withMessage('Participant ID must not be empty');

  
const messageIdValidator = check('messageId')
.trim()
.escape()
.isLength({ min: 1 })
.withMessage('messsage ID must not be empty');

// Route to search users
router.get('/searchUsers', [searchQueryValidator], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { searchQuery } = req.query;
    // Find users that match the search query
    const users = await User.find({ displayName: { $regex: searchQuery, $options: 'i' } }).limit(5);
    // Send the users back in the response
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/getMessages', [participantIdValidator], ensureAuth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const participant1Id = req.user.id;
  const participant2Id = req.query.id;
  try {
    // Find a conversation between the two participants where participant1 is not in the exclude field of any message
    const mess = await Conversation.findOne({
      participants: { $all: [participant1Id, participant2Id] }},
     'messages'
    );
    
const history = mess.messages.filter(message=> !message.exclude.includes(new mongoose.Types.ObjectId(participant1Id)))

    if (!history) {
      res.status(200).json(null);
    } else {
      res.status(200).json({
        messages: history,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a conversation
router.delete('/deleteConversationForAll', [ensureAuth, participantIdValidator], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id: participant2Id } = req.body;
  const participant1Id = req.user.id;

  try {
    const conversation = await Conversation.findOneAndDelete({
      participants: { $all: [participant1Id, participant2Id] }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/deleteConversationForOne', [ensureAuth, participantIdValidator], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id: participant2Id } = req.body;
  const participant1Id = req.user.id;

  try {
    const conversation = await Conversation.updateMany({
      participants: { $all: [participant1Id, participant2Id] }},
      { $addToSet: { 'messages.$[].exclude': participant1Id } }
      );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.status(200).json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a message
router.delete('/deleteMessageForAll', [ensureAuth, participantIdValidator, messageIdValidator], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id: participant2Id, messageId } = req.body;
  const participant1Id = req.user.id;

  try {
    const conversation = await Conversation.findOneAndUpdate(
      { participants: { $all: [participant1Id, participant2Id] } },
      { $pull: { messages: { _id: messageId, sender: participant1Id } } }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await conversation.save();
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete('/deleteMessageForOne', [ensureAuth, participantIdValidator, messageIdValidator], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id: participant2Id, messageId } = req.body;
  const participant1Id = req.user.id;


  try {
    const conversation = await Conversation.findOneAndUpdate(
      { participants: { $all: [participant1Id, participant2Id] },  'messages._id': messageId },
      { $addToSet: { 'messages.$[].exclude': participant1Id } }
    );

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    await conversation.save();
    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a message
router.put('/updateMessage', ensureAuth, async (req, res) => {
  const { participant1Id, participant2Id, messageId, newContent } = req.body;

  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [participant1Id, participant2Id] },
      "messages.sender": mongoose.Types.ObjectId(participant1Id)
    });

    if (!conversation) {
      return res.status(403).json({ error: 'You are not authorized to update this message' });
    }

    const messageIndex = conversation.messages.findIndex(message => message._id.equals(messageId));

    if (messageIndex === -1) {
      return res.status(404).json({ error: 'Message not found' });
    }

    conversation.messages[messageIndex].content = newContent;
    await conversation.save();

    res.status(200).json({ message: 'Message updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Send a message
router.post('/sendMessage', ensureAuth, async (req, res) => {
  const { content, receiverId } = req.body;
  const senderId = req.user.id;

  try {
    // Create a new message
    const newMessage = new Message({
      _id: new mongoose.Types.ObjectId(),
      sender: senderId,
      receiver: receiverId,
      content: content
    });

    // Find an existing conversation between the sender and the receiver
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (conversation) {
      // If a conversation already exists, add the new message to it
      conversation.messages.push(newMessage);
    } else {
      // If a conversation does not already exist, create a new one
      conversation = new Conversation({
        participants: [senderId, receiverId],
        messages: [newMessage]
      });
    }

    // Save the conversation
    await conversation.save();

    // Add the conversation to the `conversations` field of both the sender's and the receiver's `User` documents
    await User.updateMany(
      { _id: { $in: [senderId, receiverId] } },
      { $addToSet: { conversations: conversation._id } }
    );

    // Add each other's IDs to the `contacts` field of both the sender's and the receiver's `User` documents
    await Promise.all([
      User.updateOne(
        { _id: senderId },
        { $addToSet: { contacts: receiverId } }
      ),
      User.updateOne(
        { _id: receiverId },
        { $addToSet: { contacts: senderId } }
      )
    ]);

    res.status(200).json({ message: newMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
