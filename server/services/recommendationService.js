const OpenAI = require('openai');
const SpotifyWebApi = require('spotify-web-api-node');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

class RecommendationService {
  constructor() {
    this.refreshSpotifyToken();
    // Refresh token every 30 minutes
    setInterval(() => this.refreshSpotifyToken(), 30 * 60 * 1000);
  }

  async refreshSpotifyToken() {
    try {
      const data = await spotifyApi.clientCredentialsGrant();
      spotifyApi.setAccessToken(data.body.access_token);
    } catch (error) {
      console.error('Error refreshing Spotify token:', error);
    }
  }

  async generateRecommendations(session) {
    try {
      // Get top genres from session
      const topGenres = session.selectedGenres
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 3)
        .map(g => g.genre);

      // Get recent tracks from session
      const recentTracks = session.queue.map(song => ({
        name: song.name,
        artist: song.artist,
        votes: song.votes
      }));

      // Create prompt for OpenAI
      const prompt = {
        role: 'system',
        content: `You are a music recommendation expert. Based on the following information, suggest 5 specific songs that would fit well in this playlist. 
        Consider these factors:
        1. Top genres: ${topGenres.join(', ')}
        2. Recent tracks played: ${JSON.stringify(recentTracks)}
        3. The songs should maintain similar energy levels and flow well together.
        
        Format your response as a JSON array of objects with 'artist' and 'track' properties.`
      };

      const userMessage = {
        role: 'user',
        content: 'Generate song recommendations that match these preferences while maintaining variety.'
      };

      // Get AI recommendations
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [prompt, userMessage],
        temperature: 0.7,
        max_tokens: 500
      });

      const recommendations = JSON.parse(completion.choices[0].message.content);

      // Search for songs on Spotify and get full track details
      const spotifyTracks = await Promise.all(
        recommendations.map(async (rec) => {
          const searchQuery = `track:${rec.track} artist:${rec.artist}`;
          const searchResult = await spotifyApi.searchTracks(searchQuery, { limit: 1 });
          
          if (searchResult.body.tracks.items.length > 0) {
            const track = searchResult.body.tracks.items[0];
            return {
              id: track.id,
              name: track.name,
              artist: track.artists[0].name,
              albumArt: track.album.images[0].url,
              duration: track.duration_ms,
              uri: track.uri,
              popularity: track.popularity,
              aiConfidence: this.calculateConfidence(track, topGenres, recentTracks)
            };
          }
          return null;
        })
      );

      // Filter out any null results and sort by confidence
      return spotifyTracks
        .filter(track => track !== null)
        .sort((a, b) => b.aiConfidence - a.aiConfidence);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  calculateConfidence(track, topGenres, recentTracks) {
    let confidence = 0;

    // Base confidence from Spotify popularity
    confidence += track.popularity * 0.3; // 30% weight

    // Avoid recently played tracks
    const isRecent = recentTracks.some(
      recent => recent.name.toLowerCase() === track.name.toLowerCase()
    );
    if (!isRecent) confidence += 20; // Boost unique songs

    // Genre matching will be handled by the AI's initial selection
    confidence += 50; // Base confidence in AI selection

    return Math.min(100, confidence);
  }
}

module.exports = new RecommendationService(); 