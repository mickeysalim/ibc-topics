# IBC Topic Suggestions

A one-page site where Indonesian Buddhist Community Singapore members suggest Dhamma topics for the speakers at the Indonesian Service. Each suggestion is saved as a row in a Google Sheet.

## How it works
- Members swipe through the speakers, write one or more topic suggestions (no length limit), add their name if they like, and submit.
- The speaker list comes from the **Speakers** tab of the Google Sheet. Suggestions go to the **Suggestions** tab.
- A small Google Apps Script (`apps-script/Code.gs`) attached to the sheet connects the two.

## Files
Plain HTML, CSS and JavaScript with no build step.
- `index.html`, `styles.css`, `app.js`: the site
- `config.js`: the Apps Script URL and a backup speaker list
- `assets/logo.png`: IBC logo
- `speakers/`: speaker photos (square, at least 400×400px)
- `apps-script/Code.gs`: the Google Sheet backend

## One-time setup: connect the Google Sheet
1. On a computer (not the phone app), go to https://script.google.com and sign in with the Google account that owns the **IBC Topic Suggestions** sheet. Click **New project**.
2. Delete what's there, paste the contents of `apps-script/Code.gs`, and click **Save**. (`SHEET_ID` in the code already points to the sheet. If the sheet is ever replaced, put the new ID there.)
3. Click **Deploy → New deployment**. Under "Select type", choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, allow the permissions Google asks for, and copy the **Web app URL** (it ends in `/exec`).
5. Paste the URL into `config.js` as `API_URL`, commit, and push. Vercel redeploys on its own.

If you later change `Code.gs`, use **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.

## Managing speakers
Edit the **Speakers** tab in the Google Sheet. Changes show on the site the next time someone opens it.

| Column | What to put |
|---|---|
| Order | 1, 2, 3… sets the carousel order |
| Name | Full name with title, e.g. Bhante Santacitto |
| Photo URL | `speakers/file-name.jpg` for a photo in this repo, any public image link, or a Google Drive share link (set to "Anyone with the link") |
| Show on site | `YES` to show, `NO` to hide |

Speakers without a photo show their initials.

## Deploy
On Vercel, import this repo with **no framework preset** and **no build command**. Every push to `main` redeploys.

## Run locally
Open `index.html` in a browser, or run `npx http-server . -p 8080`. With `API_URL` empty, the site runs in preview mode and doesn't save anything.
