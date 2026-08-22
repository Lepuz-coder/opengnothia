import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import type { BellPackId, BellRole } from "./constants";

/**
 * Audio for the meditation timer: the bells themselves, and the trick that keeps
 * them ringing when the phone is in a pocket.
 *
 * Sources are require()'d so Metro resolves and bundles them at build time —
 * unlike the voice feature, which plays a temp file URI written at runtime.
 * All five bells are CC0; see assets/sounds/LICENSE.md.
 */
const PACKS: Record<BellPackId, Record<BellRole, number>> = {
  bowl: {
    start: require("../../../assets/sounds/bowl-start.mp3"),
    interval: require("../../../assets/sounds/bowl-interval.mp3"),
    end: require("../../../assets/sounds/bowl-end.mp3"),
  },
  gong: {
    // One soft gong covers start and interval; the stronger one closes.
    start: require("../../../assets/sounds/gong-soft.mp3"),
    interval: require("../../../assets/sounds/gong-soft.mp3"),
    end: require("../../../assets/sounds/gong-strong.mp3"),
  },
};

const SILENCE = require("../../../assets/sounds/silence.wav");

/**
 * What the setup screen plays when someone taps a bell pack.
 *
 * The opening bell rather than the interval one: it is the pack's signature —
 * the fullest strike, and the sound the sitting actually starts on. (For the
 * gong pack the two are the same file anyway.)
 */
export function bellPreviewSource(pack: BellPackId): number {
  return PACKS[pack].start;
}

function removeQuietly(player: AudioPlayer | null) {
  try {
    player?.remove();
  } catch {
    // Releasing an already-finished player can no-op
  }
}

/**
 * Owns every player for one meditation session.
 *
 * iOS only keeps a backgrounded app alive while audio is actually playing, and
 * a meditation timer is silent between bells — so the audio session would idle,
 * the app would be suspended, JS timers would stop, and the next bell would
 * never fire. A looping near-silent track holds the session open for the whole
 * sitting. (assets/sounds/silence.wav is a 2s 40 Hz sine at ~-84 dBFS rather
 * than digital silence, which some iOS versions treat as "nothing playing".)
 *
 * One player per role, created up front: seekTo(0) + play() restarts a bell far
 * faster than constructing a player at the moment it should ring.
 */
export class BellSession {
  private bells: Partial<Record<BellRole, AudioPlayer>> = {};
  private keepAlive: AudioPlayer | null = null;
  private released = false;

  constructor(pack: BellPackId) {
    const sources = PACKS[pack];
    for (const role of ["start", "interval", "end"] as const) {
      this.bells[role] = createAudioPlayer(sources[role]);
    }
    this.keepAlive = createAudioPlayer(SILENCE);
    this.keepAlive.loop = true;
  }

  /**
   * Claim the audio session and start the keep-alive loop.
   *
   * playsInSilentMode: a bell nobody hears because the ringer switch is off is
   * the whole feature failing. mixWithOthers: meditators often run their own
   * ambience or music app underneath — the voice session's doNotMix would kill it.
   */
  async start(): Promise<void> {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: "mixWithOthers",
      });
    } catch (err) {
      console.error("Meditation audio session config failed:", err);
    }
    try {
      this.keepAlive?.play();
    } catch (err) {
      console.error("Meditation keep-alive playback failed:", err);
    }
  }

  ring(role: BellRole): void {
    if (this.released) return;
    const player = this.bells[role];
    if (!player) return;
    // A player that already rang is parked at the end of its sample, so it has
    // to be rewound before it will sound again. seekTo is async and play() is
    // not: calling them in sequence resumes from the end instead, the player
    // stops itself within a frame, and the bell is silent. One player serves
    // every interval bell of a sitting, so this is every interval bell after
    // the first.
    void player
      .seekTo(0)
      .then(() => {
        if (!this.released) player.play();
      })
      .catch((err) => {
        console.error("Meditation bell playback failed:", err);
      });
  }

  /** Stop everything, release the players, hand the audio session back. */
  async release(): Promise<void> {
    if (this.released) return;
    this.released = true;

    removeQuietly(this.keepAlive);
    this.keepAlive = null;
    for (const role of ["start", "interval", "end"] as const) {
      removeQuietly(this.bells[role] ?? null);
    }
    this.bells = {};

    try {
      await setAudioModeAsync({
        playsInSilentMode: false,
        shouldPlayInBackground: false,
        interruptionMode: "mixWithOthers",
      });
    } catch (err) {
      console.error("Meditation audio session reset failed:", err);
    }
  }
}
