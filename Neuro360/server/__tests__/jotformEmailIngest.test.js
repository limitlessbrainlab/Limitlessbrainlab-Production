const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { withImap } = require('../services/jotformEmailIngest');

test('IMAP connection errors reject a poll without becoming unhandled errors', async () => {
  class TimedOutClient extends EventEmitter {
    async connect() {
      const error = Object.assign(new Error('connection timed out'), { code: 'ETIMEOUT' });
      this.emit('error', error);
      throw error;
    }
  }

  await assert.rejects(
    withImap(async () => {}, () => new TimedOutClient()),
    { code: 'ETIMEOUT' }
  );
});
