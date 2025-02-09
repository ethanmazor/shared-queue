import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './components/Home/Home';
import Session from './components/Session/Session';
import SpotifyCallback from './components/Landing/SpotifyCallback';

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/callback" element={<SpotifyCallback />} />
          <Route path="/session/:sessionId" element={<Session />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
