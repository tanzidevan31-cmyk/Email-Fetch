# Email Fetch — Outlook / Hotmail

Temporary, client-only Outlook / Hotmail email fetcher. No server, no database, no storage.

Paste one line in a single box:

```
email|password|refresh_token|client_id
```

The app parses the line in your browser, exchanges the refresh token for a Microsoft Graph access token, and loads mail from the Graph API. Everything lives only in page memory and is wiped when you close the tab or browser. Use the Wipe session button to clear it sooner.

The password is only checked for format and is never sent. No credentials are stored in this repo.

## Run it

Open `index.html` in a browser, or deploy this repo on Vercel:

1. Import this repo in Vercel
2. Framework Preset: Other
3. Deploy — no build step, no environment variables needed

## Privacy

- No localStorage, no cookies, no backend
- Tokens and emails stay in memory only
- Closing the tab clears everything
