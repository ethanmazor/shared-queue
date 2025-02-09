const Session = require('../models/Session');
const recommendationService = require('../services/recommendationService');

module.exports = (io, socket) => {
  // Track votes per user to prevent double voting
  const userVotes = new Map();

  // Join session room
  socket.on('join_session', async ({ sessionId, userId, userName }) => {
    try {
      socket.join(sessionId);
      
      // Get current session state
      const session = await Session.findOne({ sessionId });
      if (session) {
        io.to(sessionId).emit('session_updated', session);
      }
      
      console.log(`User ${userName} joined session ${sessionId}`);
    } catch (error) {
      socket.emit('error', { message: 'Error joining session' });
      console.error('Error joining session:', error);
    }
  });

  // Start session
  socket.on('start_session', async ({ sessionId, hostId }) => {
    try {
      const session = await Session.findOne({ sessionId });
      if (session && session.hostId === hostId) {
        session.state = 'genre_voting';
        await session.save();
        
        // Start 30-second timer for genre voting
        let timeLeft = 30;
        const timer = setInterval(async () => {
          timeLeft--;
          io.to(sessionId).emit('voting_time_update', timeLeft);
          
          if (timeLeft <= 0) {
            clearInterval(timer);
            // Move to song voting phase
            session.state = 'song_voting';
            await session.save();
            io.to(sessionId).emit('session_updated', session);
          }
        }, 1000);

        io.to(sessionId).emit('session_updated', session);
      }
    } catch (error) {
      socket.emit('error', { message: 'Error starting session' });
      console.error('Error starting session:', error);
    }
  });

  // Handle genre votes
  socket.on('submit_genre_votes', async ({ sessionId, userId, genres }) => {
    try {
      if (userVotes.get(`${sessionId}-${userId}-genre`)) {
        return socket.emit('error', { message: 'Already voted' });
      }

      const session = await Session.findOne({ sessionId });
      if (session && session.state === 'genre_voting') {
        // Update genre votes
        genres.forEach(genre => {
          const existingGenre = session.selectedGenres.find(g => g.genre === genre);
          if (existingGenre) {
            existingGenre.votes += 1;
          } else {
            session.selectedGenres.push({ genre, votes: 1 });
          }
        });

        userVotes.set(`${sessionId}-${userId}-genre`, true);
        await session.save();
        
        io.to(sessionId).emit('genre_voting_results', session.selectedGenres);

        // Check if all participants have voted
        const totalVotes = session.selectedGenres.reduce((acc, genre) => acc + genre.votes, 0);
        if (totalVotes >= session.participants.length * 3) { // Each user votes for 3 genres
          session.state = 'song_voting';
          await session.save();
          io.to(sessionId).emit('session_updated', session);
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Error submitting genre votes' });
      console.error('Error submitting genre votes:', error);
    }
  });

  socket.on('submit_song_suggestion', async ({ sessionId, userId, song }) => {
    try {
      const session = await Session.findOne({ sessionId });
      if (session && session.state === 'song_voting') {
        session.queue.push({
          ...song,
          votes: 0,
          voters: []
        });
        await session.save();
        io.to(sessionId).emit('song_suggestions_updated', session.queue);
      }
    } catch (error) {
      socket.emit('error', { message: 'Error submitting song suggestion' });
      console.error('Error submitting song suggestion:', error);
    }
  });

  socket.on('submit_song_vote', async ({ sessionId, userId, songId }) => {
    try {
      if (userVotes.get(`${sessionId}-${userId}-song-${songId}`)) {
        return socket.emit('error', { message: 'Already voted for this song' });
      }

      const session = await Session.findOne({ sessionId });
      if (session && session.state === 'song_voting') {
        const song = session.queue.find(s => s.id === songId);
        if (song) {
          song.votes += 1;
          song.voters.push(userId);
          userVotes.set(`${sessionId}-${userId}-song-${songId}`, true);
          await session.save();
          
          io.to(sessionId).emit('queue_updated', {
            queue: session.queue,
            currentSong: session.currentSong
          });

          // Check if all participants have voted
          const totalVoters = new Set(session.queue.flatMap(s => s.voters)).size;
          if (totalVoters >= session.participants.length) {
            // Sort queue by votes and start playing
            session.queue.sort((a, b) => b.votes - a.votes);
            session.state = 'playing';
            session.currentSong = session.queue.shift();
            await session.save();
            
            io.to(sessionId).emit('session_updated', session);
            io.to(sessionId).emit('play_track', {
              uri: session.currentSong.uri,
              position: 0
            });
          }
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Error submitting song vote' });
      console.error('Error submitting song vote:', error);
    }
  });

  // Handle playback updates
  socket.on('playback_update', async ({ sessionId, position }) => {
    try {
      const session = await Session.findOne({ sessionId });
      if (session && session.state === 'playing') {
        // If near end of song, prepare for next song
        if (session.currentSong && position >= session.currentSong.duration - 10000) { // 10 seconds before end
          if (session.queue.length > 0) {
            session.currentSong = session.queue.shift();
            await session.save();
            
            io.to(sessionId).emit('session_updated', session);
            io.to(sessionId).emit('play_track', {
              uri: session.currentSong.uri,
              position: 0
            });
          } else {
            // Queue is empty, trigger new voting round
            session.state = 'genre_voting';
            session.selectedGenres = [];
            session.currentSong = null;
            await session.save();
            
            io.to(sessionId).emit('session_updated', session);
          }
        }
      }
    } catch (error) {
      console.error('Error updating playback:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('request_recommendations', async ({ sessionId }) => {
    try {
      const session = await Session.findOne({ sessionId });
      if (session) {
        const recommendations = await recommendationService.generateRecommendations(session);
        
        // Add recommendations to the queue with AI confidence scores
        recommendations.forEach(track => {
          if (!session.queue.some(song => song.id === track.id)) {
            session.queue.push({
              ...track,
              votes: Math.floor(track.aiConfidence / 20), // Convert confidence to initial votes
              voters: ['AI'],
              addedBy: 'AI DJ'
            });
          }
        });

        await session.save();
        
        io.to(sessionId).emit('queue_updated', {
          queue: session.queue,
          currentSong: session.currentSong
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Error generating recommendations' });
      console.error('Error generating recommendations:', error);
    }
  });
}; 