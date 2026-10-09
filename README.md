# QR Studio

**Make it scannable.** A responsive, browser-first QR Code Generator & Designer built for the GDG on Campus SRM recruitment task.

## Features

- Generate QR codes for URLs, plain text, email, phone numbers, and Wi-Fi networks.
- Live QR preview with customizable size, foreground/background colors, error correction and quiet zone.
- Four editable style presets: Classic, Midnight, Forest and Coral.
- PNG export, including quiet-zone padding.
- Type-specific input validation and scanability guidance for contrast, quiet zone, size and long payloads.
- Recent creations stored in browser localStorage; load or clear history.
- Responsive desktop/mobile layout and dark/light themes.
- Client-side generation: payloads are not sent to a QR generation API.

## Run locally

Serve this folder with any static HTTP server, or open `index.html` in a browser with internet access. QRCode.js and fonts load from public CDNs.

For example, with Python installed:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy

This is a static site and can be deployed directly to Vercel. No build command or server-side environment variables are required.

## Testing checklist

- [ ] URL accepts `example.com` and normalizes to HTTPS; malformed URLs show an error.
- [ ] Text, email, phone and Wi-Fi produce the expected payload types.
- [ ] Size, colors, error correction and quiet-zone controls update the preview.
- [ ] Presets can be customized after selecting them.
- [ ] PNG downloads with the selected colors and quiet zone.
- [ ] Invalid/incomplete fields prevent download.
- [ ] History survives refresh, can be loaded, and can be cleared.
- [ ] Scanability warnings are shown when relevant.
- [ ] Check responsive layout on desktop and narrow mobile screens.
- [ ] Scan downloaded PNGs on real devices before relying on them in production.

## Design decisions and limitations

- QR codes are generated in the browser to avoid sending payload content to a server.
- History is local to the current browser profile and device; clearing browser storage removes it.
- Scanability warnings are heuristics, not guarantees. Test printed or exported codes with real scanners.
- Fonts and QRCode.js are loaded from CDNs, so initial use requires an internet connection.

## Credits

- QR rendering: [QRCode.js](https://github.com/davidshimjs/qrcodejs)
- Fonts: DM Sans, DM Mono and Space Grotesk via Google Fonts.
