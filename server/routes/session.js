const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Create a new session
router.post('/create', async (req, res) => {
  const { sessionId, hostId, hostName } = req.body;

  try {
    const session = new Session({
      sessionId,
      hostId,
      participants: [{
        userId: hostId,
        userName: hostName,
        isHost: true
      }]
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Join an existing session
router.post('/:sessionId/join', async (req, res) => {
  const { sessionId } = req.params;
  const { userId, userName } = req.body;

  try {
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is already in session
    if (!session.participants.some(p => p.userId === userId)) {
      session.participants.push({
        userId,
        userName,
        isHost: false
      });
      await session.save();
    }

    res.json(session);
  } catch (error) {
    console.error('Error joining session:', error);
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// Get session details
router.get('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// End session
router.delete('/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const { hostId } = req.body;

  try {
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.hostId !== hostId) {
      return res.status(403).json({ error: 'Only host can end session' });
    }

    await Session.deleteOne({ sessionId });
    res.json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

module.exports = router; 