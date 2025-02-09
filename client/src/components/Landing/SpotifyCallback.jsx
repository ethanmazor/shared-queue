import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SpotifyCallback.css';

function SpotifyCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const getToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spotify/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/callback` }),
        });

        const data = await response.json();

        if (data.access_token) {
          localStorage.setItem('spotify_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          navigate('/home');
        } else {
          setError('Failed to get access token');
        }
      } catch (err) {
        setError('Error connecting to Spotify');
        console.error('Token exchange error:', err);
      }
    };

    getToken();
  }, [navigate]);

  if (error) {
    return (
      <div className="callback-container error">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="callback-container">
      <h2>Connecting to Spotify...</h2>
      <div className="loading-spinner"></div>
    </div>
  );
}

export default SpotifyCallback; 