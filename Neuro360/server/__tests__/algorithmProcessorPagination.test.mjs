import assert from 'node:assert/strict';
import { paginate } from '../../src/utils/pagination.js';

const patients = Array.from({ length: 25 }, (_, id) => ({ id }));

assert.deepEqual(paginate(patients, 20).map(({ id }) => id), Array.from({ length: 20 }, (_, id) => id));
assert.equal(paginate(patients, 40).length, 25);

console.log('algorithmProcessorPagination.test.mjs: ok');
