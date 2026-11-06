// Vercel Serverless Function — server-side Microsoft token exchange.
// Bypasses AADSTS90023: browser (cross-origin) redemption is blocked when
// the Azure app is a Web app, not a SPA. This runs on Vercel, so Microsoft
// sees a server-to-server request, not a browser origin.
// No data is stored. The refresh token is used only for this one exchange.
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed', error_description: 'Use POST.' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const refresh_token = body && body.refresh_token;
  const client_id = body && body.client_id;
  if (!refresh_token || !client_id) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'refresh_token and client_id are required.' });
  }
  const scope = body.scope || 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/User.Read offline_access openid profile email';
  const endpoints = [
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
    'https://login.microsoftonline.com/common/oauth2/v2.0/token'
  ];
  let lastErr = null;
  for (const url of endpoints) {
    try {
      const params = new URLSearchParams();
      params.set('client_id', client_id);
      params.set('grant_type', 'refresh_token');
      params.set('refresh_token', refresh_token);
      params.set('scope', scope);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.access_token) {
        return res.status(200).json({
          access_token: data.access_token,
          refresh_token: data.refresh_token || refresh_token,
          expires_in: data.expires_in,
          token_type: data.token_type || 'Bearer',
          scope: data.scope
        });
      }
      lastErr = data;
      // Only try the next endpoint on tenant / authority errors, not on bad grant
      if (data && data.error === 'invalid_grant') break;
    } catch (e) {
      lastErr = { error: 'network_error', error_description: String(e && e.message || e) };
    }
  }
  return res.status(400).json(lastErr || { error: 'invalid_grant', error_description: 'Token exchange failed.' });
};
