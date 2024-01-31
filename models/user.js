const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: false
  },
  displayName: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  hash: {
    type: String,
    required: false
  },
    salt: {
    type: String,
    required: false
  },
  image: {
    type: String
  },
  createdAt: {
     type: Date,
     default: Date.now 
  },
  contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

});
const User = mongoose.model('User', UserSchema);




const MessageSchema = new mongoose.Schema({
  _id: { 
    type: mongoose.Schema.Types.ObjectId
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
  },
  receiver: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User' 
  },
  content: {
     type: String
  },
  exclude: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'
 }] ,
  timestamp: {
     type: Date, default: Date.now 
  }
});
const Message = mongoose.model('Message', MessageSchema);


const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [MessageSchema],
  lastUpdated: { 
    type: Date, default: Date.now 
  }
});
const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = {
  User,
  Message,
  Conversation
};