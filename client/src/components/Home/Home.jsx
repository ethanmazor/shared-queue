import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userString = localStorage.getItem('spotify_user');
    if (userString) {
      setUser(JSON.parse(userString));
    }
  }, []);

  const handleSpotifyLogin = () => {
    const client_id = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirect_uri = `${window.location.origin}/callback`;
    const scope = 'streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state';
    
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=code&redirect_uri=${redirect_uri}&scope=${encodeURIComponent(scope)}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('spotify_user');
    localStorage.removeItem('spotify_token');
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  if (!user) {
    return (
      <div className="landing-container">
        <div className="landing-content">
          <h1 className="landing-title">
            <span className="rock-emoji">🤘</span> Music Jam
          </h1>
          <p className="landing-subtitle">
            Create or join music sessions with friends
          </p>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">🎵</span>
              <h3>Real-time Music</h3>
              <p>Listen together in perfect sync</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🗳️</span>
              <h3>Vote on Songs</h3>
              <p>Democracy rules the playlist</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎸</span>
              <h3>Genre Mixing</h3>
              <p>Blend different music styles</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <h3>Smart Queue</h3>
              <p>AI-powered recommendations</p>
            </div>
          </div>
          <button 
            onClick={handleSpotifyLogin}
            className="spotify-login-btn"
          >
            <span className="spotify-icon">🎧</span>
            Continue with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">🤘 Music Jam</h1>
        <div className="user-info">
          <img 
            src={user.images?.[0]?.url || '/default-avatar.png'} 
            alt={user.display_name}
          />
          <span>{user.display_name}</span>
          <button 
            onClick={handleLogout}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      </div>

      <main className="session-options">
        <div className="session-card">
          <h2>Create Session</h2>
          <p>Start a new music session and invite friends!</p>
          <button className="create-btn">
            Create New Session
          </button>
        </div>

        <div className="session-card">
          <h2>Join Session</h2>
          <p>Enter a code to join an existing session!</p>
          <input
            type="text"
            placeholder="Enter Session Code"
            className="session-input"
            maxLength={4}
          />
          <button className="join-btn">
            Join Session
          </button>
        </div>
      </main>
    </div>
  );
}

export default Home; 