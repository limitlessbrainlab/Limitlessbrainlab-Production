// Budget-aware copy of qeeg-uploads: copies small patient folders first
// to maximize the number of testable patients within the free-tier budget.
const { createClient } = require('@supabase/supabase-js');

const src = createClient('https://puzdgwtprcpaaxxwkwtk.supabase.co', process.env.SRC_SR, { auth: { persistSession: false } });
const dst = createClient('https://ukmggjcvjvjodksopngs.supabase.co', process.env.DST_SR, { auth: { persistSession: false } });

const BUDGET_MB = 450; // stop after this much copied (leaves headroom under 1GB free tier)
const MAX_FOLDER_MB = 60; // skip huge multi-attempt folders; we only need 1 pair per patient

async function folderFiles(folder) {
  const { data, error } = await src.storage.from('qeeg-uploads').list(folder, { limit: 200, offset: 0 });
  if (error) return [];
  return (data || []).filter(f => f.metadata && f.name && !f.name.startsWith('.emptyFolderPlaceholder'));
}

async function copyFile(path) {
  const { data, error } = await src.storage.from('qeeg-uploads').download(path);
  if (error) { console.error(`  ✗ dl ${path}: ${error.message}`); return 0; }
  const buf = Buffer.from(await data.arrayBuffer());
  const { error: up } = await dst.storage.from('qeeg-uploads').upload(path, buf, { contentType: 'application/pdf', upsert: true });
  if (up) { console.error(`  ✗ ul ${path}: ${up.message}`); return 0; }
  return buf.length;
}

(async () => {
  const { data: folders } = await src.storage.from('qeeg-uploads').list('', { limit: 1000, offset: 0 });
  const folderList = (folders || []).filter(f => !f.metadata).map(f => f.name).filter(Boolean);
  console.log(`Found ${folderList.length} folders. Budget: ${BUDGET_MB}MB. Max folder: ${MAX_FOLDER_MB}MB.`);

  let totalBytes = 0, patientsDone = 0, filesDone = 0, skipped = 0;
  const budgetBytes = BUDGET_MB * 1048576;

  // Pass 1: survey sizes
  const surveyed = [];
  for (const folder of folderList) {
    const files = await folderFiles(folder);
    const sz = files.reduce((a, f) => a + (f.metadata.size || 0), 0);
    surveyed.push({ folder, files, sizeMB: sz / 1048576 });
  }
  // Sort smallest first to maximize patient count
  surveyed.sort((a, b) => a.sizeMB - b.sizeMB);

  // Pass 2: copy within budget
  for (const { folder, files, sizeMB } of surveyed) {
    if (files.length === 0) { skipped++; continue; }
    if (sizeMB > MAX_FOLDER_MB) { skipped++; continue; }
    if (totalBytes + sizeMB * 1048576 > budgetBytes) {
      console.log(`⏸  budget reached after ${patientsDone} patients (${(totalBytes/1048576).toFixed(0)}MB). ${surveyed.length - patientsDone - skipped} more folders would exceed budget.`);
      break;
    }
    let okCount = 0;
    for (const f of files) {
      const path = `${folder}/${f.name}`;
      const n = await copyFile(path);
      if (n > 0) { okCount++; filesDone++; totalBytes += n; }
    }
    patientsDone++;
    console.log(`✓ ${folder} (${files.length} files, ${sizeMB.toFixed(1)}MB) — ${okCount}/${files.length} copied | running total ${(totalBytes/1048576).toFixed(0)}MB`);
  }

  console.log(`\n=== DONE: ${patientsDone} patients, ${filesDone} files, ${(totalBytes/1048576).toFixed(0)}MB copied. ${skipped} folders skipped (empty or too big). ===`);
  process.exit(0);
})();
