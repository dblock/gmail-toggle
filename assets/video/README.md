# Explainer Video

[gmail-toggle.mp4](gmail-toggle.mp4) is a one-minute narrated tour of the extension for people who use it: the busy sidebar, the toolbar button, the label list before and after a click, showing everything again, and how to install it. [captions.srt](captions.srt) has its English captions. The narration is by ElevenLabs, over original background music.

## Sources

[script.json](script.json) holds the narration for each step, the voice, and a pronunciation list. [scenes](scenes) has one 1920x1080 HTML scene per chapter, styled by [theme.css](theme.css). The screens come from the stills of the demo recording in [chrome-web-store](../chrome-web-store/README.md#sources): the busy sidebar is [screenshot-before.png](../chrome-web-store/screenshot-before.png) at full size, and [shots](shots) has pixel-for-pixel crops of the label list and the toolbar, written by `npm run store-images` with the Chrome Web Store images.

## Credits

Narration by [ElevenLabs](https://elevenlabs.io), voice Matilda, on the free plan, which requires this credit. The background music is original, composed by [video-music.mjs](../../scripts/video-music.mjs).

## Rebuild

The video is built with the [explain-with-video](https://github.com/marekkirejczyk/skills/tree/main/skills/explain-with-video) skill from [marekkirejczyk/skills](https://github.com/marekkirejczyk/skills). It needs Node.js, `ffmpeg`, `playwright-core` with Chromium, and an ElevenLabs API key with Text to Speech and Voices permissions, in `ELEVENLABS_API_KEY` or the macOS Keychain item `repo-video-elevenlabs`. Without a key the skill falls back to macOS speech.

Run the build from a scratch folder where `playwright-core` is installed, pointing it at this folder. Then `npm run video-music` composes the background music, mixes it under the narration, and writes [gmail-toggle.mp4](gmail-toggle.mp4) and [captions.srt](captions.srt).

```bash
cd "$(mktemp -d)" && npm init -y && npm i playwright-core
node <skill-dir>/scripts/make.mjs <repo>/assets/video all
cd <repo> && npm run video-music
```

The build writes to `assets/video/out`, which Git ignores. It caches the narration per sentence there, so a rebuild only spends ElevenLabs credits on changed lines. Check the stills in `out/preview` before committing.
