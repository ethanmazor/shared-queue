import { useState } from 'react';
import './SongSearch.css';

function SongSearch({ onSuggest, disabled }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (value) => {
    setSearchTerm(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(value)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data.tracks);
    } catch (err) {
      setError('Failed to search songs');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggest = (track) => {
    onSuggest(track);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className="song-search">
      <div className="search-input-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a song..."
          className="search-input"
          disabled={disabled}
        />
        {isLoading && <div className="search-spinner" />}
      </div>

      {error && <div className="search-error">{error}</div>}

      {searchResults.length > 0 && (
        <div className="search-results">
          {searchResults.map((track) => (
            <div
              key={track.id}
              className="search-result-item"
              onClick={() => handleSuggest(track)}
            >
              <img 
                src={track.album.images[2]?.url} 
                alt={track.album.name}
                className="result-album-art"
              />
              <div className="result-info">
                <div className="result-name">{track.name}</div>
                <div className="result-artist">
                  {track.artists.map(a => a.name).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SongSearch; 