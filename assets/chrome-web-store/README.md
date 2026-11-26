# Chrome Web Store Images

Images for the [Chrome Web Store listing](https://chromewebstore.google.com/detail/toggle-categories-and-lab/ckejkcopppahbffilefogkmhcgepmnog). The store requires JPEG or 24-bit PNG files without an alpha channel.

| File | Store Field | Size |
| --- | --- | --- |
| [screenshot-after.png](screenshot-after.png) | Screenshot | 1280x800 |
| [screenshot-before.png](screenshot-before.png) | Screenshot | 1280x800 |
| [small-promo-tile.png](small-promo-tile.png) | Small promo tile | 440x280 |
| [marquee-promo-tile.png](marquee-promo-tile.png) | Marquee promo tile | 1400x560 |

## Sources

The screenshots are frames 14 (read categories and labels hidden) and 13 (all shown) of [demo.gif](../../demo.gif), cropped pixel for pixel to 1280x800 without scaling, so text stays sharp. The promo tiles combine the extension icon from [public/icons](../../public/icons), the extension name and a tagline set in Arial, and crops of the label list from the same two frames. They use no GMail or Google logos.

The same command also writes the screenshot crops for the [explainer video](../video/README.md).

## Regenerate

Install [ImageMagick](https://imagemagick.org) 7, which provides `magick`, then run the generator after changing `demo.gif`, the icon, or the layout in [chrome-web-store-images.mjs](../../scripts/chrome-web-store-images.mjs).

```bash
npm run store-images
```

Upload changed images in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) under the item's Store listing.
