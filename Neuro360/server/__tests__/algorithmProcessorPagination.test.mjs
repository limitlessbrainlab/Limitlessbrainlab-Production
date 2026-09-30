import assert from 'node:assert/strict';
import { groupPatientsByClinic, paginate } from '../../src/utils/pagination.js';

const patients = Array.from({ length: 25 }, (_, id) => ({ id }));

assert.deepEqual(paginate(patients, 20).map(({ id }) => id), Array.from({ length: 20 }, (_, id) => id));
assert.equal(paginate(patients, 40).length, 25);

const clinics = [{ id: 'new' }, { id: 'old' }];
const visiblePatients = [
  { id: 1, clinicId: 'old' },
  { id: 2, clinicId: 'old' },
  { id: 3, clinicId: 'new' },
];
const groups = groupPatientsByClinic(visiblePatients, clinics);

assert.deepEqual(groups.map(({ clinic }) => clinic.id), ['old', 'new']);
assert.deepEqual(groups[0].patients.map(({ id }) => id), [1, 2]);

console.log('algorithmProcessorPagination.test.mjs: ok');
