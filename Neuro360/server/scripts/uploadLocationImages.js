/**
 * Upload existing location images from public/ folder to Supabase site-images bucket
 * Run: node server/scripts/uploadLocationImages.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = 'site-images';
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

// Location images to upload
const locationImages = [
  { file: 'surat-city.jpg', name: 'surat-city.jpg' },
  { file: 'LONDON.jpg', name: 'london-city.jpg' },
  { file: 'ahemdabad.jpg', name: 'ahmedabad-city.jpg' },
  { file: 'mumbai.jpg', name: 'mumbai-city.jpg' },
  { file: 'hyderabad.jpg', name: 'hyderabad-city.jpg' },
  { file: 'blanglore.jpeg', name: 'bangalore-city.jpeg' },
];

async function main() {
  console.log('🚀 Uploading location images to Supabase...\n');

  // Create bucket if not exists
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
        fileSizeLimit: 10 * 1024 * 1024
      });
      console.log(`✅ Created bucket: ${BUCKET}`);
    } else {
      console.log(`✅ Bucket "${BUCKET}" exists`);
    }
  } catch (err) {
    console.log('⚠️  Bucket check:', err.message);
  }

  const results = [];

  for (const img of locationImages) {
    const filePath = path.join(PUBLIC_DIR, img.file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skip: ${img.file} not found`);
      results.push({ name: img.name, status: 'not found' });
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    const ext = img.name.split('.').pop();
    const contentType = ext === 'png' ? 'image/png' : ext === 'jpeg' ? 'image/jpeg' : 'image/jpeg';
    const storagePath = `locations/${img.name}`;

    try {
      // Upload (upsert to overwrite if exists)
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType,
          upsert: true,
          cacheControl: '31536000'
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(data.path);

      console.log(`✅ ${img.file} → ${urlData.publicUrl}`);
      results.push({ name: img.name, url: urlData.publicUrl, status: 'uploaded' });
    } catch (err) {
      console.error(`❌ ${img.file}: ${err.message}`);
      results.push({ name: img.name, status: 'error', error: err.message });
    }
  }

  console.log('\n📋 Summary:');
  console.log('─'.repeat(60));
  results.forEach(r => {
    if (r.status === 'uploaded') {
      console.log(`  ✅ ${r.name}`);
      console.log(`     ${r.url}`);
    } else {
      console.log(`  ❌ ${r.name} - ${r.status}`);
    }
  });

  // Generate SQL update statements
  const uploaded = results.filter(r => r.status === 'uploaded');
  if (uploaded.length > 0) {
    console.log('\n📝 Run this SQL in Supabase to update clinic_locations:');
    console.log('─'.repeat(60));
    uploaded.forEach(r => {
      const cityName = r.name.replace('-city.jpg', '').replace('-city.jpeg', '');
      const capitalized = cityName.charAt(0).toUpperCase() + cityName.slice(1);
      console.log(`UPDATE clinic_locations SET image_url = '${r.url}' WHERE name ILIKE '%${capitalized}%';`);
    });
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
