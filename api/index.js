import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url || !url.startsWith('http')) {
    return res.status(400).json({ error: 'Missing or invalid ?url=' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch page', status: response.status });
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const { document } = dom.window;

    const title = document.querySelector('title')?.textContent || null;
    const description = document.querySelector('meta[name="description"]')?.content || null;
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || null;
    const ogDescription = document.querySelector('meta[property="og:description"]')?.content || null;
    const ogImage = document.querySelector('meta[property="og:image"]')?.content || null;
    const favicon = document.querySelector('link[rel="icon"]')?.href || null;
    const isLive = document.querySelector('meta[property="og:video:is_live"]')?.content === 'true';

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
    res.status(500).json({ error: 'Error parsing page', details: err.message });
  }
}
