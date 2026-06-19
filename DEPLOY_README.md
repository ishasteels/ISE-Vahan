# ISE VOMS — Deployment Guide
## Isha Steels Enterprises — Vehicle Operations Management System

---

## Files in this package

| File | Purpose |
|------|---------|
| `index.html` | Full PWA UI (HTML + CSS) |
| `app.js` | All JavaScript + JSONP API calls |
| `manifest.json` | PWA manifest (installable) |
| `sw.js` | Service worker (offline shell) |
| `icon-192.png` | App icon |
| `icon-512.png` | App icon large |
| `icon-180.png` | Apple touch icon |
| `Code.gs` | Google Apps Script backend |

---

## Step 1 — Google Sheet Setup

1. Open your `ISE_VOMS.xlsx` file
2. Upload it to Google Drive
3. Open with **Google Sheets**
4. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/` **`THIS_IS_YOUR_SHEET_ID`** `/edit`

---

## Step 2 — Google Apps Script Setup

1. In Google Sheets: **Extensions → Apps Script**
2. Delete the default `myFunction()` code
3. Paste the entire `Code.gs` content
4. Find this line and replace with your Sheet ID:
   ```javascript
   var SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
   ```
5. **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy** → Copy the web app URL

---

## Step 3 — Update app.js

Open `app.js` and replace line 6:
```javascript
var API = 'YOUR_GAS_DEPLOYMENT_URL_HERE';
```
With your actual GAS URL:
```javascript
var API = 'https://script.google.com/macros/s/ABCDEF.../exec';
```

---

## Step 4 — GitHub Pages Hosting

1. Create GitHub account: `ishasteels` (or use existing)
2. Create new repo: `voms` (gives URL: `ishasteels.github.io/voms`)
3. Upload all 8 files (index.html, app.js, manifest.json, sw.js, 3 icons)
4. Go to repo **Settings → Pages → Branch: main → Save**
5. Wait 2 minutes → Visit `https://ishasteels.github.io/voms`

---

## Step 5 — Install on Phone (PWA)

**Android:**
1. Open Chrome → visit the GitHub Pages URL
2. Tap ⋮ menu → **Add to Home Screen**
3. App opens in standalone mode (no browser bar)

**iPhone:**
1. Open Safari → visit the URL
2. Tap Share → **Add to Home Screen**

---

## Step 6 — Set Daily Email Reminder Trigger

1. Go to Apps Script → **Triggers** (⏱ icon)
2. Click **+ Add Trigger**
3. Function: `sendDailyReminders`
4. Event: **Time-driven → Day timer → 8 PM to 9 PM**
5. Save

---

## Login Credentials (from ISE_VOMS sheet)

| Role | Email | Password |
|------|-------|----------|
| Admin | `rajesh@ishasteels.com` | `Pass@1234` |
| Manager | `priya@ishasteels.com` | `Pass@1234` |
| Driver | `ramesh@ishasteels.com` | `Pass@1234` |
| Master | *(any email)* | `iseVOMS@admin2026` |

---

## When to Redeploy GAS

Only needed when `Code.gs` logic changes:
1. Apps Script → Deploy → Manage Deployments
2. Edit (pencil) → Version: **New Version** → Deploy
3. URL stays the same — no app.js update needed

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login spins forever | Check GAS URL in app.js, test URL in browser directly |
| "Email not found" | Wrong SHEET_ID in Code.gs — verify and redeploy |
| App not installable | Check browser console for manifest/sw.js errors |
| Chrome badge on icon | Delete app → clear cache → reinstall via "Add to Home Screen" |
| Data not loading | Check Users sheet has exact column headers |

---

## Support
**ishasteels.com** | Version 3.0 | Database Freeze Edition
