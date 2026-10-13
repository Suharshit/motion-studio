#!/usr/bin/env python3
"""Measure a supplied track so the picture can sit on its beat grid.

    npm run beats -- projects/<slug>/audio/track.wav            → projects/<slug>/beats.json
    python3 engine/beats.py song.wav --out projects/<slug>/beats.json

beats.json:
  bpm        float
  beats      [t, ...]   state changes / cuts go here
  downbeats  [t, ...]   big moments go here (every 4th beat, phase-corrected to the loudest)
  hits       [t, ...]   onset peaks — SFX and micro-accents go here
  sections   [t, ...]   rough structural boundaries (verse/chorus changes)
  duration   float
"""
import argparse, json, os, sys

import numpy as np
import librosa

ap = argparse.ArgumentParser()
ap.add_argument("audio")
ap.add_argument("--out")
a = ap.parse_args()

y, sr = librosa.load(a.audio, sr=None, mono=True)
dur = float(librosa.get_duration(y=y, sr=sr))
tempo, frames = librosa.beat.beat_track(y=y, sr=sr, units="frames")
beat_t = librosa.frames_to_time(frames, sr=sr)

onset = librosa.onset.onset_strength(y=y, sr=sr)
peaks = librosa.util.peak_pick(onset, pre_max=3, post_max=3, pre_avg=3, post_avg=5, delta=0.5, wait=10)

# Downbeat phase: pick the offset (0..3) whose beats carry the most onset energy.
strength = onset[np.clip(frames, 0, len(onset) - 1)] if len(frames) else np.array([])
phase = int(np.argmax([strength[i::4].sum() for i in range(4)])) if len(strength) >= 4 else 0

# Coarse sections from a recurrence-free novelty curve on chroma.
try:
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    bounds = librosa.segment.agglomerative(chroma, k=min(8, max(2, int(dur // 15))))
    sections = librosa.frames_to_time(bounds, sr=sr).round(3).tolist()
except Exception:
    sections = []

out = {
    "bpm": round(float(np.atleast_1d(tempo)[0]), 2),
    "beats": beat_t.round(3).tolist(),
    "downbeats": beat_t[phase::4].round(3).tolist(),
    "hits": librosa.frames_to_time(peaks, sr=sr).round(3).tolist(),
    "sections": sections,
    "duration": round(dur, 3),
    "source": os.path.basename(a.audio),
}

path = a.out
if not path:
    # default: next to the project's audio folder → projects/<slug>/beats.json
    d = os.path.dirname(os.path.abspath(a.audio))
    path = os.path.join(os.path.dirname(d) if os.path.basename(d) == "audio" else d, "beats.json")
with open(path, "w") as f:
    json.dump(out, f, indent=1)
print(f"bpm {out['bpm']} · {len(out['beats'])} beats · {len(out['hits'])} hits → {path}", file=sys.stderr)
