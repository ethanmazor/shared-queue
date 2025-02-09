import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSpotifyAuth } from '../../hooks/useSpotifyAuth';
import './Home.css';

function Home() {
  const [user, setUser] = useState(null);
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  const navigate = useNavigate();
  const { user: spotifyUser } = useSpotifyAuth();

  useEffect(() => {
    // Add console logs to track component lifecycle
    console.log('Home component mounted');
    try {
      const userString = localStorage.getItem('spotify_user');
      if (userString) {
        const userData = JSON.parse(userString);
        setUser(userData);
        console.log('User data loaded:', userData);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    }
  }, []);

  const generateSessionId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 4 }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  };

  const createSession = async () => {
    const sessionId = generateSessionId();
    try {
      setIsCreating(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('spotify_token')}`,
        },
        body: JSON.stringify({
          sessionId,
          hostId: spotifyUser.id,
          hostName: spotifyUser.display_name,
        }),
      });

      if (response.ok) {
        navigate(`/session/${sessionId}`);
      } else {
        setError('Failed to create session');
      }
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Failed to create session');
    } finally {
      setIsCreating(false);
    }
  };

  const joinSession = async (e) => {
    e.preventDefault();
    if (sessionCode.length !== 4) {
      setError('Session code must be 4 characters');
      return;
    }

    try {
      setIsJoining(true);
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/${sessionCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('spotify_token')}`,
        },
        body: JSON.stringify({
          userId: spotifyUser.id,
          userName: spotifyUser.display_name,
        }),
      });

      if (response.ok) {
        navigate(`/session/${sessionCode}`);
      } else {
        setError('Session not found or cannot be joined');
      }
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  // Add console log to verify render
  console.log('Home component rendering');

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-[#FFD700]">
            🤘 Music Jam
          </h1>
        </header>

        {/* Test content to verify rendering */}
        <div className="text-white">
          If you can see this, the component is rendering!
        </div>

        {/* Main Content */}
        <main className="grid md:grid-cols-2 gap-8 animate-slide-up">
          {/* Create Session Card */}
          <div className="rock-card transform hover:scale-105 transition-all duration-300">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-rock-gold mb-4">
                Create Session
              </h2>
              <p className="text-rock-light">
                Start a new jam session and invite your friends to join!
              </p>
            </div>
            <button
              onClick={createSession}
              disabled={isCreating}
              className="rock-button w-full bg-rock-red hover:bg-rock-red/80 
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                '🎸 Create New Session'
              )}
            </button>
          </div>

          {/* Join Session Card */}
          <div className="rock-card transform hover:scale-105 transition-all duration-300">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-rock-gold mb-4">
                Join Session
              </h2>
              <p className="text-rock-light">
                Enter a session code to join an existing jam!
              </p>
            </div>
            <form onSubmit={joinSession} className="space-y-4">
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                placeholder="Enter Session Code"
                maxLength={4}
                className="rock-input w-full text-center text-2xl tracking-[0.5em] 
                           placeholder:text-rock-light/30"
              />
              <button
                type="submit"
                disabled={!sessionCode || isJoining}
                className="rock-button w-full bg-rock-purple hover:bg-rock-purple/80 
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </span>
                ) : (
                  '⚡ Join Session'
                )}
              </button>
            </form>
          </div>
        </main>

        {/* Error Message */}
        {error && (
          <div className="fixed bottom-4 right-4 bg-rock-red text-white px-6 py-3 
                         rounded-lg shadow-lg animate-slide-up">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home; 