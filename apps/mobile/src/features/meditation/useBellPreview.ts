import { useCallback, useEffect, useRef, useState } from "react";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { bellPreviewSource } from "./bells";
import { BELL_PACK_IDS, type BellPackId } from "./constants";

export interface BellPreview {
  /** The pack sounding right now, or null. */
  playing: BellPackId | null;
  /** Sound a pack's opening bell — or silence it, if that is the one already ringing. */
  toggle: (pack: BellPackId) => void;
  /** Cut the preview short, for when something louder is about to start. */
  stop: () => void;
}

/**
 * Lets the setup screen ring a bell pack so the choice is made by ear.
 *
 * Deliberately separate from BellSession: that one owns a whole sitting — four
 * players, a keep-alive loop and a background-capable audio session. A preview
 * is one strike on a screen the user is looking at, and holding a sitting's
 * worth of machinery open for it would keep the audio session claimed the whole
 * time the tab is on screen.
 *
 * Both players are built on mount rather than on the first tap. A player
 * constructed at the moment it should sound has to load first, and a bell that
 * arrives late reads as a broken button — the same reason BellSession builds its
 * players in the constructor.
 */
export function useBellPreview(): BellPreview {
  const [playing, setPlaying] = useState<BellPackId | null>(null);
  const players = useRef<Partial<Record<BellPackId, AudioPlayer>>>({});
  // Taps can outrun the audio session: whoever tapped last wins, so a chain
  // that lost the race does not play over the pack the user actually chose.
  const request = useRef(0);

  useEffect(() => {
    const built: Partial<Record<BellPackId, AudioPlayer>> = {};
    const subscriptions = BELL_PACK_IDS.map((pack) => {
      const player = createAudioPlayer(bellPreviewSource(pack));
      built[pack] = player;
      // A bell left to ring out has to put its own button back; nothing else
      // tells the screen it stopped.
      return player.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) setPlaying((current) => (current === pack ? null : current));
      });
    });
    players.current = built;

    return () => {
      request.current += 1;
      subscriptions.forEach((subscription) => subscription.remove());
      for (const pack of BELL_PACK_IDS) {
        try {
          built[pack]?.remove();
        } catch {
          // Releasing an already-finished player can no-op
        }
      }
      players.current = {};
      // Hand the silent switch back, as BellSession.release does.
      void setAudioModeAsync({
        playsInSilentMode: false,
        shouldPlayInBackground: false,
        interruptionMode: "mixWithOthers",
      }).catch(() => undefined);
    };
  }, []);

  const stop = useCallback(() => {
    request.current += 1;
    for (const pack of BELL_PACK_IDS) {
      try {
        players.current[pack]?.pause();
      } catch {
        // Pausing a released player can no-op
      }
    }
    setPlaying(null);
  }, []);

  const toggle = useCallback(
    (pack: BellPackId) => {
      const player = players.current[pack];
      if (!player) return;
      const wasPlaying = playing === pack;
      // Silence whatever is ringing first — including this pack, so a second tap
      // on the same chip stops a bell instead of making it wait out its decay.
      stop();
      if (wasPlaying) return;

      const token = (request.current += 1);
      setPlaying(pack);
      void (async () => {
        try {
          // The real bell ignores the ringer switch, so a preview that honours
          // it would be a preview of the wrong thing — silence, on a silenced
          // phone, right where the user is trying to hear the difference.
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: false,
            interruptionMode: "mixWithOthers",
          });
          // seekTo is async and play() is not — see BellSession.ring.
          await player.seekTo(0);
          if (request.current !== token) return;
          player.play();
        } catch (err) {
          console.error("Meditation bell preview failed:", err);
          setPlaying((current) => (current === pack ? null : current));
        }
      })();
    },
    [playing, stop]
  );

  return { playing, toggle, stop };
}
