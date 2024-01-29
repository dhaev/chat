const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { User,Message, Conversation,} = require("../models/user");
const { ensureAuth, ensureGuest } = require('../middleware/auth')

// // Assuming you have these models
// const User = require('./models/User');
// const Message = require('./models/Message');
// const Conversation = require('./models/Conversation');
router.get('/searchUsers', async (req, res) => {
  try {
    // Get the search query from the request parameters
    const { searchQuery } = req.query;
    console.log("searchQuery :"+ searchQuery)
    // Find users that match the search query
    const users = await User.find({ displayName: { $regex: searchQuery, $options: 'i' } }).limit(5);

    // Send the users back in the response
    res.json(users);
  } catch (err) {
    console.error(err);
    throw error;
    res.status(500).send('Server error');
  }
});



router.get('/getMessages', ensureAuth,async (req, res) => {
    const participant1Id = req.user.id;
    const participant2Id = req.query.id;
    
    try {
      // Find a conversation between the two participants
      const history = await Conversation.findOne({
        participants: { $all: [participant1Id, participant2Id] }},'messages'
      );
    
      // Check if history or history.messages is null or empty
      if (!history || !history.messages || history.messages.length === 0) {
        res.status(200).json(null);
      } else {
        res.status(200).json({
          messages: history.messages,
        });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
 

  router.delete('/deleteConversation', ensureAuth, async (req, res) => {
    const participant1Id = req.user.id;
    const participant2Id = req.body.id;
    // const {participant1Id, participant2Id} = req.body;
    console.log("body: "+req.body.id)
    console.log("query: "+req.query.id)
    try {
      // Find a conversation between the two participants
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


    router.delete('/deleteMessage',  ensureAuth, async (req, res) => {
      const participant1Id = req.user.id;
      const participant2Id = req.body.id;
      const messageId = req.body.messageId;

      console.log("body: "+req.query.id)
      console.log("query: "+req.query.messageId)
    
    // const {participant1Id, participant2Id, messageId} = req.body;

      try {
        // Find a conversation between the two participants
        const conversation = await Conversation.findOne({
          participants: { $all: [participant1Id, participant2Id] }
        });
    
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
    
        // Find the message with the given id
        const messageIndex = conversation.messages.findIndex(message => message._id.toString() === messageId);

        
        if (messageIndex === -1) {
          return res.status(404).json({ error: 'Message not found' });
        }
            // Check if the user is the sender of the message

        if (conversation.messages[messageIndex].sender.toString() !== participant1Id) {
          return res.status(403).json({ error: 'You are not authorized to delete this message' });
        }
    
        // Delete the message
        conversation.messages.splice(messageIndex, 1);
        await conversation.save();
    
        res.status(200).json({ message: 'Message deleted successfully' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    router.put('/updateMessage', ensureAuth, async (req, res) => {
      const {participant1Id, participant2Id, messageId, newContent} = req.body;
      //console.log(req.body);
    
      try {
        // Find a conversation between the two participants
        const conversation = await Conversation.findOne({
          participants: { $all: [participant1Id, participant2Id] }
        });
    
        if (!conversation) {
          return res.status(404).json({ error: 'Conversation not found' });
        }
    
        // Find the message with the given id
        const messageIndex = conversation.messages.findIndex(message => message._id.toString() === messageId);
    
        if (messageIndex === -1) {
          return res.status(404).json({ error: 'Message not found' });
        }
    
        // Check if the user is the sender of the message
        if (conversation.messages[messageIndex].sender.toString() !== participant1Id) {
          return res.status(403).json({ error: 'You are not authorized to update this message' });
        }
    
        // Update the message
        conversation.messages[messageIndex].content = newContent;
        await conversation.save();
    
        res.status(200).json({ message: 'Message updated successfully' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
router.post('/sendMessage', ensureAuth, async (req, res) => {
  // const { senderId,receiverId ,content  } = req.body;
  const { content, receiverId  } = req.body;
  const senderId = req.user.id;


  const messid = new mongoose.Types.ObjectId();

  console.log("send messges request body :"  + req.body)

  try {
    // Create a new message
    const newMessage = new Message({
      _id: messid,
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
    console.log(content);

    res.status(200).json({ message: newMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
