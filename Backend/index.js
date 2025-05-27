const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult, param, query } = require('express-validator');

dotenv.config();

const app = express();

// === Security Middleware ===
app.use(helmet());

// === CORS Setup with whitelist and full OPTIONS handling ===
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173'];

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// === Secrets and Keys ===
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// === Rate limiter for auth routes ===
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: { error: true, message: 'Too many requests, please try again later.' },
});
app.use('/auth', authLimiter);

// === MongoDB Connection ===
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Successfully connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// === User Model ===
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: function() { return this.passwordHash !== null; }, default: null },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// === Task Model ===
const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  status: { type: String, enum: ['Open', 'Complete'], default: 'Open' },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// === Auth Middleware ===
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: true, message: 'Authorization header missing' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: true, message: 'Token missing' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: true, message: 'Invalid token' });
  }
}

// === AUTH ROUTES ===

// Register
app.post('/auth/register',
  // Validation middleware
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg });
    }

    try {
      const { email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: true, message: 'User already exists' });

      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User({ email, passwordHash });
      await user.save();

      res.status(201).json({ error: false, message: 'User registered successfully' });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: true, message: 'Server error' });
    }
  }
);

// Login
app.post('/auth/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').exists().withMessage('Password is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg });
    }

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: true, message: 'Invalid credentials' });

      if (user.passwordHash === null) {
        // User registered via Google OAuth, no password
        return res.status(400).json({ error: true, message: 'Please login via Google' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) return res.status(400).json({ error: true, message: 'Invalid credentials' });

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ error: false, token });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: true, message: 'Server error' });
    }
  }
);

// Google Login
app.post('/auth/google',
  body('idToken').exists().withMessage('ID token is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg });
    }

    try {
      const { idToken } = req.body;

      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const email = payload.email;

      let user = await User.findOne({ email });
      if (!user) {
        // Create user without passwordHash for Google OAuth
        user = new User({ email, passwordHash: null });
        await user.save();
      }

      const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
      res.json({ error: false, token });
    } catch (err) {
      console.error('Google login error:', err);
      res.status(401).json({ error: true, message: 'Invalid Google ID token' });
    }
  }
);

// === TASK ROUTES ===
app.use('/tasks', authMiddleware);

// Get all tasks with optional filtering and pagination
app.get('/tasks',
  query('status').optional().isIn(['Open', 'Complete']).withMessage('Invalid status filter'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg });
    }

    try {
      const { status, page = 1, limit = 20 } = req.query;
      const filter = { userId: req.userId };
      if (status) filter.status = status;

      const tasks = await Task.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ dueDate: 1, createdAt: -1 });

      res.json({ error: false, tasks });
    } catch (err) {
      console.error('Get tasks error:', err);
      res.status(500).json({ error: true, message: 'Server error' });
    }
  }
);

// Add new task
app.post('/tasks',
  body('title').notEmpty().withMessage('Title is required'),
  body('dueDate').optional().isISO8601().toDate().withMessage('Due date must be a valid date'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg });
    }

    try {
      const { title, description, dueDate } = req.body;

      const task = new Task({ userId: req.userId, title, description, dueDate });
      await task.save();

      res.status(201).json({ error: false, task });
    } catch (err) {
      console.error('Add task error:', err);
      res.status(500).json({ error: true, message: 'Server error' });
    }
  }
);

// Update task
app.put('/tasks/:id',
  param('id').isMongoId().withMessage('Invalid task ID'),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('dueDate').optional().isISO8601().toDate().withMessage('Due date must be a valid date'),
  body('status').optional().isIn(['Open', 'Complete']).withMessage('Invalid status'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg });
    }

    try {
      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        req.body,
        { new: true }
      );
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      res.json({ error: false, task });
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ error: true, message: 'Server error' });
    }
  }
);

// Delete task
app.delete('/tasks/:id',
  param('id').isMongoId().withMessage('Invalid task ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: errors.array()[0].msg });
    }

    try {
      const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
      if (!task) return res.status(404).json({ error: true, message: 'Task not found' });

      res.json({ error: false, message: 'Task deleted' });
    } catch (err) {
      console.error('Delete task error:', err);
      res.status(500).json({ error: true, message: 'Server error' });
    }
  }
);

// Root route
app.get('/', (req, res) => {
  res.send('✅ Backend API is running!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
