# Email Fetch — Outlook / Hotmail

Temporary, client-only Outlook / Hotmail email fetcher. No server storage, no database.

Paste one line in a single box:

```
email|password|refresh_token|client_id
```

The app parses the line in your browser, exchanges the refresh token for a Microsoft Graph access token, and loads mail from the Graph API. Everything lives only in page memory and is wiped when you close the tab or browser. Use the Wipe session button to clear it sooner.

The password is only checked for format and is never sent. No credentials are stored in this repo.

## How the exchange works (server-first)

1. `POST /api/token` forwards to `login.microsoftonline.com/consumers/oauth2/v2.0/token` first, with no scope on the first try, then `common` once if needed. It does not abort on `invalid_grant` before trying the other tenant.
2. Only if Microsoft returns the AADSTS90023 policy-offers variant does it retry once with explicit `https://graph.microsoft.com/Mail.Read` scope.
3. If that still fails, the page shows the exact Microsoft error from each route — no masking.
4. If the Azure app is a confidential Web app, it needs a client secret. Set `MS_CLIENT_SECRET` in Vercel env vars (never in the repo or frontend). If you own the app, you can instead re-register it as a Single-page application in Azure: App registrations → Authentication → Add platform → Single-page application → add your deployed site URL as the Redirect URI → Save.

`GET /api/token` returning `405 Use POST.` is healthy — it proves the function is deployed.

## Run it on Vercel

1. Import this repo in Vercel
2. Framework Preset: Other
3. Deploy — no build step. Optional: set `MS_CLIENT_SECRET` only if your app is a confidential Web app.

`api/token.js` deploys automatically as a Vercel Serverless Function.

## Privacy

- No localStorage, no cookies, no backend storage
- Tokens and emails stay in memory only
- Closing the tab clears everything
