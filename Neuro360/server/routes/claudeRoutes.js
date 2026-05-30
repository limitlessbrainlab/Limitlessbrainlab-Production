const express = require('express');
const { callClaude } = require('../services/claudeService');
const router = express.Router();

// Test endpoint for Claude API
router.post('/claude', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt required' });
    }

    console.log(`[Claude Routes] Received prompt: ${prompt.substring(0, 50)}...`);

    const response = await callClaude(prompt);
    res.json({ success: true, response });
  } catch (error) {
    console.error(`[Claude Routes] Error:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint without auth (for testing VPS connection)
router.post('/claude-test', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt required' });
    }

    console.log(`[Claude Test] Received prompt: ${prompt.substring(0, 50)}...`);

    const response = await callClaude(prompt);
    res.json({ success: true, response });
  } catch (error) {
    console.error(`[Claude Test] Error:`, error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
