# Jigokumushi Kobo Kannawa — website redesign demo

Static concept demo (HTML/CSS/vanilla JS, no build step). **Not published. Not the official site.**
All facts are taken only from the official site https://jigokumushi.com/ (checked Oct 17, 2026).

## Run locally
Double-click `index.html`, or serve the folder: `python3 -m http.server 8000` and open http://localhost:8000

## Free hosting (only if you decide to publish)
- Netlify Drop: drag this folder onto https://app.netlify.com/drop
- GitHub Pages: push the folder to a repo → Settings → Pages → deploy from branch

## Structure
- `index.html` – all sections (hero depth layers, zoom section, depth tunnel, menu, facilities, crowd calendar, access, FAQ, news, more)
- `css/style.css` – dark steam theme, reveal animations (left/right/up/down/scale), responsive layout
- `js/main.js` – i18n engine, globe language picker (saved in localStorage, `?lang=xx` URL param), scroll-driven parallax/zoom, steam particle canvas
- `js/data.js` – menu prices, crowd calendar, closed days, bus routes (from the official site)
- `js/i18n/*.js` – one dictionary per language: en, ja, ko, zh-Hans, zh-Hant, fr, vi, es, de, th, id, pt, it

## Adding a language
Copy `js/i18n/en.js` to `xx.js`, change `I18N.en` to `I18N['xx']`, translate the values, add a `<script>` tag in `index.html`, and add the code to the `LANGS` list at the top of `js/main.js`. A missing key falls back to English.

## Assets
No photos from the official site are used. All artwork is CSS/SVG/canvas. Fonts are loaded from Google Fonts (SIL Open Font License). The map is a Google Maps embed that only loads when you press "Show map".
