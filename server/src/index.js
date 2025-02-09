require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Routes
app.use('/api/auth', authRoutes);

// Debug endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    env: {
      clientId: process.env.SPOTIFY_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? 'Set' : 'Missing',
      clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    clientId: process.env.SPOTIFY_CLIENT_ID ? 'Set' : 'Missing',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? 'Set' : 'Missing',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    nodeEnv: process.env.NODE_ENV || 'development'
  });
}); 