const axios = require('axios');

// Talk to the Nexaproc AIaaS gateway (same VPS service as nexaprocService.js).
// The old standalone Claude sidecar (CLAUDE_API_URL → /api/claude) is retired;
// generic prompts now go through the gateway's /api/invoke endpoint.
const GATEWAY_URL = process.env.NEXAPROC_GATEWAY_URL || 'http://187.127.176.1/neuro-sidecar';
const MASTER_KEY = process.env.NEXAPROC_MASTER_KEY || '';

const callClaude = async (prompt) => {
  try {
    if (!prompt) {
      throw new Error('Prompt cannot be empty');
    }
    if (!MASTER_KEY) {
      throw new Error('NEXAPROC_MASTER_KEY is not set on the server. Cannot authenticate to the AIaaS gateway.');
    }

    console.log(`[Claude Service] Calling AIaaS gateway with prompt: ${prompt.substring(0, 50)}...`);

    const response = await axios.post(
      `${GATEWAY_URL}/api/invoke`,
      { taskID: 'GENERIC_ASK', payload: prompt, useJson: false, model: 'haiku' },
      {
        headers: { 'X-Nexaproc-Key': MASTER_KEY, 'Content-Type': 'application/json' },
        timeout: 300000,
      }
    );

    // The gateway returns { stdout } when useJson:false.
    if (response.data && typeof response.data.stdout === 'string') {
      console.log(`[Claude Service] Success!`);
      return response.data.stdout;
    }
    throw new Error('Unexpected gateway response (no stdout).');
  } catch (error) {
    console.error(`[Claude Service] Error:`, error.message);
    throw new Error(`Claude API Error: ${error.message}`);
  }
};

module.exports = { callClaude };
