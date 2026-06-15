const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { appTokenAuth } = require('../middleware/appTokenAuth');
const SupabaseStorage = require('../services/supabaseStorage');

const router = express.Router();

const BUCKET = 'patients_documents';

// Upload to a temp file, then push to Supabase and delete the temp copy.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `patient-doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Re-sanitize each path segment server-side — never trust the client path verbatim.
function sanitizeStoragePath(filePath) {
  return String(filePath || '')
    .split('/')
    .map((seg) => seg.replace(/[^a-zA-Z0-9._-]/g, '_'))
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .join('/');
}

/**
 * POST /api/patient-documents/upload
 * Field "file" + body { filePath }. Uploads to the PRIVATE patients_documents
 * bucket via the service-role key (bypasses RLS). Returns the storage path only
 * (no public URL — reads go through /signed-url).
 */
router.post('/upload', appTokenAuth, upload.single('file'), async (req, res) => {
  const tempPath = req.file?.path;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'A file (field "file") is required.' });
    }

    const storagePath = sanitizeStoragePath(req.body.filePath);
    if (!storagePath) {
      return res.status(400).json({ success: false, error: 'A valid filePath is required.' });
    }

    const result = await SupabaseStorage.uploadFile(
      tempPath,
      BUCKET,
      storagePath,
      req.file.mimetype
    );

    return res.json({ success: true, path: result.path, bucket: BUCKET });
  } catch (error) {
    console.error('❌ patient-documents upload failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  } finally {
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlink(tempPath, () => {});
    }
  }
});

/**
 * POST /api/patient-documents/signed-url
 * Body { path, bucket?, expiresIn? } -> { signedUrl } for a private file.
 */
router.post('/signed-url', appTokenAuth, async (req, res) => {
  try {
    const { path: filePath, bucket, expiresIn } = req.body || {};
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'path is required.' });
    }
    const result = await SupabaseStorage.getSignedUrl(
      bucket || BUCKET,
      filePath,
      Number(expiresIn) || 300
    );
    return res.json({ success: true, signedUrl: result.signedUrl });
  } catch (error) {
    console.error('❌ patient-documents signed-url failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/patient-documents/delete
 * Body { path, bucket? } -> removes the file from the bucket.
 */
router.post('/delete', appTokenAuth, async (req, res) => {
  try {
    const { path: filePath, bucket } = req.body || {};
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'path is required.' });
    }
    await SupabaseStorage.deleteFile(filePath, bucket || BUCKET);
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ patient-documents delete failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
