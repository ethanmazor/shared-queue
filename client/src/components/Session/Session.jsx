import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSpotifyAuth } from '../../hooks/useSpotifyAuth';
import GenreVoting from './GenreVoting';
import SongVoting from './SongVoting';
import Queue from './Queue';
import SpotifyPlayer from '../Player/SpotifyPlayer';
import { io } from 'socket.io-client';
import './Session.css';

const SessionState = {
  WAITING: 'waiting',
  GENRE_VOTING: 'genre_voting',
  SONG_VOTING: 'song_voting',
  PLAYING: 'playing',
};

function Session() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useSpotifyAuth();
  const [socket, setSocket] = useState(null);
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [sessionState, setSessionState] = useState(SessionState.WAITING);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: {
        token: localStorage.getItem('spotify_token'),
      },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join_session', {
        sessionId,
        userId: user.id,
        userName: user.display_name,
      });
    });

    newSocket.on('session_updated', (sessionData) => {
      setSession(sessionData);
      setParticipants(sessionData.participants);
      setSessionState(sessionData.state);
      setIsHost(sessionData.hostId === user.id);
    });

    newSocket.on('error', (error) => {
      setError(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, user]);

  const handleStartSession = () => {
    if (!socket) return;

    socket.emit('start_session', {
      sessionId,
      hostId: user.id  // Make sure this matches the hostId stored in the session
    });

    // Add console log for debugging
    console.log('Emitting start_session event', { sessionId, hostId: user.id });
  };

  const endSession = () => {
    if (!isHost) return;
    socket.emit('end_session', { sessionId });
    navigate('/home');
  };

  // Add socket event listener for session updates
  useEffect(() => {
    if (!socket) return;

    socket.on('session_updated', (updatedSession) => {
      console.log('Received session_updated event', updatedSession);
      setSession(updatedSession);
      setSessionState(updatedSession.state);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      // Optionally add error handling UI
    });

    return () => {
      socket.off('session_updated');
      socket.off('error');
    };
  }, [socket]);

  if (error) {
    return (
      <div className="session-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/home')}>Return Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rock-black bg-opacity-95 text-rock-light pb-32">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Session Header */}
        <div className="bg-rock-gray border-2 border-rock-gold p-6 rounded-lg shadow-lg mb-8 animate-slide-up">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-rock-gold tracking-wider">
              Session: {sessionId}
            </h1>
            {isHost && (
              <div className="flex gap-4">
                {sessionState === 'waiting' && (
                  <button 
                    onClick={handleStartSession}
                    className="rock-button bg-rock-red hover:bg-rock-red/80"
                  >
                    Start Session 🤘
                  </button>
                )}
                <button 
                  onClick={endSession}
                  className="rock-button bg-rock-purple hover:bg-rock-purple/80"
                >
                  End Session ⚡
                </button>
              </div>
            )}
          </div>

          {/* Participants List */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-3 text-rock-gold">Band Members:</h2>
            <div className="flex flex-wrap gap-3">
              {session?.participants.map((participant) => (
                <div 
                  key={participant.userId}
                  className={`px-4 py-2 rounded-full border ${
                    participant.isHost 
                      ? 'border-rock-gold bg-rock-red text-white' 
                      : 'border-rock-purple bg-rock-gray text-rock-light'
                  } animate-pulse-glow`}
                >
                  {participant.userName}
                  {participant.isHost && ' 👑'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Session Content */}
        <main className="animate-slide-up">
          {sessionState === 'waiting' && (
            <div className="rock-card text-center py-12">
              <h2 className="text-2xl font-bold text-rock-gold mb-4">
                Waiting for the show to start...
              </h2>
              <p className="text-rock-light text-lg">
                {isHost ? 'Hit the Start button when everyone\'s ready! 🎸' 
                       : 'The host will start the session soon! 🤘'}
              </p>
            </div>
          )}

          {sessionState === 'genre_voting' && (
            <GenreVoting 
              socket={socket} 
              sessionId={sessionId}
              userId={user.id}
            />
          )}

          {sessionState === 'song_voting' && (
            <SongVoting 
              socket={socket} 
              sessionId={sessionId}
              userId={user.id}
            />
          )}

          {sessionState === 'playing' && (
            <div className="space-y-8">
              {isHost && (
                <SpotifyPlayer 
                  socket={socket} 
                  sessionId={sessionId} 
                />
              )}
              <Queue 
                socket={socket} 
                sessionId={sessionId}
                userId={user.id}
                isHost={isHost}
              />
            </div>
          )}
        </main>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-rock-red text-white px-6 py-3 rounded-lg shadow-lg animate-slide-up">
          {error}
        </div>
      )}
    </div>
  );
}

export default Session; 