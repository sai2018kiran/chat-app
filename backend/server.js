const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PATCH']
  }
});

app.use(cors());
app.use(express.json());

// Mongoose Connection
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chat-app';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB via Mongoose'))
  .catch(err => console.error('MongoDB connection error:', err));

// Database Schema & Model
const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  senderId: { type: String, required: true },
  isPinned: { type: Boolean, default: false },
  deletedFor: { type: String, default: '[]' },
  isDeletedForEveryone: { type: Boolean, default: false }
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

const Message = mongoose.model('Message', messageSchema);

// REST Apis

// Fetch Messages
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send Message
app.post('/api/messages', async (req, res) => {
  const { content, senderId } = req.body;
  if (!content || !senderId) {
    return res.status(400).json({ error: 'Missing content or senderId' });
  }
  
  try {
    const newMessage = await Message.create({ content, senderId });
    io.emit('new_message', newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Delete Message
app.delete('/api/messages/:id', async (req, res) => {
  const { id } = req.params;
  const { type, userId } = req.query; // type can be 'me' or 'everyone'
  
  if (!type || !userId) {
    return res.status(400).json({ error: 'Missing type or userId' });
  }

  try {
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (type === 'everyone') {
      if (message.senderId !== userId) {
         return res.status(403).json({ error: 'Forbidden' });
      }
      message.isDeletedForEveryone = true;
      await message.save();
      io.emit('message_deleted_everyone', message);
      return res.json(message);
    } else if (type === 'me') {
      let deletedForArr = [];
      if (message.deletedFor) {
        deletedForArr = JSON.parse(message.deletedFor);
      }
      if (!deletedForArr.includes(userId)) {
        deletedForArr.push(userId);
      }
      message.deletedFor = JSON.stringify(deletedForArr);
      await message.save();
      return res.json(message);
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Pin Message
app.patch('/api/messages/:id/pin', async (req, res) => {
  const { id } = req.params;
  const { isPinned } = req.body;
  if (typeof isPinned !== 'boolean') {
      return res.status(400).json({ error: 'Invalid isPinned value' });
  }

  try {
    const message = await Message.findByIdAndUpdate(
      id, 
      { isPinned },
      { new: true } // return updated document
    );
    if (!message) {
       return res.status(404).json({ error: 'Message not found' });
    }
    io.emit('message_pinned', message);
    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to pin message' });
  }
});

// Socket Connections
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});