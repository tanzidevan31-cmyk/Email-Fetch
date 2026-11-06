# Email Fetch — Outlook / Hotmail

Temporary, client-only Outlook / Hotmail email fetcher. No server storage, no database.

Paste one line in a single box:

```
email|password|refresh_token|client_id
```

The app parses the line in your browser, exchanges the refresh token for a Microsoft Graph access token, and loads mail from the Graph API. Everything lives only in page memory and is wiped when you close the tab or browser. Use the Wipe session button to clear it sooner.

The password is only checked for format and is never sent. No credentials are stored in this repo.

## AADSTS90023 fix

If Microsoft returns `AADSTS90023` (cross-origin token redemption only for SPA apps), the site automatically retries the exchange server-side via `POST /api/token` (see `api/token.js`). That runs on Vercel, so the browser origin check does not apply.

You can also fix it in Azure: App registrations → your app → Authentication → Add platform → Single-page application → add your deployed site URL as the Redirect URI → Save.

## Run it on Vercel

1. Import this repo in Vercel
2. Framework Preset: Other
3. Deploy — no build step, no environment variables needed

`api/token.js` deploys automatically as a Vercel Serverless Function.

## Privacy

- No localStorage, no cookies, no backend storage
- Tokens and emails stay in memory only
- Closing the tab clears everything
