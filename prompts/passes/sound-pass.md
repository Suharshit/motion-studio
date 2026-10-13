# Sound pass — score it to the beat

Sound is where "AI video" starts feeling like a film. Two paths:

**A track is supplied** (client-owned/licensed): measure it — `npm run beats -- projects/<slug>/audio/track.wav` — and cut picture to the grid. Never edit the track unless asked.
**No track:** synthesize it on the same timeline as the picture — `npm run music -- <slug> --mood drive|bright|cinematic|lofi|minimal|piano --bpm N --bars N --key A --seed N`. Different seeds = different melodies; the grid is exact.

SFX: write `cues.json` (`[{t, type, gain, pan}]`) from the shot list, then `npm run sfx -- <slug>`. Types: click tick pop type success error whoosh swipe riser impact shimmer thump kick snare clap hat openhat.
- Clicks/pops on measured `hits`, whooshes start ~0.1s before a cut, risers end exactly on the downbeat.
- Less is more: one sound per visual event, not per element.

Mix: `npm run mix -- <slug>` — VO placed by timing, music side-chain ducked under VO, master to -14 LUFS / -1 dBTP. Check `qa_audio_<fmt>.txt`.
