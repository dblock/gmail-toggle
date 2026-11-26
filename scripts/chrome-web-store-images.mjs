// Renders the Chrome Web Store screenshots and promo tiles in assets/chrome-web-store, and the screenshot crops
// that the explainer video in assets/video uses, from demo.gif and the extension icon. Requires ImageMagick 7
// (`magick`) on the PATH. Run with `npm run store-images`.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "assets", "chrome-web-store");
const videoShots = join(root, "assets", "video", "shots");
const icon = join(root, "public", "icons", "icon_512.png");
const background = "#E8F0FE";
const ink = "#202124";
const muted = "#3C4043";
const accent = "#1A73E8";
const title = "Toggle Categories and Labels in GMail";

// demo.gif frames 13 and 14 show the label list before and after toggling.
const frames = { before: 13, after: 14 };

const magick = (...args) =>
  execFileSync("magick", args.flat(), { stdio: "inherit" });
const text = (font, size, width, fill, value) => [
  "(",
  "-background",
  "none",
  "-fill",
  fill,
  "-font",
  font,
  "-pointsize",
  `${size}`,
  "-size",
  `${width}x`,
  `caption:${value}`,
  ")",
];
// Store images must be 24-bit PNGs without an alpha channel. Leaving out date and time chunks keeps the files
// byte-identical across runs.
const png24 = (path) => [
  "-alpha",
  "off",
  "-define",
  "png:exclude-chunks=date,time",
  `PNG24:${path}`,
];
const tile = (name) => [
  "-background",
  background,
  "-flatten",
  ...png24(join(out, name)),
];

const work = mkdtempSync(join(tmpdir(), "chrome-web-store-"));
try {
  const frame = (n) => join(work, `frame-${String(n).padStart(2, "0")}.png`);
  magick(join(root, "demo.gif"), "-coalesce", join(work, "frame-%02d.png"));

  // Screenshots: a 1280x800 crop of the GMail window, pixel for pixel, so text stays sharp.
  for (const [state, n] of Object.entries(frames)) {
    magick(
      frame(n),
      "-crop",
      "1280x800+0+0",
      "+repage",
      png24(join(out, `screenshot-${state}.png`)),
    );
  }

  // Video crops, pixel for pixel: the label list before and after toggling, and the toolbar from the first
  // frame, where the cursor does not cover the extension's button.
  mkdirSync(videoShots, { recursive: true });
  for (const state of Object.keys(frames)) {
    magick(
      join(out, `screenshot-${state}.png`),
      "-crop",
      "262x300+66+500",
      "+repage",
      png24(join(videoShots, `labels-${state}.png`)),
    );
  }
  magick(
    frame(0),
    "-crop",
    "460x60+320+196",
    "+repage",
    png24(join(videoShots, "toolbar.png")),
  );

  // Small promo tile, 440x280: icon, name, and tagline.
  magick(
    "-size",
    "440x280",
    `xc:${background}`,
    "(",
    icon,
    "-resize",
    "88x88",
    ")",
    "-geometry",
    "+36+96",
    "-composite",
    text("Arial-Bold", 27, 270, ink, title),
    "-geometry",
    "+146+78",
    "-composite",
    text("Arial", 17, 270, muted, "Hide what you have already read."),
    "-geometry",
    "+146+178",
    "-composite",
    tile("small-promo-tile.png"),
  );

  // Marquee promo tile, 1400x560: name and tagline beside the label list before and after toggling.
  for (const [state, n] of Object.entries(frames)) {
    magick(
      frame(n),
      "-crop",
      "262x360+66+500",
      "+repage",
      "-bordercolor",
      "#DADCE0",
      "-border",
      "1",
      "(",
      "+clone",
      "-background",
      "#5F6368",
      "-shadow",
      "35x8+0+5",
      ")",
      "+swap",
      "-background",
      "none",
      "-layers",
      "merge",
      "+repage",
      join(work, `${state}.png`),
    );
  }
  magick(
    "-size",
    "1400x560",
    `xc:${background}`,
    "(",
    icon,
    "-resize",
    "112x112",
    ")",
    "-geometry",
    "+80+70",
    "-composite",
    text("Arial-Bold", 54, 560, ink, title),
    "-geometry",
    "+80+210",
    "-composite",
    text(
      "Arial",
      28,
      560,
      muted,
      "One click hides the categories and labels you have already read.",
    ),
    "-geometry",
    "+80+380",
    "-composite",
    join(work, "before.png"),
    "-geometry",
    "+730+80",
    "-composite",
    join(work, "after.png"),
    "-geometry",
    "+1080+80",
    "-composite",
    "-fill",
    accent,
    "-stroke",
    accent,
    "-strokewidth",
    "8",
    "-draw",
    "line 1008,261 1050,261",
    "-strokewidth",
    "1",
    "-draw",
    "polygon 1050,247 1066,261 1050,275",
    "-stroke",
    "none",
    "-fill",
    muted,
    "-font",
    "Arial-Bold",
    "-pointsize",
    "22",
    "-gravity",
    "NorthWest",
    "-annotate",
    "+827+472",
    "Before",
    "-annotate",
    "+1185+472",
    "After",
    tile("marquee-promo-tile.png"),
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
