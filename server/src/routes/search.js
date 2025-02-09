const express = require('express');
const router = express.Router();
const spotifyAuth = require('../controllers/spotifyAuth');
const { Configuration, OpenAIApi } = require('openai');

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

router.get('/search', async (req, res) => {
  try {
    const { q, sessionId } = req.query;
    const session = req.app.locals.sessionManager.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Use AI to format/correct the search query
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a music search assistant. Format the user's input into 'song name - artist name' format. If multiple artists are mentioned, include the primary artist only."
      }, {
        role: "user",
        content: q
      }],
      max_tokens: 50,
      temperature: 0.3
    });

    const formattedQuery = completion.data.choices[0].message.content;

    // Search Spotify with formatted query
    const searchResult = await spotifyAuth.searchTracks(session.hostId, formattedQuery);
    
    // Format results
    const tracks = searchResult.body.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      uri: track.uri,
      artists: track.artists,
      album: {
        name: track.album.name,
        images: track.album.images
      },
      duration_ms: track.duration_ms
    }));

    res.json({ tracks });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router; 