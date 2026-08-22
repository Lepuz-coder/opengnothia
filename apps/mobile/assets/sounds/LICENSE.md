# Bundled meditation bell sounds

Every `.mp3` here comes from **BigSoundBank** (https://bigsoundbank.com), recorded by
Joseph SARDIN and released under **CC0 / public domain**: free for commercial and
non-commercial use worldwide, no attribution required, no permission needed.
License terms: https://bigsoundbank.com/licenses.html

| File | Original sound | Source | Duration |
| --- | --- | --- | --- |
| `bowl-start.mp3` | Tibetan bowl struck #2 | https://bigsoundbank.com/sound-2553-bol-tibetain-frappe-2.html | 13.3s |
| `bowl-interval.mp3` | Tibetan bowl struck #3 | https://bigsoundbank.com/sound-2554-bol-tibetain-frappe-3.html | 9.1s |
| `bowl-end.mp3` | Tibetan bowl struck #1 | https://bigsoundbank.com/detail-1110-tibetan-bowl-struck.html | 30.0s |
| `gong-soft.mp3` | Gong, sweet | https://bigsoundbank.com/gong-sweet-s1482.html | 12.8s |
| `gong-strong.mp3` | Gong, strong #1 | https://bigsoundbank.com/gong-strong-1-s1483.html | 14.8s |

`silence.wav` is not a download — it is generated locally (2s, 22.05 kHz mono, a 40 Hz sine
at 2 LSB ≈ -84 dBFS). It loops for the whole meditation session so iOS keeps the audio
session — and therefore the JS timers — alive while the app is backgrounded or the screen is
locked. Digital silence is avoided deliberately; some iOS versions treat an all-zero buffer as
"nothing playing". See `src/features/meditation/bells.ts`.
