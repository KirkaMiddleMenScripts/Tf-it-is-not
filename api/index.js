import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export default async function handler(req, res) {
  const { user } = req.query;

  if (!user) {
    return res.status(400).json({ error: 'Missing ?user=' });
  }

  const username = user.toLowerCase();
  const twitchUrl = `https://www.twitch.tv/${username}`;
  const liveCheckUrl = `${twitchUrl}/live`;

  try {
    // Detect if user is live by checking redirect behavior of /live
    const liveResp = await fetch(liveCheckUrl, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const isLive = liveResp.status === 302 && liveResp.headers.get('location')?.endsWith(`/${username}`);

    // Fetch the main page to extract metadata
    const response = await fetch(twitchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
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

    res.status(200).json({
      success: true,
      user: username,
      url: twitchUrl,
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
