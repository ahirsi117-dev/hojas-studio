"""Generate the voiceover with Chatterbox TTS (runs on CPU here).

Writes the same files as build_vo.py: vo/line_NN.wav at 44.1 kHz mono
with a short tail of silence, plus vo/timing.json. render.py reads those
unchanged, so the reel can be rebuilt once this has run.
"""
import json
import subprocess
import wave
from pathlib import Path

import torch
import torchaudio
from chatterbox.tts import ChatterboxTTS

from build_vo import LINES, SAMPLE_RATE, TAIL_SECONDS, VO_DIR

WORK = VO_DIR.parent / "vo_chatterbox_raw"
WORK.mkdir(exist_ok=True)


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / w.getframerate()


def main() -> None:
    torch.manual_seed(7)
    model = ChatterboxTTS.from_pretrained(device="cpu")
    timing = []
    for i, text in enumerate(LINES, start=1):
        raw = WORK / f"raw_{i:02d}.wav"
        out = VO_DIR / f"line_{i:02d}.wav"
        wav = model.generate(text, exaggeration=0.55, cfg_weight=0.4)
        torchaudio.save(str(raw), wav.cpu(), model.sr)
        # Resample to 44.1 kHz mono and append the tail silence.
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
             "-af", f"apad=pad_dur={TAIL_SECONDS}",
             "-ar", str(SAMPLE_RATE), "-ac", "1", str(out)],
            check=True,
        )
        slot = wav_duration(out)
        speech = slot - TAIL_SECONDS
        timing.append({"line": i, "text": text, "speech_seconds": round(speech, 3),
                       "slot_seconds": round(slot, 3)})
        print(f"line {i:02d}: {speech:5.2f}s speech  |  {text}", flush=True)

    (VO_DIR / "timing.json").write_text(json.dumps(timing, indent=2, ensure_ascii=False))
    print(f"total slot time: {sum(t['slot_seconds'] for t in timing):.2f}s", flush=True)


if __name__ == "__main__":
    main()
