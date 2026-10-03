const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, file), 'utf8');
const frequencies = read('src/pages/FrequenciesMusic.jsx');
const dashboard = read('src/components/patient/PatientDashboard.jsx');

assert.match(frequencies, /const isSolfeggio = pack\.id\.startsWith\('solfeggio_'\);/);
assert.match(frequencies, /const isUnlocked = !isSolfeggio \|\| isPurchased;/);
assert.match(dashboard, /info@limitlessbrainlab\.com/);

for (const id of ['1hi-6bI7LPMn_Nlzt-zO4G6pdy3sJrh0J', '1PVopOaJpqFxQjPUsz_dl-ExD1S6u-VGA', '1PS4LqFrc4n0S8kUP9_SGuU6xWliKyBIk', '1vo5XhHEUHR-HmGRe4pY-uiyMfmUzeOf2']) {
  assert.match(dashboard, new RegExp(`embedUrl: driveEmbed\\('${id}'\\).*free: true`));
}
assert.match(dashboard, /title: 'YOGA NIDRA[^\n]*free: true/);
assert.match(dashboard, /const CARE_PROGRAM_YOGA_NIDRA_URL = 'https:\/\/drive\.google\.com\/file\/d\/1G7M7EiWU7tHzFkb0Gy6KIPNwUt1p3pn8\/view';/);
assert.doesNotMatch(dashboard, /sweta8238\.graphy\.com\/products\/Yoga-Nidra/);
