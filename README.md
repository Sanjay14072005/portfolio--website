# Sanjay Portfolio Website

Static personal portfolio website for Sanjay, focused on AI/ML, projects, certificates, achievements, interests, LeetCode activity, and contact details.

## Stack

- HTML
- CSS
- JavaScript
- Local JSON-style data stored inside `data-store.js`
- Google Analytics (`G-ZX0GX2K9LG`)

## Main Files

- `index.html` - public portfolio site
- `admin.html` - local admin panel for editing content
- `admin.js` - admin logic
- `data-store.js` - default site data + cache version logic
- `styles.css` - styling
- `script.js` - main UI behavior
- `leetcode-live.js` - LeetCode section behavior
- `update-portfolio-data.ps1` - updates `data-store.js` from exported JSON
- `update-portfolio-data.bat` - simple one-command wrapper for Windows
- `start-local-server.bat` - starts the local server

## Run Locally

### Option 1

```powershell
cd C:\Users\MSI\Documents\Playground
python -m http.server 5500
```

### Option 2

Double-click:

```text
start-local-server.bat
```

Then open:

```text
http://localhost:5500
```

Admin panel:

```text
http://localhost:5500/admin.html
```

## Important Data Note

This project has 2 layers of content:

1. Browser localStorage data created through the admin panel
2. Default published data inside `data-store.js`

When you edit content in the admin panel, it updates only local browser storage first.

That means:

- your browser sees the new content immediately
- GitHub and Netlify do not get that new content automatically

To make changes permanent for everyone, you must:

1. Export JSON from admin
2. Run the update script
3. Push the changed files to GitHub

## Content Update Workflow

### Step 1: Update content in admin

Open:

```text
http://localhost:5500/admin.html
```

Add, edit, or delete:

- Skills
- Projects
- Certificates
- Achievements
- Interests

### Step 2: Export JSON

In the admin panel, click:

```text
Export JSON
```

Save the exported file anywhere on your PC.

Example:

```text
C:\Users\MSI\Downloads\portfolio-db.json
```

### Step 3: Apply the export to the real site files

Run:

```powershell
cd C:\Users\MSI\Documents\Playground
.\update-portfolio-data.bat "C:\Users\MSI\Downloads\portfolio-db.json"
```

This command automatically:

- replaces `defaultDb` in `data-store.js`
- bumps `SITE_VERSION`
- updates the `data-store.js?v=...` cache value in `index.html`
- updates the `data-store.js?v=...` cache value in `admin.html`

This is the key step that makes old visitors receive the new version instead of seeing cached old content.

## Test Before Pushing

After running the update script:

1. Start the local server
2. Open `http://localhost:5500`
3. Check the public site
4. Open `http://localhost:5500/admin.html`
5. Confirm the updated data is correct

## Push Changes to GitHub

When everything looks correct:

```powershell
cd C:\Users\MSI\Documents\Playground
git status
git add data-store.js index.html admin.html README.md update-portfolio-data.ps1 update-portfolio-data.bat
git commit -m "Update portfolio content"
git push origin main
```

If you also changed design or behavior files, add them too:

```powershell
git add styles.css script.js leetcode-live.js
```

## Skill Update Example

If you only changed skills in admin, the process is still the same:

1. Update the skills in `admin.html`
2. Export JSON
3. Run:

```powershell
.\update-portfolio-data.bat "C:\Users\MSI\Downloads\portfolio-db.json"
```

4. Test locally
5. Push to GitHub

You do not need to manually edit `data-store.js` anymore.

## Cache / Version Behavior

The site uses:

- `portfolio_json_db_v1`
- `portfolio_site_version`

When the update script runs, it changes the site version automatically.

That forces returning users to refresh old cached portfolio data and see the new published version.

## If Something Looks Old

If localhost still shows older browser data, run this in browser console:

```js
localStorage.removeItem("portfolio_json_db_v1");
localStorage.removeItem("portfolio_site_version");
location.reload();
```

Do this only if needed.

## Analytics

Google Analytics is already connected in `index.html` using:

## Live Site

- Custom domain: `ssanjay.me`
- GitHub repo: `portfolio--website`
