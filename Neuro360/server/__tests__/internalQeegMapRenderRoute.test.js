const assert = require('assert');

const {
  createRenderQueue,
  isQeegUploadPath,
  requireBothMaps,
} = require('../routes/internalQeegMapRenderRoute');

async function run() {
  assert.strictEqual(isQeegUploadPath('patient-1/EyesOpen.pdf'), true);
  assert.strictEqual(isQeegUploadPath('../secrets.pdf'), false);
  assert.strictEqual(isQeegUploadPath('_cache/data.json'), false);

  assert.throws(
    () => requireBothMaps({ eyesClosed: 'iVBORw0KGgo=' }),
    /Eyes Open/
  );
  assert.throws(
    () => requireBothMaps({ eyesOpen: 'iVBORw0KGgo=' }),
    /Eyes Closed/
  );

  const queue = createRenderQueue(2);
  let active = 0;
  let maximum = 0;
  await Promise.all(Array.from({ length: 10 }, () => queue.run(async () => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
  })));
  assert.strictEqual(maximum, 2, 'only two native Page 6 render jobs may run at once');

  console.log('internalQeegMapRenderRoute: ok');
}

run();
