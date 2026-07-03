/**
 * Replace emoji characters in an HTML string with inline SVG <img> tags (Twemoji),
 * embedded as base64 data URIs.
 *
 * WHY: the report PDF is rendered by headless Chromium (on the VPS gateway, or the
 * local Puppeteer fallback). Those environments have no colour-emoji font installed,
 * so emoji codepoints (🧠 🎯 📚 🔋 💗 🎨 …) render as empty "tofu" boxes. Inlining
 * each emoji as a self-contained SVG image makes the report render identically
 * everywhere, with zero dependency on system fonts.
 *
 * Runs on the backend (where these deps are installed) BEFORE the HTML is sent to
 * the renderer, so the renderer only ever sees plain <img> tags.
 */

const fs = require('fs');
const path = require('path');
const twemoji = require('twemoji');

// Directory of per-codepoint SVG files (e.g. 1f9e0.svg for 🧠).
const SVG_DIR = path.dirname(require.resolve('@twemoji/svg/package.json'));

const cache = new Map();

function svgDataUri(codepoint) {
  if (cache.has(codepoint)) return cache.get(codepoint);
  let uri = null;
  try {
    const svg = fs.readFileSync(path.join(SVG_DIR, `${codepoint}.svg`), 'utf8');
    uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  } catch {
    uri = null; // Unknown/missing glyph → leave the original character in place.
  }
  cache.set(codepoint, uri);
  return uri;
}

/**
 * @param {string} html
 * @returns {string} html with emoji characters replaced by inline <img class="emoji">
 */
function inlineEmojis(html) {
  if (!html || typeof html !== 'string') return html;
  return twemoji.parse(html, {
    callback: (icon) => svgDataUri(icon) || false,
  });
}

module.exports = { inlineEmojis };
