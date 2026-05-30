/**
 * DIRECT BUCKET TEST - Copy paste this in browser console
 * This will test if edf-files bucket is accessible
 */

// Test 1: Check if bucket exists
async function testBucketExists() {
  const { supabase } = await import('./src/lib/supabaseClient.js');

  console.log('🔍 Test 1: Checking if edf-files bucket exists...');

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('❌ Error listing buckets:', error);
    return false;
  }

  console.log('📦 All buckets:', buckets.map(b => b.id));

  const edfBucket = buckets.find(b => b.id === 'edf-files');
  if (edfBucket) {
    console.log('✅ SUCCESS: edf-files bucket exists!');
    console.log('Bucket details:', edfBucket);
    return true;
  } else {
    console.error('❌ FAILED: edf-files bucket NOT found!');
    console.log('Available buckets:', buckets.map(b => b.id).join(', '));
    return false;
  }
}

// Test 2: Check if user is authenticated
async function testAuthentication() {
  const { supabase } = await import('./src/lib/supabaseClient.js');

  console.log('\n🔍 Test 2: Checking authentication...');

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('❌ Auth error:', error);
    return false;
  }

  if (session) {
    console.log('✅ User is authenticated!');
    console.log('User ID:', session.user.id);
    console.log('User email:', session.user.email);
    console.log('User role:', session.user.user_metadata?.role);
    return true;
  } else {
    console.error('❌ User is NOT authenticated!');
    console.log('Please login first');
    return false;
  }
}

// Test 3: Try to upload a test file
async function testUpload() {
  const { supabase } = await import('./src/lib/supabaseClient.js');

  console.log('\n🔍 Test 3: Testing file upload...');

  // Create a small test file
  const testContent = 'This is a test EDF file';
  const testFile = new File([testContent], 'test.edf', {
    type: 'application/octet-stream'
  });

  const filePath = `test-clinic/test-patient/test_${Date.now()}.edf`;

  console.log('📁 Uploading to path:', filePath);
  console.log('📁 Bucket: edf-files');
  console.log('📁 File size:', testFile.size, 'bytes');

  const { data, error } = await supabase.storage
    .from('edf-files')
    .upload(filePath, testFile, {
      contentType: 'application/octet-stream',
      upsert: false
    });

  if (error) {
    console.error('❌ Upload FAILED!');
    console.error('Error code:', error.statusCode);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    return false;
  }

  console.log('✅ Upload SUCCESS!');
  console.log('File path:', data.path);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('edf-files')
    .getPublicUrl(data.path);

  console.log('🔗 File URL:', urlData.publicUrl);

  return true;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting edf-files bucket tests...\n');

  const test1 = await testBucketExists();
  const test2 = await testAuthentication();

  if (!test1) {
    console.error('\n❌ BUCKET NOT FOUND! Please run CREATE_EDF_BUCKET_NOW.sql in Supabase SQL Editor');
    return;
  }

  if (!test2) {
    console.error('\n❌ NOT AUTHENTICATED! Please login to the app first');
    return;
  }

  const test3 = await testUpload();

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS:');
  console.log('='.repeat(50));
  console.log('Bucket exists:', test1 ? '✅' : '❌');
  console.log('User authenticated:', test2 ? '✅' : '❌');
  console.log('Upload works:', test3 ? '✅' : '❌');
  console.log('='.repeat(50));

  if (test1 && test2 && test3) {
    console.log('\n🎉 ALL TESTS PASSED! Your bucket is working correctly!');
    console.log('You can now upload EDF files through the UI');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED! Please fix the issues above');
  }
}

// Export for use in console
window.testEdfBucket = runAllTests;
window.testBucketExists = testBucketExists;
window.testAuthentication = testAuthentication;
window.testUpload = testUpload;

console.log('✅ Test functions loaded!');
console.log('Run: testEdfBucket() to test the bucket');
