const axios = require('axios');

const CLAUDE_API_URL = process.env.CLAUDE_API_URL || 'http://76.13.244.21:3000';

const callClaude = async (prompt) => {
  try {
    if (!prompt) {
      throw new Error('Prompt cannot be empty');
    }

    console.log(`[Claude Service] Calling VPS API with prompt: ${prompt.substring(0, 50)}...`);

    const response = await axios.post(`${CLAUDE_API_URL}/api/claude`,
      { prompt },
      { timeout: 125000 }
    );

    if (response.data.success) {
      console.log(`[Claude Service] Success!`);
      return response.data.response;
    } else if (response.data.ok) {
      console.log(`[Claude Service] OK response!`);
      return 'Claude API Response: ' + JSON.stringify(response.data);
    } else {
      throw new Error(response.data.error || 'Unknown error');
    }
  } catch (error) {
    console.error(`[Claude Service] Error:`, error.message);
    throw new Error(`Claude API Error: ${error.message}`);
  }
};

module.exports = { callClaude };
