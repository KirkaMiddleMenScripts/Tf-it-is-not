import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { user, debug } = req.query;

  if (!user) {
    return res.status(400).json({ error: 'Missing ?user=' });
  }

  const login = user.toLowerCase(); // Twitch login name is always lowercase

  try {
    const gqlRes = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([
        {
          operationName: 'ChannelShell',
          variables: { login },
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

    if (debug) return res.status(200).json({ debugResponse: json });

    const userData = json[0]?.data?.userOrError;

    if (!userData || userData.__typename !== 'User') {
      return res.status(404).json({ error: 'User not found on Twitch' });
    }

    const isLive = !!userData.stream;
    const title = userData.stream?.title || null;
    const game = userData.stream?.game?.displayName || null;
    const viewers = userData.stream?.viewersCount || 0;

    res.status(200).json({
      success: true,
      user: userData.login,
      displayName: userData.displayName,
      isLive,
      title,
      game,
      viewers,
      twitchUrl: `https://twitch.tv/${userData.login}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Twitch query failed', details: err.message });
  }
}
