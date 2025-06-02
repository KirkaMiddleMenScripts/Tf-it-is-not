import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { user } = req.query;

  if (!user) {
    return res.status(400).json({ error: 'Missing ?user=' });
  }

  const login = user.toLowerCase();

  try {
    const query = `
      query ChannelShell($login: String!) {
        user(login: $login) {
          id
          login
          displayName
          stream {
            id
            title
            viewersCount
            game {
              displayName
            }
          }
        }
      }
    `;

    const gqlRes = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        operationName: 'ChannelShell',
        query,
        variables: { login }
      })
    });

    const json = await gqlRes.json();
    const userData = json.data?.user;

    if (!userData) {
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
