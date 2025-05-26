const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB (replace <your_mongo_uri>)
mongoose.connect('mongodb+srv://SwethaAmaravathi:Swetha9865@blossom.ho7wing.mongodb.net/TODO-APP?retryWrites=true&w=majority&appName=Blossom');

// Listen for successful connection
mongoose.connection.once('open', () => {
  console.log('✅ Successfully connected to MongoDB');
});

// Listen for connection errors
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Task Schema
const taskSchema = new mongoose.Schema({
  userId: String, // simple string for demo
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  status: { type: String, enum: ['Open', 'Complete'], default: 'Open' },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// Middleware: simple user simulation (replace with auth later)
app.use((req, res, next) => {
  req.userId = 'demo-user'; // fixed user id for demo
  next();
});

// Get all tasks for user
app.get('/tasks', async (req, res) => {
  const tasks = await Task.find({ userId: req.userId });
  res.json(tasks);
});

// Create a task
app.post('/tasks', async (req, res) => {
  const { title, description, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const task = new Task({
    userId: req.userId,
    title,
    description,
    dueDate,
  });

  await task.save();
  res.status(201).json(task);
});

// Update task status or details
app.put('/tasks/:id', async (req, res) => {
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  );
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// Delete task
app.delete('/tasks/:id', async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ message: 'Task deleted' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
