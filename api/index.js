import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || !url.startsWith('http') || !url.includes('twitch.tv/')) {
    return res.status(400).json({ error: 'Missing or invalid Twitch ?url=' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = await response.text();
    const dom = new JSDOM(html);
    const { document } = dom.window;

    const title = document.querySelector('title')?.textContent || null;
    const description = document.querySelector('meta[name="description"]')?.content || null;
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || null;
    const ogDescription = document.querySelector('meta[property="og:description"]')?.content || null;
    const ogImage = document.querySelector('meta[property="og:image"]')?.content || null;
    const favicon = document.querySelector('link[rel="icon"]')?.href || null;

    // ✅ Look for "LIVE" text or live-indicating elements in page body
    const bodyText = document.body.textContent || '';
    const isLive = /is live|LIVE|Watch .* live/i.test(bodyText);

    res.status(200).json({
      success: true,
      url,
      data: {
        title,
        description,
        ogTitle,
        ogDescription,
        ogImage,
        favicon,
        isLive
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching or parsing page', details: err.message });
  }
}
