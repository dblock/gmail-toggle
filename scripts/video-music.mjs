// Composes an original, upbeat background track and mixes it under the explainer video's narration. Reads the
// build output in assets/video/out (run the explain-with-video build first) and writes assets/video/gmail-toggle.mp4
// and assets/video/captions.srt. Requires ffmpeg and ffprobe on the PATH. Run with `npm run video-music`.
import { copyFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const video = join(root, "assets", "video");
const build = join(video, "out");
const rate = 48000;
const bpm = 104;

// The narration-only video from the build, and its length in seconds.
const narrated = join(build, "video.mp4");
const seconds = Number(
  execFileSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=nw=1:nk=1",
    narrated,
  ]).toString(),
);

// Seeded noise, so every run writes the same music.
let seed = 42;
const noise = () =>
  ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1;

function compose() {
  const beat = 60 / bpm;
  const bar = beat * 4;
  const total = Math.ceil(seconds * rate);
  const mix = new Float32Array(total);
  const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
  // C, G, Am, F: the bass root and the triad, as MIDI note numbers.
  const chords = [
    [48, [60, 64, 67]],
    [43, [59, 62, 67]],
    [45, [57, 60, 64]],
    [41, [57, 60, 65]],
  ];

  const add = (start, length, voice, gain) => {
    const s0 = Math.round(start * rate);
    const n = Math.min(Math.round(length * rate), total - s0);
    for (let i = 0; i < n; i++) mix[s0 + i] += voice(i / rate) * gain;
  };
  // A soft plucked note: a few harmonics with a quick attack and an exponential decay.
  const pluck = (f) => (t) =>
    Math.min(1, t / 0.004) *
    Math.exp(-t * 5) *
    (Math.sin(2 * Math.PI * f * t) +
      0.45 * Math.sin(4 * Math.PI * f * t) +
      0.18 * Math.sin(6 * Math.PI * f * t));
  // A warm pad: three slightly detuned, band-limited saws with a slow swell.
  const pad = (f, length) => (t) => {
    const envelope =
      Math.min(1, t / 0.35) * Math.min(1, Math.max(0, (length - t) / 0.4));
    let v = 0;
    for (const detune of [0.997, 1, 1.003]) {
      for (let h = 1; h <= 6; h++) {
        v += Math.sin(2 * Math.PI * f * detune * h * t) / h ** 1.6;
      }
    }
    return (envelope * v) / 3;
  };
  const bass = (f) => (t) =>
    Math.min(1, t / 0.006) *
    Math.exp(-t * 3.2) *
    (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t));
  const kick = (t) =>
    Math.exp(-t * 9) *
    Math.sin(2 * Math.PI * (48 * t + (110 / 30) * (1 - Math.exp(-t * 30))));
  const hit = (decay) => {
    let last = 0;
    return (t) => {
      const x = noise();
      const y = x - last;
      last = x;
      return y * Math.exp(-t * decay);
    };
  };

  const bars = Math.ceil(seconds / bar);
  for (let b = 0; b < bars; b++) {
    const [root, triad] = chords[b % chords.length];
    const t0 = b * bar;
    for (const [i, note] of triad.entries()) {
      add(t0, bar + 0.4, pad(hz(note), bar + 0.4), i ? 0.04 : 0.05);
    }
    // An eighth-note arpeggio an octave up: 1 3 5 8 5 3 5 8.
    const arpeggio = [0, 1, 2, 3, 2, 1, 2, 3].map((i) =>
      i === 3 ? triad[0] + 12 : triad[i],
    );
    arpeggio.forEach((note, i) =>
      add(t0 + (i * beat) / 2, 1.2, pluck(hz(note + 12)), i % 2 ? 0.1 : 0.13),
    );
    // Drums and bass rest for the first and last two bars.
    if (b >= 2 && b < bars - 2) {
      for (const k of [0, 2]) add(t0 + k * beat, 0.5, kick, 0.55);
      for (const k of [1, 3]) add(t0 + k * beat, 0.25, hit(22), 0.16);
      for (let h = 0; h < 8; h++) {
        add(t0 + (h * beat) / 2, 0.08, hit(70), h % 2 ? 0.07 : 0.04);
      }
      for (const k of [0, 1.5, 2, 3.5]) {
        add(t0 + k * beat, beat * 0.9, bass(hz(root)), 0.3);
      }
    }
  }

  // A light dotted-eighth echo, then a two-second fade-out.
  const delay = Math.round(beat * 0.75 * rate);
  for (let i = delay; i < total; i++) mix[i] += mix[i - delay] * 0.22;
  const fade = 2 * rate;
  for (let i = 0; i < fade; i++) mix[total - 1 - i] *= i / fade;

  // Normalize and write a 48 kHz mono 16-bit WAV.
  const peak = mix.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
  const wav = Buffer.alloc(44 + total * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + total * 2, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(total * 2, 40);
  for (let i = 0; i < total; i++) {
    wav.writeInt16LE(Math.round((mix[i] / peak) * 0.85 * 32767), 44 + i * 2);
  }
  return wav;
}

const music = join(build, "music.wav");
writeFileSync(music, compose());

// The music sits about 10 dB under the voice, ducks further while the voice speaks, and fades in.
execFileSync("ffmpeg", [
  "-y",
  "-v",
  "error",
  "-i",
  narrated,
  "-i",
  music,
  "-filter_complex",
  "[1:a]volume=-7dB,afade=t=in:d=1.5[music];" +
    "[0:a]asplit=2[voice][key];[voice]volume=-3dB[quieter];" +
    "[music][key]sidechaincompress=threshold=0.03:ratio=6:attack=30:release=500[ducked];" +
    "[quieter][ducked]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[audio]",
  "-map",
  "0:v",
  "-map",
  "[audio]",
  "-map",
  "0:s",
  "-c:v",
  "copy",
  "-c:a",
  "aac",
  "-b:a",
  "160k",
  "-c:s",
  "copy",
  "-movflags",
  "+faststart",
  join(video, "gmail-toggle.mp4"),
]);
copyFileSync(join(build, "captions.srt"), join(video, "captions.srt"));
console.log(
  `Video: ${join(video, "gmail-toggle.mp4")} (${seconds.toFixed(1)} s, music at ${bpm} BPM)`,
);
