import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import "./Session.css";
import SongSearch from "../components/SongSearch/SongSearch";
import VotingSection from "../components/VotingSection/VotingSection";

function Session() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [phase, setPhase] = useState("suggestion"); // 'suggestion' or 'voting'
  const [suggestion, setSuggestion] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [votes, setVotes] = useState(new Map());
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [winner, setWinner] = useState(null);
  const [hasSuggested, setHasSuggested] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    // Connect to Socket.IO server
    const newSocket = io(import.meta.env.VITE_API_URL, {
      query: { sessionId },
    });

    // Socket event handlers
    newSocket.on("connect", () => {
      console.log("Connected to session");
    });

    newSocket.on("host_status", (status) => {
      setIsHost(status);
    });

    newSocket.on("current_song", (song) => {
      setCurrentSong(song);
      // Update phase based on song progress
      const halfwayPoint = song.duration_ms / 2;
      setPhase(song.progress_ms < halfwayPoint ? "suggestion" : "voting");
    });

    newSocket.on("suggestions_update", (newSuggestions) => {
      setSuggestions(newSuggestions);
    });

    newSocket.on("votes_update", (newVotes) => {
      setVotes(new Map(newVotes));
    });

    newSocket.on("session_ended", () => {
      navigate("/");
    });

    newSocket.on("phase_update", ({ phase, timeRemaining, winner }) => {
      setPhase(phase);
      setTimeRemaining(timeRemaining);
      setWinner(winner);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [sessionId, navigate]);

  const handleSuggestSong = async (track) => {
    try {
      if (hasSuggested) {
        setError("You can only suggest one song per round");
        return;
      }

      socket.emit("suggest_song", {
        sessionId,
        suggestion: {
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          uri: track.uri,
        },
      });

      setHasSuggested(true);
    } catch (err) {
      setError("Failed to suggest song");
    }
  };

  const handleVote = (songId) => {
    if (hasVoted || phase !== "voting") return;

    socket.emit("vote", {
      sessionId,
      songId,
    });

    setHasVoted(true);
  };

  const handleEndSession = () => {
    if (isHost) {
      socket.emit("end_session", { sessionId });
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const PhaseTimer = () => {
    const seconds = Math.max(0, Math.floor(timeRemaining / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return (
      <div className="phase-timer">
        {minutes}:{remainingSeconds.toString().padStart(2, "0")} remaining
      </div>
    );
  };

  useEffect(() => {
    if (phase === "suggestion") {
      setHasVoted(false);
    }
  }, [phase]);

  return (
    <div className="session-container">
      <header className="session-header">
        <h1>Session: {sessionId}</h1>
        {isHost && (
          <button onClick={handleEndSession} className="end-session-btn">
            End Session
          </button>
        )}
        <button onClick={handleBackToHome} className="back-to-home-button">
          Back to Home
        </button>
      </header>

      {currentSong && (
        <div className="now-playing">
          <h2>Now Playing</h2>
          <div className="song-info">
            <img
              src={currentSong.album.images[0].url}
              alt={currentSong.name}
              className="album-art"
            />
            <div className="song-details">
              <h3>{currentSong.name}</h3>
              <p>{currentSong.artists.map((a) => a.name).join(", ")}</p>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress"
              style={{
                width: `${
                  (currentSong.progress_ms / currentSong.duration_ms) * 100
                }%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="phase-indicator">
        <div className="phase-info">
          {phase === "suggestion" && "Suggestion Phase"}
          {phase === "voting" && "Voting Phase"}
          {phase === "locked" && "Voting Locked"}
          {phase === "waiting" && "Waiting for song..."}
        </div>
        {phase !== "waiting" && <PhaseTimer />}
        {winner && phase === "locked" && (
          <div className="winner-announcement">
            Next Song: {winner.name} by {winner.artist}
          </div>
        )}
      </div>

      {phase === "suggestion" && (
        <div className="suggestion-section">
          <h2>Suggest a Song</h2>
          <SongSearch onSuggest={handleSuggestSong} disabled={hasSuggested} />
          <div className="suggestions-list">
            <h3>Current Suggestions</h3>
            {suggestions.map((s) => (
              <div key={s.id} className="suggestion-item">
                <span className="suggestion-name">{s.name}</span>
                <span className="suggestion-artist">{s.artist}</span>
                {s.userId === socket.id && (
                  <span className="your-suggestion-badge">Your suggestion</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "voting" && (
        <VotingSection
          suggestions={suggestions}
          votes={votes}
          onVote={handleVote}
          timeRemaining={timeRemaining}
          hasVoted={hasVoted}
          isLocked={phase === "locked"}
        />
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default Session;
