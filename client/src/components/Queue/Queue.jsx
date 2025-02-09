import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './Queue.css';

function Queue({ socket, sessionId }) {
  const [queue, setQueue] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (!socket) return;

    // Listen for queue updates
    socket.on('queue_updated', (updatedQueue) => {
      setQueue(updatedQueue);
    });

    // Join the session room
    socket.emit('join_session', sessionId);

    return () => {
      socket.off('queue_updated');
    };
  }, [socket, sessionId]);

  const searchSpotify = async (term) => {
    if (!term) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = await getAccessTokenSilently({
        audience: 'https://api.spotify.com',
      });

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(term)}&type=track&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      setSearchResults(data.tracks.items);
    } catch (error) {
      console.error('Error searching Spotify:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchSpotify(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const addToQueue = (track) => {
    if (!socket) return;

    const songData = {
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      duration: track.duration_ms,
      uri: track.uri,
      albumArt: track.album.images[0]?.url,
      addedBy: 'User', // We'll update this when we have user info
      addedAt: new Date().toISOString(),
    };

    socket.emit('add_song', { sessionId, song: songData });
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="queue-container">
      <div className="search-section">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for songs to add..."
          className="search-input"
        />
        
        {/* Search Results */}
        <div className="search-results">
          {isSearching ? (
            <div className="loading">Searching...</div>
          ) : (
            searchResults.map((track) => (
              <div 
                key={track.id} 
                className="search-result-item"
                onClick={() => addToQueue(track)}
              >
                <img 
                  src={track.album.images[2]?.url} 
                  alt={track.album.name}
                  className="track-image"
                />
                <div className="track-info">
                  <div className="track-name">{track.name}</div>
                  <div className="track-artist">{track.artists[0].name}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Queue List */}
      <div className="queue-list">
        <h3>Current Queue</h3>
        {queue.length === 0 ? (
          <div className="empty-queue">Queue is empty. Add some songs!</div>
        ) : (
          queue.map((song, index) => (
            <div key={song.id} className="queue-item">
              <span className="queue-position">{index + 1}</span>
              <img 
                src={song.albumArt} 
                alt={song.name}
                className="queue-track-image"
              />
              <div className="queue-track-info">
                <div className="queue-track-name">{song.name}</div>
                <div className="queue-track-artist">{song.artist}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Queue; 