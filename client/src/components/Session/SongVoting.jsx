import { useState, useEffect } from 'react';
import './SongVoting.css';

function SongVoting({ socket, sessionId, userId }) {
  const [songSuggestions, setSongSuggestions] = useState([]);
  const [votedSong, setVotedSong] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [votingPhase, setVotingPhase] = useState(false);
  const [votingResults, setVotingResults] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('song_suggestions_updated', (suggestions) => {
      setSongSuggestions(suggestions);
      setVotingPhase(true);
    });

    socket.on('voting_time_update', (time) => {
      setTimeLeft(time);
    });

    socket.on('voting_results', (results) => {
      setVotingResults(results);
    });

    return () => {
      socket.off('song_suggestions_updated');
      socket.off('voting_time_update');
      socket.off('voting_results');
    };
  }, [socket]);

  // Debounced search function
  useEffect(() => {
    if (!searchTerm || hasSubmitted) return;

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/spotify/search?q=${encodeURIComponent(searchTerm)}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('spotify_token')}`,
            },
          }
        );
        const data = await response.json();
        setSearchResults(data.tracks.slice(0, 5));
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, hasSubmitted]);

  const submitSongSuggestion = (song) => {
    if (hasSubmitted) return;

    socket.emit('submit_song_suggestion', {
      sessionId,
      userId,
      song: {
        id: song.id,
        name: song.name,
        artist: song.artists[0].name,
        albumArt: song.album.images[0].url,
        duration: song.duration_ms,
        uri: song.uri,
      },
    });

    setHasSubmitted(true);
    setSearchTerm('');
    setSearchResults([]);
  };

  const submitVote = (songId) => {
    if (votedSong) return;

    socket.emit('submit_song_vote', {
      sessionId,
      userId,
      songId,
    });

    setVotedSong(songId);
  };

  if (votingResults) {
    return (
      <div className="voting-results">
        <h2>Next Song Selected!</h2>
        <div className="winning-song">
          <img 
            src={votingResults.winner.albumArt} 
            alt={votingResults.winner.name} 
          />
          <div className="song-info">
            <h3>{votingResults.winner.name}</h3>
            <p>{votingResults.winner.artist}</p>
          </div>
        </div>
      </div>
    );
  }

  if (votingPhase) {
    return (
      <div className="voting-phase">
        <h2>Vote for the Next Song</h2>
        <p>Time left: {timeLeft}s</p>
        
        <div className="song-suggestions">
          {songSuggestions.map((song) => (
            <div 
              key={song.id} 
              className={`song-card ${votedSong === song.id ? 'voted' : ''}`}
              onClick={() => submitVote(song.id)}
            >
              <img src={song.albumArt} alt={song.name} />
              <div className="song-details">
                <h3>{song.name}</h3>
                <p>{song.artist}</p>
              </div>
              {votedSong === song.id && (
                <div className="vote-indicator">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-rock-gold mb-2">Suggest Your Track</h2>
        <p className="text-rock-light text-lg">
          Time left: <span className="text-rock-red font-bold">{timeLeft}s</span>
        </p>
      </div>

      {!hasSubmitted ? (
        <div className="rock-card">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for a song..."
            className="w-full rock-input mb-4"
          />

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {searchResults.map((song) => (
              <div 
                key={song.id}
                onClick={() => submitSongSuggestion(song)}
                className="flex items-center gap-4 p-4 bg-rock-gray/50 rounded-lg
                          cursor-pointer hover:bg-rock-gray transition-all duration-300"
              >
                <img 
                  src={song.album.images[2].url}
                  alt={song.name}
                  className="w-12 h-12 rounded border border-rock-gold"
                />
                <div className="flex-1">
                  <div className="font-bold text-rock-gold">{song.name}</div>
                  <div className="text-rock-light text-sm">{song.artists[0].name}</div>
                </div>
                <span className="text-rock-light text-sm">
                  {formatDuration(song.duration_ms)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rock-card text-center py-12">
          <p className="text-2xl font-bold text-rock-gold mb-4">
            🎸 Track Submitted!
          </p>
          <p className="text-rock-light">
            Waiting for other rockers to make their picks...
          </p>
        </div>
      )}

      {votingResults && (
        <div className="mt-8 rock-card">
          <h3 className="text-xl font-bold text-rock-gold mb-4">Voting Results</h3>
          <div className="space-y-4">
            {votingResults.map((song) => (
              <div key={song.id} className="flex items-center gap-4">
                <img 
                  src={song.albumArt}
                  alt={song.name}
                  className="w-16 h-16 rounded border border-rock-gold"
                />
                <div className="flex-1">
                  <div className="font-bold text-rock-gold">{song.name}</div>
                  <div className="text-rock-light">{song.artist}</div>
                  <div className="mt-2 bg-rock-gray rounded-full h-3">
                    <div 
                      className="h-full bg-rock-red rounded-full"
                      style={{ width: `${(song.votes / maxVotes) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-2xl font-bold text-rock-gold">
                  {song.votes}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SongVoting; 