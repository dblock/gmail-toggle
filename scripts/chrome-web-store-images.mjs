// Renders the Chrome Web Store screenshots and promo tiles in assets/chrome-web-store, and the screenshot crops
// that the explainer video in assets/video uses, from the demo recording's stills (source-*.png), the positions
// measured on that page (source.json), and the extension icon. Requires ImageMagick 7 (`magick`) on the PATH.
// Run with `npm run store-images`; `npm run record-demo` records new stills.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
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
const title = "Toggle Read and Unread Labels and Mail in GMail";

// Stills of the GMail page, 1:1 with its CSS pixels: every label shown with the pointer on the button, read labels
// hidden, and every label shown with the pointer away from the toolbar.
const frames = {
  before: join(out, "source-shown.png"),
  after: join(out, "source-hidden.png"),
};
const idle = join(out, "source-idle.png");
const layout = JSON.parse(readFileSync(join(out, "source.json"), "utf8"));
// The label list starts just below the Labels heading, at the sidebar's left edge.
const labels = { x: layout.sidebar.x - 2, y: layout.labelsHeader.y + 1 };
const buttonCenter = {
  x: layout.button.x + Math.round(layout.button.width / 2),
  y: layout.button.y + Math.round(layout.button.height / 2),
};

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
  // Screenshots: a 1280x800 crop of the GMail page, pixel for pixel, so text stays sharp.
  for (const [state, still] of Object.entries(frames)) {
    magick(
      still,
      "-crop",
      "1280x800+0+0",
      "+repage",
      png24(join(out, `screenshot-${state}.png`)),
    );
  }

  // Video crops, pixel for pixel: the label list before and after toggling, and the toolbar around the button
  // from the still where the pointer is away from it.
  mkdirSync(videoShots, { recursive: true });
  for (const state of Object.keys(frames)) {
    magick(
      join(out, `screenshot-${state}.png`),
      "-crop",
      `262x300+${labels.x}+${labels.y}`,
      "+repage",
      png24(join(videoShots, `labels-${state}.png`)),
    );
  }
  magick(
    idle,
    "-crop",
    `460x60+${buttonCenter.x - 168}+${buttonCenter.y - 30}`,
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
  for (const [state, still] of Object.entries(frames)) {
    magick(
      still,
      "-crop",
      `262x360+${labels.x}+${labels.y}`,
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
    text("Arial-Bold", 46, 600, ink, title),
    "-geometry",
    "+80+212",
    "-composite",
    text(
      "Arial",
      28,
      560,
      muted,
      "One click hides what you have already read.",
    ),
    "-geometry",
    "+80+350",
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
