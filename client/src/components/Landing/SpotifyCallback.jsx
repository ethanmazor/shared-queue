import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SpotifyCallback.css';

function SpotifyCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code found');
        }

        // Exchange code for tokens
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate with Spotify');
        }

        const data = await response.json();
        
        // Store user data
        localStorage.setItem('spotify_user', JSON.stringify(data.user));
        localStorage.setItem('spotify_token', data.accessToken);

        // Redirect to home
        navigate('/');
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/?error=auth_failed');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="callback-container">
      <div className="callback-content">
        <div className="loading-state">
          <h2 className="loading-text">Connecting to Spotify...</h2>
          <div className="loading-spinner"></div>
          <p className="loading-subtext">Please wait while we set up your account</p>
        </div>
      </div>
    </div>
  );
}

export default SpotifyCallback; 