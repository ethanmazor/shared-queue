const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const router = express.Router();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.NODE_ENV === 'production' 
    ? `${process.env.CLIENT_URL}/callback`
    : 'http://localhost:5173/callback'
});

// Add this debug endpoint
router.get('/status', (req, res) => {
  res.json({
    clientId: process.env.SPOTIFY_CLIENT_ID ? 'Set' : 'Missing',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? 'Set' : 'Missing',
    redirectUri: spotifyApi.getRedirectURI(),
    environment: process.env.NODE_ENV
  });
});

router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange authorization code for tokens
    const data = await spotifyApi.authorizationCodeGrant(code);

    // Set access token
    spotifyApi.setAccessToken(data.body.access_token);
    
    // Get user info
    const me = await spotifyApi.getMe();

    res.json({
      user: me.body,
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

module.exports = router; 