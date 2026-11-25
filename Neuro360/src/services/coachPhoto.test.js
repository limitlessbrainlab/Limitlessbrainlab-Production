import assert from 'node:assert/strict';
import { test } from 'node:test';
import { uploadCoachPhoto, validateCoachPhoto } from './coachPhoto.js';

test('coach photos are optional and a valid replacement gets a fresh public URL', async () => {
  const file = { type: 'image/webp', size: 100 };
  assert.equal(validateCoachPhoto([]), true);
  assert.equal(validateCoachPhoto([file]), true);
  assert.match(validateCoachPhoto([{ ...file, type: 'image/svg+xml' }]), /JPG/);
  assert.match(validateCoachPhoto([{ ...file, size: 5242881 }]), /5 MB/);
  assert.equal(await uploadCoachPhoto(null), null);

  const storage = {
    from(bucket) {
      assert.equal(bucket, 'coach-photos');
      return {
        async upload(path, body, options) {
          assert.match(path, /^[a-f0-9-]+\.webp$/);
          assert.equal(body, file);
          assert.equal(options.contentType, file.type);
          return { error: null };
        },
        getPublicUrl: path => ({ data: { publicUrl: `https://example.com/coach-photos/${path}` } })
      };
    }
  };
  const firstUrl = await uploadCoachPhoto(storage, file);
  assert.match(firstUrl, /^https:\/\/example\.com\/coach-photos\//);
  assert.notEqual(await uploadCoachPhoto(storage, file), firstUrl);
  await assert.rejects(uploadCoachPhoto({
    from: () => ({ upload: async () => ({ error: new Error('Upload failed') }) })
  }, file), /Upload failed/);
});
