import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import LoginButton from './Auth/LoginButton';
import LogoutButton from './Auth/LogoutButton';

function Home() {
  const { isAuthenticated, user } = useAuth0();
  const navigate = useNavigate();

  const createSession = () => {
    const sessionId = `session-${Date.now()}`;
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="home-container">
      <h1>Spotify Jam Clone</h1>
      
      {!isAuthenticated ? (
        <div className="auth-section">
          <p>Please log in to create or join a session</p>
          <LoginButton />
        </div>
      ) : (
        <div className="user-section">
          <p>Welcome, {user?.name}!</p>
          <button onClick={createSession} className="create-session-btn">
            Create New Session
          </button>
          <LogoutButton />
        </div>
      )}
    </div>
  );
}

export default Home; 