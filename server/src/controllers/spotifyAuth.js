const SpotifyWebApi = require('spotify-web-api-node');

class SpotifyAuthController {
  constructor() {
    this.tokenMap = new Map(); // Store tokens by userId
    this.spotifyApi = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.NODE_ENV === 'production' 
        ? `${process.env.CLIENT_URL}/callback`
        : 'http://localhost:5173/callback'
    });
  }

  async handleCallback(code, codeVerifier) {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.SPOTIFY_CLIENT_ID,
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.NODE_ENV === 'production' 
            ? `${process.env.CLIENT_URL}/callback`
            : 'http://localhost:5173/callback',
          code_verifier: codeVerifier,
        }),
      });

      if (!response.ok) {
        throw new Error('Token exchange failed');
      }

      const data = await response.json();
      
      // Get user profile to use as unique identifier
      this.spotifyApi.setAccessToken(data.body.access_token);
      const me = await this.spotifyApi.getMe();
      const userId = me.body.id;

      // Store tokens
      this.tokenMap.set(userId, {
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresAt: Date.now() + (data.body.expires_in * 1000)
      });

      // Get user's top tracks and artists
      const [topTracks, topArtists] = await Promise.all([
        this.spotifyApi.getMyTopTracks({ limit: 3 }),
        this.spotifyApi.getMyTopArtists({ limit: 1 })
      ]);

      return {
        user: {
          ...me.body,
          topTracks: topTracks.body.items.map(track => ({
            name: track.name,
            artist: track.artists[0].name,
            id: track.id
          })),
          favoriteArtist: topArtists.body.items[0] ? {
            name: topArtists.body.items[0].name,
            id: topArtists.body.items[0].id
          } : null
        },
        accessToken: data.body.access_token
      };
    } catch (error) {
      console.error('Spotify auth error:', error);
      throw new Error('Authentication failed');
    }
  }

  async getValidToken(userId) {
    const tokens = this.tokenMap.get(userId);
    if (!tokens) return null;

    // Check if token needs refresh
    if (Date.now() >= tokens.expiresAt - 60000) { // Refresh 1 minute before expiry
      try {
        this.spotifyApi.setRefreshToken(tokens.refreshToken);
        const data = await this.spotifyApi.refreshAccessToken();
        
        // Update stored tokens
        this.tokenMap.set(userId, {
          ...tokens,
          accessToken: data.body.access_token,
          expiresAt: Date.now() + (data.body.expires_in * 1000)
        });

        return data.body.access_token;
      } catch (error) {
        console.error('Token refresh error:', error);
        this.tokenMap.delete(userId);
        return null;
      }
    }

    return tokens.accessToken;
  }

  async addToQueue(userId, trackUri) {
    const token = await this.getValidToken(userId);
    if (!token) throw new Error('No valid token');

    this.spotifyApi.setAccessToken(token);
    await this.spotifyApi.addToQueue(trackUri);
  }

  async getCurrentPlayback(userId) {
    const token = await this.getValidToken(userId);
    if (!token) throw new Error('No valid token');

    this.spotifyApi.setAccessToken(token);
    return this.spotifyApi.getMyCurrentPlaybackState();
  }

  async searchTracks(userId, query) {
    const token = await this.getValidToken(userId);
    if (!token) throw new Error('No valid token');

    this.spotifyApi.setAccessToken(token);
    return this.spotifyApi.searchTracks(query, { limit: 5 });
  }
}

module.exports = new SpotifyAuthController(); 