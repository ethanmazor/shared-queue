import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/pkce';
import './Home.css';

function Home() {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCreateSession = async () => {
    try {
      // Generate PKCE values
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store code verifier in localStorage for later use
      localStorage.setItem('code_verifier', codeVerifier);

      // Prepare Spotify Auth URL
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: `${window.location.origin}/callback`,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        scope: 'streaming user-read-playback-state user-modify-playback-state user-read-currently-playing',
      });

      // Redirect to Spotify Auth
      window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    } catch (error) {
      setError('Failed to initialize Spotify authentication');
      console.error('Auth initialization error:', error);
    }
  };

  const handleJoinSession = (e) => {
    e.preventDefault();
    if (sessionId.length !== 4) {
      setError('Session ID must be 4 characters');
      return;
    }
    navigate(`/session/${sessionId.toUpperCase()}`);
  };

  return (
    <div className="home-container">
      <h1 className="title">Spotify Queue Controller</h1>
      
      {!showJoinForm ? (
        <div className="buttons-container">
          <button onClick={handleCreateSession} className="create-button">
            Create Session
          </button>
          <button 
            onClick={() => setShowJoinForm(true)} 
            className="join-button"
          >
            Join Session
          </button>
        </div>
      ) : (
        <form onSubmit={handleJoinSession} className="join-form">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value.toUpperCase())}
            placeholder="Enter Code"
            maxLength={4}
            className="session-input"
          />
          <button type="submit" className="submit-button">
            Join
          </button>
          <button 
            onClick={() => setShowJoinForm(false)} 
            className="back-button"
          >
            Back
          </button>
        </form>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default Home; 