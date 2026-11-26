// Records the README demo (demo.gif) and the stills that `npm run store-images` turns into Chrome Web Store
// images (assets/chrome-web-store/source-*.png and source.json) from GMail in Google Chrome on macOS.
//
// Open GMail in Google Chrome, with the extension loaded and every label shown, then run `npm run record-demo`.
// It brings the first GMail tab to the front, sets what the button hides (`--hide`, default both), and reloads
// GMail, restoring the previous choice afterwards. Don't touch the mouse or keyboard for about a minute. It moves
// the real pointer and clicks only the extension's toolbar button, the second label with unread mail of its own
// (`--label 2`), and Inbox. Run `npm run record-demo -- --check` to check the setup without moving the pointer or
// recording.
//
// Requires Chrome's View > Developer > Allow JavaScript from Apple Events, cliclick (with Accessibility
// permission), screencapture (with Screen Recording permission), ffmpeg, and gifsicle.
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const out = join(root, "assets", "chrome-web-store");
const check = process.argv.includes("--check");
// Which label with unread mail of its own to open, counting from the top of the sidebar (`--label 2`, the default).
const labelArg = process.argv.indexOf("--label");
const nth = labelArg > 0 ? Number(process.argv[labelArg + 1]) : 2;
if (!(nth >= 1)) throw new Error("--label takes a position, such as 2.");
// What the toggle hides while recording: "folders", "mail", or "both" (the default here, to show both).
const hideArg = process.argv.indexOf("--hide");
const hide = hideArg > 0 ? process.argv[hideArg + 1] : "both";
if (!["folders", "mail", "both"].includes(hide)) {
  throw new Error("--hide takes folders, mail, or both.");
}

const run = (command, args) => execFileSync(command, args).toString().trim();
const sleep = (ms) =>
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const osascript = (...lines) =>
  run(
    "osascript",
    lines.flatMap((line) => ["-e", line]),
  );
// Runs JavaScript in GMail's tab and returns its result as a string.
const page = (js) =>
  run("osascript", [
    "-e",
    "on run argv",
    "-e",
    'tell application "Google Chrome" to return execute active tab of front window javascript (item 1 of argv)',
    "-e",
    "end run",
    js,
  ]);

// Page helpers: where an element is on screen, in points, and the toolbar button visible in the current view.
const helpers = `
  const chromeTop = window.outerHeight - window.innerHeight;
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return [Math.round(window.screenX + r.left + Math.min(r.width / 2, 30)), Math.round(window.screenY + chromeTop + r.top + r.height / 2)].join(",");
  };
  const button = () => [...document.querySelectorAll(".gmail-toggle-toolbar-button .T-I")].find((el) => el.getBoundingClientRect().width > 0);
  const hidden = () => document.querySelectorAll('.TN[style*="display: none"]').length;
  const sidebar = () => {
    let box = document.querySelector(".aAw").parentElement;
    while (box && !(box.scrollHeight > box.clientHeight + 5 && /auto|scroll/.test(getComputedStyle(box).overflowY))) box = box.parentElement;
    return box;
  };
`;
const at = (expression) =>
  page(`(() => { ${helpers} return onScreen(${expression}); })()`);

for (const tool of ["cliclick", "ffmpeg", "gifsicle", "screencapture"]) {
  try {
    run("which", [tool]);
  } catch {
    throw new Error(`Install ${tool} first.`);
  }
}
// Bring the first GMail tab, in any Chrome window, to the front.
const found = osascript(
  'tell application "Google Chrome"',
  "repeat with w from 1 to count of windows",
  "repeat with t from 1 to count of tabs of window w",
  'if URL of tab t of window w starts with "https://mail.google.com/" then',
  "set index of window w to 1",
  "set active tab index of window 1 to t",
  "activate",
  'return "found"',
  "end if",
  "end repeat",
  "end repeat",
  'return ""',
  "end tell",
);
if (!found) throw new Error("Open GMail in Google Chrome.");
sleep(500);

// Choose what the toggle hides, remembering the user's choice to restore it, and reload GMail to apply it.
const previousHide = page('localStorage.getItem("gmail-toggle.hide") || ""');
const setHide = (value) => {
  const statement = value
    ? `localStorage.setItem("gmail-toggle.hide", ${JSON.stringify(value)})`
    : 'localStorage.removeItem("gmail-toggle.hide")';
  page(`(() => { ${statement}; location.reload(); return "ok"; })()`);
  sleep(8000);
};
if (!check) setHide(hide);

// Start from the inbox with every label shown and the sidebar scrolled to the top.
page(`(() => { location.hash = "#inbox"; return "ok"; })()`);
sleep(2000);
page(
  `(() => { ${helpers} if (hidden() > 0) button().click(); sidebar().scrollTop = 0; return "ok"; })()`,
);
sleep(500);

// The nth label with unread mail of its own (a count, not just unread labels below it) that stays visible
// when read labels are hidden: hide them through the extension, look, and show them again.
const target = page(`(() => {
  ${helpers}
  button().click();
  const link = [...document.querySelectorAll('.nU a[href*="#label/"]')].filter((a) => a.getBoundingClientRect().height > 0 && /\\d+$/.test((a.closest(".TN") || a).innerText.trim()))[${nth - 1}];
  button().click();
  return link ? link.getAttribute("href") : "";
})()`);
if (!target) throw new Error(`No label number ${nth} with unread mail.`);
const label = `[...document.querySelectorAll('.nU a')].find((a) => a.getAttribute('href') === ${JSON.stringify(target)})`;

// Positions on the page, in CSS pixels, for the Chrome Web Store images.
const layout = JSON.parse(
  page(`(() => {
    ${helpers}
    const rect = (el) => { const r = el.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) }; };
    return JSON.stringify({
      chromeTop,
      viewport: { width: innerWidth, height: innerHeight },
      sidebar: rect(sidebar()),
      labelsHeader: rect(document.querySelector(".aAw")),
      toolbar: rect(button().closest("[gh='mtb']")),
      button: rect(button()),
    });
  })()`),
);
const [x1, y1, x2, y2] = osascript(
  'tell application "Google Chrome" to get bounds of front window',
)
  .split(", ")
  .map(Number);
console.log(
  `Label: ${decodeURIComponent(target)}; window: ${x2 - x1}x${y2 - y1} at ${x1},${y1}; button: ${at("button()")}`,
);
if (check) process.exit(0);

const move = (point) => run("cliclick", ["-e", "350", `m:${point}`]);
const click = () => run("cliclick", ["c:."]);
// Where the pointer rests: a little above and left of the middle of the window, never clicked.
const idle = `${Math.round(x1 + (x2 - x1) * 0.42)},${Math.round(y1 + (y2 - y1) * 0.4)}`;
move(idle);
sleep(800);

const work = mkdtempSync(join(tmpdir(), "record-demo-"));
try {
  const movie = join(work, "demo.mov");
  const capture = spawn("screencapture", [
    "-x",
    "-k",
    "-v",
    "-V",
    "30",
    `-R${x1},${y1},${x2 - x1},${y2 - y1}`,
    movie,
  ]);
  const t0 = Date.now();
  const now = () => (Date.now() - t0) / 1000;
  const times = { idle: 0.3 };

  sleep(600);
  move(
    at(`document.querySelector(".aAw")`).replace(
      /,(\d+)$/,
      (_, y) => `,${Number(y) + 120}`,
    ),
  );
  // Scroll the label into the middle of the sidebar if it's out of view, smoothly over 1.2 seconds.
  page(`(() => {
    ${helpers}
    const box = sidebar(), row = ${label}.closest(".TN");
    const b = box.getBoundingClientRect(), r = row.getBoundingClientRect();
    if (r.top >= b.top && r.bottom <= b.bottom) return "visible";
    const start = box.scrollTop, end = start + r.top - b.top - box.clientHeight / 2, t0 = performance.now();
    const step = (time) => {
      const t = Math.min(1, (time - t0) / 1200);
      box.scrollTop = start + (end - start) * (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return "scrolling";
  })()`);
  sleep(1400);

  // Hide read labels, open the label, show everything, and return to the inbox.
  move(at("button()"));
  sleep(400);
  click();
  sleep(1300);
  move(at(label));
  sleep(400);
  click();
  sleep(1700);
  move(at("button()"));
  sleep(400);
  click();
  sleep(1300);
  move(at(`document.querySelector('.nU a[href$="#inbox"]')`));
  sleep(400);
  click();
  sleep(1500);

  // Toggle back and forth twice, pausing on the button first so its tooltip shows.
  move(at("button()"));
  sleep(500);
  times.shown = now();
  for (let i = 0; i < 4; i++) {
    click();
    if (i === 0) {
      sleep(900);
      times.hidden = now();
      sleep(200);
    } else {
      sleep(1100);
    }
  }
  move(idle);
  sleep(1500);
  const end = now();
  await new Promise((done) => capture.on("exit", done));
  // screencapture starts recording a moment after it launches: shift the times by that delay, which is how much
  // longer it ran than the movie it wrote.
  const length = Number(
    run("ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=nw=1:nk=1",
      movie,
    ]),
  );
  const delay = Math.max(0, now() - length);
  for (const name of ["shown", "hidden"]) times[name] -= delay;

  // The GIF: the whole window, 1335 pixels wide, 10 frames a second, 128 colors without dithering.
  const filter = `trim=start=0.2:end=${(end - delay).toFixed(2)},setpts=PTS-STARTPTS,fps=10,scale=1335:-2:flags=lanczos`;
  const palette = join(work, "palette.png");
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    movie,
    "-vf",
    `${filter},palettegen=stats_mode=diff:max_colors=128`,
    palette,
  ]);
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    movie,
    "-i",
    palette,
    "-lavfi",
    `${filter}[x];[x][1:v]paletteuse=dither=none:diff_mode=rectangle`,
    "-loop",
    "0",
    join(root, "demo.gif"),
  ]);
  run("gifsicle", ["-O3", "-b", join(root, "demo.gif")]);

  // Stills of the page alone, at one pixel per CSS pixel.
  const width = x2 - x1;
  const height = y2 - y1;
  for (const [name, time] of Object.entries(times)) {
    run("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-ss",
      time.toFixed(2),
      "-i",
      movie,
      "-frames:v",
      "1",
      "-vf",
      `scale=${width}:${height}:flags=area,crop=${layout.viewport.width}:${layout.viewport.height}:0:${layout.chromeTop}`,
      "-pix_fmt",
      "rgb24",
      join(out, `source-${name}.png`),
    ]);
  }
  const positions = { ...layout };
  delete positions.chromeTop;
  writeFileSync(
    join(out, "source.json"),
    `${JSON.stringify(positions, null, 2)}\n`,
  );
  console.log(
    `Demo: ${join(root, "demo.gif")}; stills in ${out}. Run npm run store-images next.`,
  );
} finally {
  rmSync(work, { recursive: true, force: true });
  setHide(previousHide);
}
