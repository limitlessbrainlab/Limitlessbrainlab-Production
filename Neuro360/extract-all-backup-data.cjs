#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const BACKUP_FILE = 'c:/Users/Hp/Downloads/db_cluster-24-11-2025@16-41-20.backup (1)/db_cluster-24-11-2025@16-41-20.backup (1)';
const OUTPUT_FILE = 'D:/Todays/Neuro360/COMPLETE_BACKUP_DATA_IMPORT.sql';

console.log('📦 Starting complete backup data extraction...\n');

try {
  const content = fs.readFileSync(BACKUP_FILE, 'utf8');
  const lines = content.split('\n');
  
  const tables = {
    'clinics': { start: 6752, priority: 1 },
    'organizations': { start: 6824, priority: 2 },
    'profiles': { start: 6880, priority: 3 },
    'patients': { start: 6845, priority: 4 },
    'clinic_roles': { start: 6731, priority: 5 },
    'clinic_profiles': { start: 6723, priority: 6 },
    'org_memberships': { start: 6816, priority: 7 },
    'subscriptions': { start: 6910, priority: 8 },
    'payment_history': { start: 6859, priority: 9 },
    'reports': { start: 6900, priority: 10 },
    'clinical_reports': { start: 6743, priority: 11 },
    'patient_sessions': { start: 6837, priority: 12 },
    'clinic_enquiries': { start: 6715, priority: 13 },
    'notifications': { start: 6808, priority: 14 },
    'audit_logs': { start: 6692, priority: 15 },
    'activity_logs': { start: 6660, priority: 16 },
    'consent_records': { start: 6775, priority: 17 },
    'consent_templates': { start: 6783, priority: 18 },
    'download_logs': { start: 6792, priority: 19 },
    'system_settings': { start: 6927, priority: 20 },
    'user_preferences': { start: 6943, priority: 21 }
  };

  let output = `-- =====================================================
-- COMPLETE BACKUP DATA IMPORT
-- =====================================================
-- Generated: ${new Date().toISOString()}
-- Source: ${path.basename(BACKUP_FILE)}
-- Tables: ${Object.keys(tables).length}
-- =====================================================

-- Disable triggers temporarily
SET session_replication_role = replica;

`;

  const sortedTables = Object.entries(tables).sort((a, b) => a[1].priority - b[1].priority);
  let totalRecords = 0;

  for (const [tableName, config] of sortedTables) {
    console.log(`📋 Processing table: ${tableName}`);
    
    const startLine = config.start;
    let columns = [];
    let dataLines = [];
    let foundData = false;

    // Extract column names
    const copyLine = lines[startLine];
    if (copyLine && copyLine.startsWith(`COPY public.${tableName}`)) {
      const match = copyLine.match(/COPY public\.\w+\s*\((.*?)\)\s*FROM stdin;/);
      if (match) {
        columns = match[1].split(',').map(c => c.trim());
      }
    }

    // Extract data lines
    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line === '\.') break;
      if (line.trim() && !line.startsWith('--')) {
        dataLines.push(line);
        foundData = true;
      }
    }

    if (foundData && columns.length > 0 && dataLines.length > 0) {
      output += `\n-- =====================================================\n`;
      output += `-- TABLE: ${tableName} (${dataLines.length} records)\n`;
      output += `-- =====================================================\n\n`;
      
      output += `INSERT INTO ${tableName} (${columns.join(', ')})\nVALUES\n`;
      
      const valueStrings = dataLines.map((line, idx) => {
        const values = line.split('\t').map(val => {
          if (val === '\N' || val === '') return 'NULL';
          if (val === 't') return 'true';
          if (val === 'f') return 'false';
          
          val = val.replace(/'/g, "''");
          
          if (!isNaN(val) && val.trim() !== '' && !val.includes('-') && val.length < 15) {
            return val;
          }
          
          return `'${val}'`;
        });
        
        return `  (${values.join(', ')})${idx === dataLines.length - 1 ? ';' : ','}`;
      });
      
      output += valueStrings.join('\n') + '\n';
      output += `\nON CONFLICT (id) DO NOTHING;\n`;
      
      totalRecords += dataLines.length;
      console.log(`   ✅ ${dataLines.length} records extracted\n`);
    } else {
      console.log(`   ⚠️  No data found\n`);
    }
  }

  output += `\n-- Re-enable triggers\nSET session_replication_role = DEFAULT;\n\n`;
  output += `-- =====================================================\n`;
  output += `-- IMPORT SUMMARY\n`;
  output += `-- =====================================================\n`;
  output += `-- Total tables processed: ${sortedTables.length}\n`;
  output += `-- Total records imported: ${totalRecords}\n`;
  output += `-- =====================================================\n`;

  fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
  
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ SUCCESS! Complete data extraction finished!');
  console.log(`📊 Total tables: ${sortedTables.length}`);
  console.log(`📊 Total records: ${totalRecords}`);
  console.log(`📄 Output: ${OUTPUT_FILE}`);
  console.log('═══════════════════════════════════════════════════\n');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}
