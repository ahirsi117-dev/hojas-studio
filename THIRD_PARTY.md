# Third-party notices

Hojas Studio is made by Hojas (Rakan Alzahrani). Parts of it were inspired by or adapted from the projects below. Full license texts are in `LICENSES/`.

## HyperFrames, Apache License 2.0
Copyright (c) 2026 HeyGen, Inc. https://github.com/heygen-com/hyperframes
Ideas adapted and rewritten for Hojas Studio's canvas renderer (no files copied): velocity-matched seam transitions, motion rules, oversized cursor, caption grouping and QA rules, story structures and card-count formula, beat analysis approach, voice EQ presets, color-grade presets.
License text: `LICENSES/Apache-2.0.txt`.

## lemo-opuscar, MIT License
Copyright (c) 2026 LemoLab. https://github.com/lemomo-ai/lemo-opuscar
The film-style catalog in engine/references/looks.md is summarized from its style list, and several Hojas "looks" are inspired by its styles.
License text: `LICENSES/MIT-lemo-opuscar.txt`.

## gbro-collage-broll, MIT License
Copyright (c) 2026 pyang5166. https://github.com/pyang5166/gbro-collage-broll
The paper-collage look, its color meanings and the metaphor, still, animate approval idea inspired Hojas's `collage` layer, which is rendered locally without any API.
License text: `LICENSES/MIT-gbro-collage-broll.txt`.

## onetake, ideas only
https://github.com/feitangyuan/onetake is licensed PolyForm Noncommercial 1.0.0. **No code, text or presets from onetake are included in Hojas Studio.** General ideas (carry elements across beats instead of replacing them, rhythm and rest checks) were described in our own words and implemented from scratch.

## MediaPipe, Apache License 2.0
engine/vision contains MediaPipe Tasks Vision and two models (face detection, selfie segmentation). Copyright Google LLC. https://github.com/google-ai-edge/mediapipe
License text: `LICENSES/Apache-2.0.txt`.

## qr.js, MIT License
Copyright (c) 2009 Kazuhiko Arase. The license notice is at the top of `qr.js`.

## Images
engine/scripts/collage-assets: public domain images from Wikimedia Commons (sources in `collage-assets/LICENSES.md`).

## Not bundled, downloaded on the user's machine
- Sound library (`sfxlib.json`): links to Mixkit sound effects, downloaded from mixkit.co when first used, under the Mixkit Free License. The sound files are not included in this package.
- Fonts in the studio and captions: loaded from Google Fonts (SIL Open Font License) when online.
- Images and clips from `hs media`: fetched from Wikimedia Commons with their license recorded in the project's `credits.txt`.

## Interface font
The public package does not include a custom interface font. The studio uses IBM Plex Sans Arabic (SIL OFL 1.1). To use your own font, put it at `fonts/nt-panorama-naskh-long.otf` (any Arabic OTF file with that name) and make sure you have the right to use it.
GUIDE.html embeds IBM Plex Sans Arabic, IBM Plex Mono and Noto Naskh Arabic (SIL Open Font License 1.1).
