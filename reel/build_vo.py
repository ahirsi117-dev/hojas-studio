"""Generate the voiceover locally with espeak-ng, one WAV per script line.

Each line is rendered on its own so its exact start and length are known,
which lets every shot in render.py be timed to its line.
Writes vo/line_NN.wav and vo/timing.json.
"""
import json
import subprocess
import wave
from pathlib import Path

HERE = Path(__file__).resolve().parent
VO_DIR = HERE / "vo"
VO_DIR.mkdir(exist_ok=True)

# Voiceover lines, copied from section 2 of script.md.
LINES = [
    "Footballers run WAY further than you think.",
    "So how far does ONE player actually run in a match?",
    "For a typical pro, it's about nine to eleven kilometres.",
    "That's like running around the whole pitch almost thirty times.",
    "Every. Single. Game.",
    "Centre-backs run the least. Midfielders run the most.",
    "But guess how far the hardest-working player ran in ONE World Cup match?",
    "Fifteen point one kilometres! Youri Tielemans, Belgium versus Senegal.",
    "And over the whole tournament, Spain's Rodri piled up ninety kilometres.",
    "That's more than TWO marathons!",
    "So who ran the LEAST?",
    "Lionel Messi. Eight point one per ninety, dead last of six hundred and eighteen outfield players after the group stage.",
    "But when he DOES move, it's at exactly the right moment.",
    "And the fastest burst? Nicolas Tagliafico. Thirty-six point two kilometres an hour!",
    "But how far does a GOALKEEPER run? That's next.",
    "Follow along!",
]

# Silence after each line, so the reel has room to breathe between shots.
TAIL_SECONDS = 0.4
SAMPLE_RATE = 44100


def wav_duration(path: Path) -> float:
    with wave.open(str(path), "rb") as w:
        return w.getnframes() / w.getframerate()


def main() -> None:
    timing = []
    for i, text in enumerate(LINES, start=1):
        raw = VO_DIR / f"raw_{i:02d}.wav"
        out = VO_DIR / f"line_{i:02d}.wav"
        # espeak-ng: en-us male voice, slightly brisk and lifted for an explainer read.
        subprocess.run(
            ["espeak-ng", "-v", "en-us+m3", "-s", "190", "-p", "52", "-a", "170",
             "-w", str(raw), text],
            check=True,
        )
        # Resample to 44.1 kHz mono, then append the tail silence.
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
             "-af", f"apad=pad_dur={TAIL_SECONDS}",
             "-ar", str(SAMPLE_RATE), "-ac", "1", str(out)],
            check=True,
        )
        raw.unlink()
        speech = wav_duration(out) - TAIL_SECONDS
        timing.append({"line": i, "text": text, "speech_seconds": round(speech, 3),
                       "slot_seconds": round(wav_duration(out), 3)})
        print(f"line {i:02d}: {speech:5.2f}s speech  |  {text}")

    (VO_DIR / "timing.json").write_text(json.dumps(timing, indent=2, ensure_ascii=False))
    total = sum(t["slot_seconds"] for t in timing)
    print(f"total slot time: {total:.2f}s")


if __name__ == "__main__":
    main()
