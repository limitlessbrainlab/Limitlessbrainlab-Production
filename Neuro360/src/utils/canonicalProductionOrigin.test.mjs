import assert from 'node:assert/strict';
import { canonicalProductionUrl } from './canonicalProductionOrigin.js';

assert.equal(
  canonicalProductionUrl({ hostname: 'limitlessbrainlab.com', pathname: '/admin/algorithm-processor', search: '?patient=1', hash: '#report' }),
  'https://www.limitlessbrainlab.com/admin/algorithm-processor?patient=1#report'
);
assert.equal(canonicalProductionUrl({ hostname: 'www.limitlessbrainlab.com', pathname: '/', search: '', hash: '' }), null);
