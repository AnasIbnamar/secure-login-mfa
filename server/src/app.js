const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const mfaRoutes = require('./routes/mfaRoutes');
const prisma = require('./config/db');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://secure-login-mfa-three.vercel.app',
];

if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(helmet());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const usersCount = await prisma.user.count();

    return res.status(200).json({
      success: true,
      message: 'Database connected successfully',
      usersCount,
    });
  } catch (error) {
    console.error('DB TEST ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/mfa', mfaRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;