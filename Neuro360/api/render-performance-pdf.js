import crypto from 'node:crypto';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// Reuse the existing server-only Supabase key until a separate render token is
// configured on both services. It is never sent to a browser.
const token = process.env.PDF_RENDER_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function authorized(value) {
  const a = Buffer.from(value || '');
  const b = Buffer.from(token);
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!authorized(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''))) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const html = req.body?.html;
  if (typeof html !== 'string' || !html) return res.status(400).json({ message: 'Report HTML is required' });

  let browser;
  try {
    chromium.setGraphicsMode = false;
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load', timeout: 60000 });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(pdf));
  } catch (error) {
    console.error('Performance PDF render failed:', error.message);
    return res.status(500).json({ message: `PDF rendering failed: ${error.message}` });
  } finally {
    await browser?.close().catch(() => {});
  }
}
