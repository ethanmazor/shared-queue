const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  hostId: {
    type: String,
    required: true
  },
  state: {
    type: String,
    enum: ['waiting', 'genre_voting', 'song_voting', 'playing'],
    default: 'waiting'
  },
  participants: [{
    userId: String,
    userName: String,
    isHost: Boolean
  }],
  selectedGenres: [{
    genre: String,
    votes: Number
  }],
  queue: [{
    id: String,
    name: String,
    artist: String,
    albumArt: String,
    duration: Number,
    uri: String,
    addedBy: String,
    addedAt: Date,
    votes: Number
  }],
  currentSong: {
    id: String,
    name: String,
    artist: String,
    albumArt: String,
    duration: Number,
    uri: String,
    startedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', sessionSchema); 