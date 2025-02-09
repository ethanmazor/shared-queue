import { useState, useEffect } from 'react';
import './GenreVoting.css';

const GENRES = [
  'Pop', 'Hip-Hop', 'Rock', 'R&B', 'Electronic/Dance',
  'Latin', 'Indie', 'Jazz', 'Classical', 'Country'
];

function GenreVoting({ socket, sessionId, userId }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [votingResults, setVotingResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds voting period
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('genre_voting_results', (results) => {
      setVotingResults(results);
    });

    socket.on('voting_time_update', (time) => {
      setTimeLeft(time);
    });

    return () => {
      socket.off('genre_voting_results');
      socket.off('voting_time_update');
    };
  }, [socket]);

  const handleGenreSelect = (genre) => {
    if (hasVoted) return;

    setSelectedGenres((prev) => {
      // Allow selecting up to 3 genres
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      } else if (prev.length < 3) {
        return [...prev, genre];
      }
      return prev;
    });
  };

  const submitVote = () => {
    if (hasVoted || selectedGenres.length === 0) return;

    socket.emit('submit_genre_votes', {
      sessionId,
      userId,
      genres: selectedGenres
    });

    setHasVoted(true);
  };

  if (votingResults) {
    return (
      <div className="genre-voting-results">
        <h2>Voting Results</h2>
        <div className="results-container">
          {Object.entries(votingResults)
            .sort(([,a], [,b]) => b - a)
            .map(([genre, votes]) => (
              <div key={genre} className="result-bar">
                <div className="genre-name">{genre}</div>
                <div className="vote-bar">
                  <div 
                    className="vote-fill" 
                    style={{ width: `${(votes / votingResults.totalVotes) * 100}%` }}
                  />
                </div>
                <div className="vote-count">{votes}</div>
              </div>
            ))}
        </div>
        <p>Generating playlist based on your group's taste...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-rock-gold mb-2">Pick Your Genres</h2>
        <p className="text-rock-light text-lg">
          Time left: <span className="text-rock-red font-bold">{timeLeft}s</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {GENRES.map((genre) => (
          <button
            key={genre}
            onClick={() => handleGenreSelect(genre)}
            disabled={selectedGenres.length >= 3 && !selectedGenres.includes(genre)}
            className={`relative p-4 border-2 rounded-lg transition-all duration-300
              ${selectedGenres.includes(genre)
                ? 'border-rock-red bg-rock-red/20 text-white animate-pulse-glow'
                : 'border-rock-gold bg-rock-gray/50 text-rock-light hover:bg-rock-gray'
              }
              ${selectedGenres.length >= 3 && !selectedGenres.includes(genre)
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer hover:scale-105'
              }`}
          >
            {genre}
            {selectedGenres.includes(genre) && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-rock-gold 
                             rounded-full flex items-center justify-center text-rock-black 
                             font-bold border-2 border-rock-red">
                {selectedGenres.indexOf(genre) + 1}
              </span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={submitVote}
        disabled={selectedGenres.length === 0 || hasVoted}
        className={`mt-8 rock-button w-full max-w-md mx-auto block
          ${hasVoted 
            ? 'bg-rock-purple cursor-not-allowed' 
            : 'bg-rock-red hover:bg-rock-red/80'}`}
      >
        {hasVoted ? '🤘 Vote Submitted!' : '🎸 Submit Vote'}
      </button>

      {votingResults && (
        <div className="mt-8 rock-card">
          <h3 className="text-xl font-bold text-rock-gold mb-4">Current Results</h3>
          <div className="space-y-4">
            {votingResults.map((result) => (
              <div key={result.genre} className="flex items-center gap-4">
                <span className="w-24 text-right font-bold">{result.genre}</span>
                <div className="flex-1 bg-rock-gray rounded-full h-4 overflow-hidden">
                  <div 
                    className="h-full bg-rock-red transition-all duration-500"
                    style={{ width: `${(result.votes / maxVotes) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-rock-gold">{result.votes}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GenreVoting; 