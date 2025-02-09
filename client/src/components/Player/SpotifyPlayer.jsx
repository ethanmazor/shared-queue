import { useState, useEffect } from 'react';
import './SpotifyPlayer.css';

function SpotifyPlayer({ socket, sessionId }) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Music Jam Player',
        getOAuthToken: cb => cb(localStorage.getItem('spotify_token')),
        volume: volume / 100
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Failed to initialize:', message);
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Failed to authenticate:', message);
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Failed to validate Spotify account:', message);
      });

      // Playback status updates
      spotifyPlayer.addListener('player_state_changed', state => {
        if (!state) return;

        setCurrentTrack(state.track_window.current_track);
        setIsPlaying(!state.paused);
        setProgress(state.position);

        // Emit current playback state to other users
        socket.emit('playback_update', {
          sessionId,
          currentTrack: state.track_window.current_track,
          isPlaying: !state.paused,
          position: state.position
        });

        // Check if song is near end to trigger next song vote
        if (state.duration - state.position <= 30000) { // 30 seconds before end
          socket.emit('trigger_next_song_vote', { sessionId });
        }
      });

      // Ready
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        socket.emit('player_ready', { sessionId, deviceId: device_id });
      });

      spotifyPlayer.connect();
      setPlayer(spotifyPlayer);
    };

    return () => {
      if (player) {
        player.disconnect();
      }
    };
  }, [sessionId, socket]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('play_track', async ({ uri, position = 0 }) => {
      try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('spotify_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uris: [uri],
            position_ms: position,
          }),
        });
      } catch (error) {
        console.error('Failed to play track:', error);
      }
    });

    return () => {
      socket.off('play_track');
    };
  }, [socket, deviceId]);

  // Progress bar update
  useEffect(() => {
    let intervalId;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setProgress(prev => prev + 1000); // Update every second
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isPlaying]);

  const togglePlay = async () => {
    if (!player) return;
    await player.togglePlay();
  };

  const handleVolumeChange = async (newVolume) => {
    if (!player) return;
    await player.setVolume(newVolume / 100);
    setVolume(newVolume);
  };

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-rock-black border-t-2 border-rock-gold">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-6">
            <div className="w-full text-center text-rock-light py-4">
              Ready to rock! 🤘
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-rock-black border-t-2 border-rock-gold">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-6">
          {currentTrack ? (
            <>
              <div className="flex items-center gap-4">
                <img 
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.name}
                  className="w-16 h-16 rounded border border-rock-gold"
                />
                <div>
                  <div className="font-bold text-rock-gold">
                    {currentTrack.name}
                  </div>
                  <div className="text-rock-light text-sm">
                    {currentTrack.artists[0].name}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-center gap-8">
                  <button 
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-rock-red flex items-center justify-center
                             hover:bg-rock-red/80 transition-all duration-300"
                  >
                    {isPlaying ? '⏸' : '▶️'}
                  </button>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <span className="text-rock-light text-sm">
                    {formatTime(progress)}
                  </span>
                  <div className="flex-1 h-2 bg-rock-gray rounded-full">
                    <div 
                      className="h-full bg-rock-red rounded-full"
                      style={{ 
                        width: `${(progress / currentTrack.duration_ms) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-rock-light text-sm">
                    {formatTime(currentTrack.duration_ms)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-rock-light">🔊</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-24"
                />
              </div>
            </>
          ) : (
            <div className="w-full text-center text-rock-light py-4">
              Ready to rock! 🤘
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SpotifyPlayer; 