import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();
  const handleLogin = () => {
    const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirect_uri = `${window.location.origin}/callback`;
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-read-recently-played',
      'user-modify-playback-state',
      'user-read-playback-state',
      'streaming'
    ];

    const authUrl = 'https://accounts.spotify.com/authorize?' +
      `client_id=${client_id}` +
      `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      '&response_type=code';

    window.location.href = authUrl;
  };

  return (
    <div className="landing-container">
      <h1>Music Jam</h1>
      <p>Connect with friends through music</p>
      <button onClick={handleLogin} className="spotify-login-btn">
        Connect with Spotify
      </button>
    </div>
  );
}

export default Landing; 
