# Photocard Studio

A free, browser-based BanglaTopic photo card generator for news posts and social media graphics. Edit the text, drop in a photo and export a high-resolution PNG.

Everything runs locally in the browser — no build step, no server, no accounts, and no uploads.

## Run it

Open `index.html` through any static file server (the app uses ES modules, so `file://` will not load it):

```bash
cd photocard
python -m http.server 8000
# then open http://localhost:8000
```

## Features

- **One BanglaTopic design** — a 1080 × 1350 (4:5) brand card, ready to use
- **Live preview** scaled to fit any screen
- **Photo controls** — upload or URL, cover/contain/fill, zoom, horizontal/vertical position, and drag-to-reposition directly on the preview
- **Logo support** — upload or URL, replaces the built-in Bangla Topic wordmark
- **Typography** — 11 Google Fonts including four with full Bengali coverage (Hind Siliguri, Noto Serif Bengali, Baloo Da 2, Anek Bangla)
- **Headline size** — nudge the headline scale from 70% to 160%, on top of automatic fit
- **Theme colors** — accent, background and text colors
- **Advertisement strip** — upload an ad banner or paste its URL; a 110 px sponsor strip is added to the bottom of the card and included in the export
- **Bengali + multilingual text** — headings wrap and auto-shrink to fit their layout
- **PNG export** — 2160 × 2700 px (2×) via html2canvas, with `object-fit` baked into canvases so crops match the preview
- **Autosave** — text, styles and settings persist in `localStorage`
- **Light / dark editor theme** — follows your system preference by default
- **Responsive** — the editor becomes a slide-out drawer on phones

## The design

BanglaTopic: full-width photo, red category badge, large centred Bangla headline on black with a red glow, a red call-to-action pill, the domain, the Bangla Topic wordmark and the bottom tagline. Add a logo to replace the built-in wordmark, and the bottom tagline is hidden automatically when an ad strip is active.

## Keyboard-free workflow

1. Edit the content fields — the preview updates as you type.
2. Upload a photo (or paste an image URL) and drag it to frame the subject.
3. Optionally add a logo, adjust the headline size and the three theme colors.
4. Optionally upload an ad banner to add the sponsor strip.
5. Click **Download PNG**.

## Notes

- Text longer than a layout can hold is automatically reduced down to a readable minimum. Very long copy may still be clipped, so keep headlines tight.
- Remote image URLs only export cleanly when the host sends CORS headers. If a host blocks export, upload the image file instead.
- Saved photos are stored in `localStorage`; very large images may exceed the browser quota, in which case the app keeps your text settings and asks you to re-add the photo.

## Tech

Vanilla HTML, CSS and JavaScript. [html2canvas](https://html2canvas.hertzen.com/) for PNG export and Google Fonts for typography. No frameworks, no dependencies to install.

## License

MIT — use it, fork it, rebrand it.
