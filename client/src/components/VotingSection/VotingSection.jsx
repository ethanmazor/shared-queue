import { useState } from 'react';
import './VotingSection.css';

function VotingSection({ suggestions, votes, onVote, timeRemaining, hasVoted, isLocked }) {
  const [selectedSong, setSelectedSong] = useState(null);

  const handleVote = (songId) => {
    setSelectedSong(songId);
    onVote(songId);
  };

  // Sort suggestions by vote count
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const votesA = votes.get(a.id) || 0;
    const votesB = votes.get(b.id) || 0;
    return votesB - votesA;
  });

  const isVotingLocked = isLocked || timeRemaining <= 10000; // 10 seconds or less

  return (
    <div className="voting-section">
      <div className="voting-header">
        <h2>Vote for Next Song</h2>
        {isVotingLocked ? (
          <div className="voting-locked">Voting Locked</div>
        ) : (
          <div className="time-remaining">
            {Math.floor(timeRemaining / 1000)}s remaining
          </div>
        )}
      </div>

      <div className="suggestions-grid">
        {sortedSuggestions.map((suggestion) => {
          const voteCount = votes.get(suggestion.id) || 0;
          const isSelected = selectedSong === suggestion.id;
          
          return (
            <div 
              key={suggestion.id}
              className={`suggestion-card ${isSelected ? 'selected' : ''}`}
            >
              <div className="suggestion-info">
                <h3>{suggestion.name}</h3>
                <p>{suggestion.artist}</p>
              </div>

              <div className="vote-info">
                <div className="vote-count">
                  <span className="count">{voteCount}</span>
                  <span className="label">votes</span>
                </div>

                <button
                  className="vote-button"
                  onClick={() => handleVote(suggestion.id)}
                  disabled={isVotingLocked || hasVoted}
                >
                  {isSelected ? 'Voted' : 'Vote'}
                </button>
              </div>

              <div 
                className="vote-progress"
                style={{
                  width: `${(voteCount / Math.max(...Array.from(votes.values()), 1)) * 100}%`
                }}
              />
            </div>
          );
        })}
      </div>

      {hasVoted && !isVotingLocked && (
        <p className="vote-message">You've cast your vote!</p>
      )}

      {isVotingLocked && (
        <p className="lock-message">
          Voting is locked! The winning song will be added to the queue.
        </p>
      )}
    </div>
  );
}

export default VotingSection; 