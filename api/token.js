// Vercel Serverless Function — server-side Microsoft token exchange.
// Bypasses AADSTS90023: browser (cross-origin) redemption is blocked when
// the Azure app is a Web app, not a SPA. This runs on Vercel, so Microsoft
// sees a server-to-server request with no Origin header.
// No data is stored. The refresh token is used only for this one exchange.
// 5-point fix (2026-11-06 research):
// 1. Scope omitted first — only send scope if the caller explicitly passes one.
//    If Microsoft returns the policy-offers AADSTS90023 variant, the frontend
//    retries once with scope https://graph.microsoft.com/Mail.Read
// 2. Tenants consumers-first, then common, in both paths.
// 3. Do NOT abort on invalid_grant before trying the other tenant.
// 4. Surface the real Microsoft error verbatim (no masking).
// 5. Client-secret path: if MS_CLIENT_SECRET is set in Vercel env vars,
//    include it. Required only for confidential Web apps. Never log it,
//    never return it, never put it in the frontend or repo.
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
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
  const scope = body && typeof body.scope === 'string' && body.scope.trim() ? body.scope.trim() : null;
  const clientSecret = process.env.MS_CLIENT_SECRET || null;
  const endpoints = [
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
    'https://login.microsoftonline.com/common/oauth2/v2.0/token'
  ];
  let lastErr = null;
  let lastStatus = 400;
  for (const url of endpoints) {
    try {
      const params = new URLSearchParams();
      params.set('client_id', client_id);
      params.set('grant_type', 'refresh_token');
      params.set('refresh_token', refresh_token);
      if (scope) params.set('scope', scope);
      if (clientSecret) params.set('client_secret', clientSecret);
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
      lastStatus = r.status || 400;
      // Do not abort on invalid_grant — try the other tenant before giving up.
      // Keep the last error so the frontend can show the real Microsoft error.
    } catch (e) {
      lastErr = { error: 'network_error', error_description: String(e && e.message || e) };
      lastStatus = 502;
    }
  }
  return res.status(lastStatus).json(lastErr || { error: 'invalid_grant', error_description: 'Token exchange failed on both tenants.' });
};
