const express = require('express');
const router = express.Router();
const spotifyAuth = require('../controllers/spotifyAuth');

router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;
    const userData = await spotifyAuth.handleCallback(code);
    res.json(userData);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router; 