import { useEffect, useState } from 'react';
import './NowPlaying.css';

function NowPlaying({ currentSong }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!currentSong) return;

    // Update progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 1000; // Add 1 second
        return newProgress > currentSong.duration_ms ? currentSong.progress_ms : newProgress;
      });
    }, 1000);

    // Reset progress when song changes
    setProgress(currentSong.progress_ms);

    return () => clearInterval(interval);
  }, [currentSong]);

  if (!currentSong) {
    return (
      <div className="now-playing">
        <div className="no-song-playing">
          <p>No song is currently playing</p>
        </div>
      </div>
    );
  }

  const progressPercent = (progress / currentSong.duration_ms) * 100;
  const timeRemaining = currentSong.duration_ms - progress;
  
  const formatTime = (ms) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000) / 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="now-playing">
      <div className="song-info">
        <img 
          src={currentSong.album.images[0].url} 
          alt={currentSong.name}
          className="album-art"
        />
        <div className="song-details">
          <h2 className="song-name">{currentSong.name}</h2>
          <p className="artist-name">
            {currentSong.artists.map(artist => artist.name).join(', ')}
          </p>
          <div className="time-remaining">
            {formatTime(timeRemaining)} remaining
          </div>
        </div>
      </div>

      <div className="progress-container">
        <div className="time-display current-time">
          {formatTime(progress)}
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="time-display duration">
          {formatTime(currentSong.duration_ms)}
        </div>
      </div>
    </div>
  );
}

export default NowPlaying; 