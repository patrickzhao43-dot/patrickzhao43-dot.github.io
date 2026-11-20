# Macroeconomic Equity Research — website

A plain, static website. No login, no database, no third-party branding.
It runs on any free static host (GitHub Pages recommended).

## Files

| File | What it controls |
|---|---|
| `js/content.js` | **All words, reports, chart data, timeline entries, people, photos.** |
| `css/style.css` | Look: fonts, colors, spacing. Colors are set once at the top. |
| `js/app.js` | Page layouts, chart, edit mode. Rarely needs changing. |
| `index.html` | Page shell (header, footer). |
| `images/` | Put photo files here and refer to them as `images/name.jpg`. |

Because content and design are in separate files, a change to one report
or one section never alters the rest of the site.

## Publish it (GitHub Pages, free, ~10 minutes)

1. Create a free account at github.com.
2. Click **New repository**. Name it `yourusername.github.io`
   (gives you the address `https://yourusername.github.io`), set it to **Public**.
3. On the new repository page click **uploading an existing file**, drag in
   everything inside this folder (index.html, css, js, images, README.md), and click **Commit changes**.
4. Go to **Settings → Pages**. Under *Branch*, choose `main` and `/ (root)`, then **Save**.
5. After about a minute the site is live at `https://yourusername.github.io`.

Optional: buy a domain (e.g. `yourname.com`) and add it under Settings → Pages → Custom domain.

## Editing it yourself

1. Open your site with `?edit` on the end: `https://yourusername.github.io/?edit`
   (or press **Ctrl+Shift+E** on any page).
2. Click any outlined text and type. Use the small buttons to add or remove reports,
   sections, indicator rows, timeline entries, people and photos. Upload photos directly.
   Chart data is edited in the box under each chart.
3. Your edits are kept as a draft in that browser only. Visitors don't see them yet.
4. Click **Export content.js**. On GitHub, open the `js` folder → **Add file → Upload files**,
   drop in the downloaded `content.js` and **Commit**. The live site updates in about a minute.

Tips
- Uploaded photos are compressed and saved inside `content.js`. For many photos, it is
  lighter to put the files in `images/` and use **Use file path** (e.g. `images/review.jpg`).
- **Discard draft** throws away unpublished edits in this browser.
- Text in `[square brackets]` is placeholder. Replace it before sharing the link.

## Editing it with an AI assistant

Connect this GitHub repository in a chat and give precise instructions
("on the Timeline page, change the July entry's title to …"). Only the named
part of `content.js` (or `style.css` for design changes) is edited and pushed.
