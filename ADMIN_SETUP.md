# Portfolio CMS Setup (Static Mode)

This project is now static-only.

## Data storage
- Portfolio data is stored in browser `localStorage` (`portfolio_json_db_v1`).
- Changes made in admin are visible only in the same browser profile unless exported/imported.

## Admin login
- Login uses credentials from [admin-config.js](C:/Users/MSI/Documents/Playground/admin-config.js).
- Update `email` and `password` there for your admin access.

## Move data to another device/browser
1. Open `admin.html`.
2. Click **Export JSON**.
3. Open `admin.html` on the target device/browser.
4. Click **Import JSON** and select the exported file.
