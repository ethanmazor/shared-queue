import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './components/Home/Home';
import Session from './components/Session/Session';
import SpotifyCallback from './components/Landing/SpotifyCallback';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          {/* Redirect /home to / */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          
          {/* Main routes */}
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<SpotifyCallback />} />
          <Route path="/session/:sessionId" element={<Session />} />
          
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
