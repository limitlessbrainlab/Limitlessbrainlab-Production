const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = 'ac4nQ09hYFzGTzlVsMsOMC';

const ids = '72:687,72:1477,72:1808,72:2138,72:2773,72:3113,72:3453,72:3793,72:4132,72:4554,72:4894,72:5486,72:5818,72:6150,72:6633,72:6735,72:6905,72:6915,72:7015';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'X-Figma-Token': TOKEN } }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error('HTTP ' + res.statusCode + ': ' + body.substring(0,200))); return; }
        resolve(JSON.parse(body));
      });
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const doGet = (u) => {
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          doGet(res.headers.location);
          return;
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', reject);
    };
    doGet(url);
  });
}

async function main() {
  const outDir = path.join(__dirname, 'figma_pages');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  console.log('Fetching image URLs...');
  const url = 'https://api.figma.com/v1/images/' + FILE_KEY + '?ids=' + ids + '&format=png&scale=2';
  const data = await fetchJSON(url);
  if (data.err) { console.error('Error:', data.err); return; }

  const images = data.images;
  const entries = Object.entries(images).filter(([k, v]) => v !== null);
  console.log('Got ' + entries.length + ' images to download\n');

  for (let i = 0; i < entries.length; i++) {
    const [nodeId, imgUrl] = entries[i];
    const safeName = nodeId.replace(':', '_');
    const dest = path.join(outDir, safeName + '.png');
    console.log((i + 1) + '/' + entries.length + ' Downloading ' + nodeId + '...');
    try {
      await downloadFile(imgUrl, dest);
      console.log('   Saved: ' + dest);
    } catch (e) {
      console.error('   Failed: ' + e.message);
    }
  }
  console.log('\nDone! All pages saved to: ' + outDir);
}

main().catch(e => console.error(e));
