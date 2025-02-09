class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(sessionId, hostId) {
    const session = {
      id: sessionId,
      hostId: hostId,
      participants: new Set([hostId]),
      currentSong: null,
      suggestions: new Map(), // userId -> suggestion
      votes: new Map(), // songId -> Set of userIds who voted
      phase: 'waiting', // 'waiting', 'suggestion', 'voting', 'locked'
      phaseStartTime: Date.now(),
      winner: null
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  updatePhase(sessionId, currentSongProgress, songDuration) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const halfwayPoint = songDuration / 2;
    const tenSecondsFromEnd = songDuration - 10000;

    // Determine the new phase
    let newPhase;
    if (currentSongProgress < halfwayPoint) {
      newPhase = 'suggestion';
    } else if (currentSongProgress >= halfwayPoint && currentSongProgress < tenSecondsFromEnd) {
      newPhase = 'voting';
    } else {
      newPhase = 'locked';
    }

    // If phase has changed
    if (newPhase !== session.phase) {
      session.phase = newPhase;
      session.phaseStartTime = Date.now();

      // Handle phase transitions
      if (newPhase === 'voting') {
        // Convert suggestions to votable options
        session.votableOptions = new Map(session.suggestions);
        session.suggestions.clear();
      } else if (newPhase === 'locked') {
        // Determine winner
        this.determineWinner(sessionId);
      } else if (newPhase === 'suggestion') {
        // Reset for new round
        session.suggestions.clear();
        session.votes.clear();
        session.winner = null;
      }
    }

    return {
      phase: session.phase,
      timeRemaining: this.getPhaseTimeRemaining(session, songDuration),
      winner: session.winner
    };
  }

  getPhaseTimeRemaining(session, songDuration) {
    const halfwayPoint = songDuration / 2;
    const tenSecondsFromEnd = songDuration - 10000;

    switch (session.phase) {
      case 'suggestion':
        return halfwayPoint - (Date.now() - session.phaseStartTime);
      case 'voting':
        return tenSecondsFromEnd - (Date.now() - session.phaseStartTime);
      case 'locked':
        return songDuration - (Date.now() - session.phaseStartTime);
      default:
        return 0;
    }
  }

  determineWinner(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    let maxVotes = 0;
    let winners = [];

    // Count votes for each song
    for (const [songId, voters] of session.votes.entries()) {
      const voteCount = voters.size;
      
      if (voteCount > maxVotes) {
        maxVotes = voteCount;
        winners = [songId];
      } else if (voteCount === maxVotes) {
        winners.push(songId);
      }
    }

    // If there are multiple winners, randomly select one
    const winningId = winners[Math.floor(Math.random() * winners.length)];
    session.winner = session.votableOptions.get(winningId) || null;
    
    return session.winner;
  }

  // ... (keep existing methods) ...

  addVote(sessionId, userId, songId) {
    const session = this.sessions.get(sessionId);
    if (!session || session.phase !== 'voting') return false;

    // Initialize vote set for this song if it doesn't exist
    if (!session.votes.has(songId)) {
      session.votes.set(songId, new Set());
    }

    // Remove user's previous vote if any
    for (const voters of session.votes.values()) {
      voters.delete(userId);
    }

    // Add new vote
    session.votes.get(songId).add(userId);
    return true;
  }

  getVoteCounts(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return new Map();

    const voteCounts = new Map();
    for (const [songId, voters] of session.votes.entries()) {
      voteCounts.set(songId, voters.size);
    }

    return voteCounts;
  }
}

module.exports = new SessionManager(); 