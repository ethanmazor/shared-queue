const express = require('express');
const router = express.Router();
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: `${process.env.CLIENT_URL}/callback`
});

// Exchange authorization code for tokens
router.post('/token', async (req, res) => {
  const { code } = req.body;

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    res.json({
      access_token: data.body.access_token,
      refresh_token: data.body.refresh_token,
      expires_in: data.body.expires_in,
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Failed to get tokens' });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  
  spotifyApi.setRefreshToken(refresh_token);
  
  try {
    const data = await spotifyApi.refreshAccessToken();
    res.json({
      access_token: data.body.access_token,
      expires_in: data.body.expires_in,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Search tracks
router.get('/search', async (req, res) => {
  const { q } = req.query;
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  spotifyApi.setAccessToken(token);

  try {
    const data = await spotifyApi.searchTracks(q, { limit: 5 });
    res.json({ tracks: data.body.tracks.items });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get user's top tracks
router.get('/top-tracks', async (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  spotifyApi.setAccessToken(token);

  try {
    const data = await spotifyApi.getMyTopTracks({ limit: 20 });
    res.json({ tracks: data.body.items });
  } catch (error) {
    console.error('Error getting top tracks:', error);
    res.status(500).json({ error: 'Failed to get top tracks' });
  }
});

module.exports = router; 