# Chrome Web Store Images

Images for the [Chrome Web Store listing](https://chromewebstore.google.com/detail/toggle-categories-and-lab/ckejkcopppahbffilefogkmhcgepmnog). The store requires JPEG or 24-bit PNG files without an alpha channel.

| File | Store Field | Size |
| --- | --- | --- |
| [screenshot-after.png](screenshot-after.png) | Screenshot | 1280x800 |
| [screenshot-before.png](screenshot-before.png) | Screenshot | 1280x800 |
| [small-promo-tile.png](small-promo-tile.png) | Small promo tile | 440x280 |
| [marquee-promo-tile.png](marquee-promo-tile.png) | Marquee promo tile | 1400x560 |

## Sources

The images come from stills of the demo recording, at one pixel per CSS pixel of the GMail page, and the positions measured on that page:

| File | What It Shows |
| --- | --- |
| [source-shown.png](source-shown.png) | Every category, label, and message, with the pointer and tooltip on the toolbar button. |
| [source-hidden.png](source-hidden.png) | Read categories, labels, and messages hidden. |
| [source-idle.png](source-idle.png) | Everything shown, with the pointer away from the toolbar. |
| [source.json](source.json) | Where the sidebar, the Labels header, the toolbar, and its button are on the page. |

The screenshots are 1280x800 crops of the first two stills, pixel for pixel without scaling, so text stays sharp. The promo tiles combine the extension icon from [public/icons](../../public/icons), the extension name and a tagline set in Arial, and crops of the label list from the same stills. They use no GMail or Google logos. The same command also writes the screenshot crops for the [explainer video](../video/README.md).

## Regenerate

Install [ImageMagick](https://imagemagick.org) 7, which provides `magick`, then run the generator after changing the stills, the icon, or the layout in [chrome-web-store-images.mjs](../../scripts/chrome-web-store-images.mjs).

```bash
npm run store-images
```

Upload changed images in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) under the item's Store listing.

## Record the Demo

[record-demo.mjs](../../scripts/record-demo.mjs) records the README's [demo.gif](../../demo.gif) and the stills and positions above from GMail in Google Chrome on macOS, moving the real pointer.

1. Install `cliclick`, `ffmpeg`, and `gifsicle`, for example with Homebrew.
2. In Chrome, turn on View › Developer › Allow JavaScript from Apple Events. Allow screen recording for your terminal, and Accessibility for `cliclick`, when macOS asks.
3. Load the extension (`npm run build`, then Load unpacked from `build`) and open GMail's inbox with every label shown.
4. Run the recorder, then the generator. Don't touch the mouse or keyboard while it records, for about a minute including two GMail reloads.

```bash
npm run record-demo -- --check
npm run record-demo
npm run store-images
```

`--check` finds the GMail tab, the toolbar button, and the label to open without moving the pointer or recording. The recording sets what the button hides to both read labels and read mail, restoring the previous choice afterwards (`--hide folders`, `mail`, or `both`). It scrolls to the second label with unread mail of its own and opens it (`--label 2`). It clicks only the toolbar button, that label, and Inbox; elsewhere the pointer only hovers. The GIF is 1335 pixels wide at 10 frames a second, with 128 colors and no dithering.

The recording shows the GMail account it runs in, including sender names and subjects, so record in an account whose mail you're happy to publish.
