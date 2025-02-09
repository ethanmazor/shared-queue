require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sessionManager = require('./sessionManager');
const spotifyAuth = require('./controllers/spotifyAuth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on('connection', (socket) => {
  const sessionId = socket.handshake.query.sessionId;
  console.log(`Client connected to session ${sessionId}`);

  // Join the session room
  socket.join(sessionId);

  // Check if this is the host (first to join creates the session)
  const session = sessionManager.getSession(sessionId);
  if (!session) {
    sessionManager.createSession(sessionId, socket.id);
    socket.emit('host_status', true);
  } else {
    sessionManager.addParticipant(sessionId, socket.id);
    socket.emit('host_status', false);
  }

  // Send current session state
  const currentSession = sessionManager.getSession(sessionId);
  if (currentSession) {
    socket.emit('suggestions_update', Array.from(currentSession.suggestions.values()));
    socket.emit('votes_update', Array.from(currentSession.votes.entries()));
  }

  // Handle song suggestions
  socket.on('suggest_song', async ({ suggestion }) => {
    try {
      const session = sessionManager.getSession(sessionId);
      if (!session || session.phase !== 'suggestion') return;

      const searchResult = await spotifyAuth.searchTracks(session.hostId, suggestion);
      if (!searchResult.body.tracks.items.length) return;

      const track = searchResult.body.tracks.items[0];
      const formattedSuggestion = {
        id: track.id,
        name: track.name,
        artist: track.artists[0].name,
        uri: track.uri,
        userId: socket.id
      };

      sessionManager.addSuggestion(sessionId, socket.id, formattedSuggestion);
      io.to(sessionId).emit('suggestions_update', 
        Array.from(session.suggestions.values())
      );
    } catch (error) {
      console.error('Suggestion error:', error);
    }
  });

  // Handle votes
  socket.on('vote', ({ songId }) => {
    const session = sessionManager.getSession(sessionId);
    if (!session || session.phase !== 'voting') return;

    sessionManager.addVote(sessionId, socket.id, songId);
    
    // Broadcast updated votes to all clients in session
    io.to(sessionId).emit('votes_update', 
      Array.from(session.votes.entries())
    );
  });

  // Handle session end
  socket.on('end_session', ({ sessionId }) => {
    const session = sessionManager.getSession(sessionId);
    if (session && session.hostId === socket.id) {
      sessionManager.endSession(sessionId);
      io.to(sessionId).emit('session_ended');
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected from session ${sessionId}`);
    const session = sessionManager.getSession(sessionId);
    
    // If host disconnects, end the session
    if (session && session.hostId === socket.id) {
      sessionManager.endSession(sessionId);
      io.to(sessionId).emit('session_ended');
    }
  });
});

// Song progress update interval
setInterval(async () => {
  for (const [sessionId, session] of sessionManager.sessions.entries()) {
    if (session.hostId) {
      try {
        const currentPlayback = await spotifyAuth.getCurrentPlayback(session.hostId);

        if (currentPlayback.body && currentPlayback.body.is_playing) {
          const currentSong = currentPlayback.body.item;
          const progress = currentPlayback.body.progress_ms;
          
          // Update phase based on song progress
          const phaseInfo = sessionManager.updatePhase(
            sessionId, 
            progress, 
            currentSong.duration_ms
          );

          io.to(sessionId).emit('phase_update', {
            phase: phaseInfo.phase,
            timeRemaining: phaseInfo.timeRemaining,
            winner: phaseInfo.winner
          });

          if (phaseInfo.phase === 'locked' && phaseInfo.winner && !session.winnerQueued) {
            await spotifyAuth.addToQueue(session.hostId, phaseInfo.winner.uri);
            session.winnerQueued = true;
          }

          io.to(sessionId).emit('current_song', {
            ...currentSong,
            progress_ms: progress,
            duration_ms: currentSong.duration_ms
          });
        }
      } catch (error) {
        console.error('Playback update error:', error);
      }
    }
  }
}, 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 