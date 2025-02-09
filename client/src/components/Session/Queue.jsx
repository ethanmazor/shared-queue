import { useState, useEffect } from 'react';
import { useSpotifyAuth } from '../../hooks/useSpotifyAuth';
import './Queue.css';

function Queue({ socket, sessionId, isHost }) {
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useSpotifyAuth();

  useEffect(() => {
    if (!socket) return;

    socket.on('queue_updated', (queueData) => {
      setQueue(queueData.queue);
      setCurrentSong(queueData.currentSong);
    });

    // Initial queue fetch
    socket.emit('get_queue', { sessionId });

    return () => {
      socket.off('queue_updated');
    };
  }, [socket, sessionId]);

  // Debounced search
  useEffect(() => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
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
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const addToQueue = (track) => {
    socket.emit('add_to_queue', {
      sessionId,
      song: {
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        albumArt: track.album.images[0].url,
        duration: track.duration_ms,
        uri: track.uri,
        addedBy: user.display_name,
        addedAt: new Date().toISOString(),
      },
    });

    setSearchTerm('');
    setSearchResults([]);
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="rock-card mb-8">
        <h2 className="text-2xl font-bold text-rock-gold mb-6">
          Now Playing 🎸
        </h2>
        {currentSong ? (
          <div className="flex items-center gap-6">
            <img 
              src={currentSong.albumArt}
              alt={currentSong.name}
              className="w-24 h-24 rounded-lg border-2 border-rock-gold shadow-lg"
            />
            <div className="flex-1">
              <div className="text-xl font-bold text-rock-gold mb-1">
                {currentSong.name}
              </div>
              <div className="text-rock-light">
                {currentSong.artist}
              </div>
              <div className="text-sm text-rock-light mt-2">
                Added by {currentSong.addedBy}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-rock-light text-center py-4">
            No track playing
          </p>
        )}
      </div>

      <div className="rock-card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-rock-gold">
            Up Next 🤘
          </h2>
          <input
            type="text"
            placeholder="Search for tracks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rock-input w-64"
          />
        </div>

        <div className="space-y-4">
          {queue.map((song, index) => (
            <div 
              key={`${song.id}-${index}`}
              className="flex items-center gap-4 p-4 bg-rock-gray/50 rounded-lg"
            >
              <span className="text-2xl font-bold text-rock-red w-8">
                {index + 1}
              </span>
              <img 
                src={song.albumArt}
                alt={song.name}
                className="w-16 h-16 rounded border border-rock-gold"
              />
              <div className="flex-1">
                <div className="font-bold text-rock-gold">{song.name}</div>
                <div className="text-rock-light">{song.artist}</div>
                <div className="text-sm text-rock-light mt-1">
                  Added by {song.addedBy}
                </div>
              </div>
              <div className="text-right">
                <div className="text-rock-gold font-bold">
                  {song.votes} votes
                </div>
                <div className="text-sm text-rock-light">
                  {formatDuration(song.duration)}
                </div>
              </div>
            </div>
          ))}

          {queue.length === 0 && (
            <div className="text-center py-8 text-rock-light">
              Queue is empty. Add some tracks! 🎸
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Queue; 