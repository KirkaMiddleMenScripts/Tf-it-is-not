import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { user } = req.query;

  if (!user) {
    return res.status(400).json({ error: 'Missing ?user=' });
  }

  const username = user.toLowerCase();

  try {
    // Send GraphQL query to Twitch
    const gqlRes = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko', // Public client ID used by Twitch web
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        {
          operationName: 'ChannelShell',
          variables: { login: username },
          extensions: {
            persistedQuery: {
              version: 1,
              sha256Hash:
                '5fa5b13fbcfbc1071e11b5b3027d05e03eac7674e7687a06b71f73e1c29c3079'
            }
          }
        }
      ])
    });

    const json = await gqlRes.json();
    const channelData = json[0]?.data?.userOrError;

    if (!channelData || channelData.__typename !== 'User') {
      return res.status(404).json({ error: 'User not found on Twitch' });
    }

    const isLive = !!channelData.stream;
    const title = channelData.stream?.title || null;
    const game = channelData.stream?.game?.displayName || null;
    const viewers = channelData.stream?.viewersCount || 0;

    res.status(200).json({
      success: true,
      user: username,
      isLive,
      title,
      game,
      viewers,
      twitchUrl: `https://twitch.tv/${username}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Twitch query failed', details: err.message });
  }
}
