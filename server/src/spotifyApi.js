const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.NODE_ENV === 'production' 
    ? `${process.env.CLIENT_URL}/callback`
    : 'http://localhost:5173/callback'
});

module.exports = spotifyApi; 