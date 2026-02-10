# Static React Site (single-file)

This is a minimal static React site contained in a single file: `index.html`. It uses React + ReactDOM from CDN and in-browser Babel to run JSX — no server or build step required.

## Usage

- Open locally: double-click `index.html` or open it in your browser (File → Open).
- Optional local static server (recommended for some browsers/extensions):
  - Python 3: `python -m http.server 8080`
  - Node (http-server): `npx http-server -p 8080`
  Then browse to `http://localhost:8080`.

## Hosting

- Can be hosted on any static host (GitHub Pages, Netlify, AWS S3, etc.). Drop `index.html` at the site root.

## Notes

- Small sample dataset is embedded in the file. To edit UI content, modify `SAMPLE_DATA` inside `index.html`.