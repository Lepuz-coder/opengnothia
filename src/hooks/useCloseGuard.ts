import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppStore } from "@/stores/useAppStore";
import { useTranslation } from "@/i18n";

export function useCloseGuard() {
  const isNoteTaking = useAppStore((s) => s.isNoteTaking);
  const sessionNotesPreparing = useAppStore((s) => s.sessionNoteTakingStartedAt !== null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!isNoteTaking && !sessionNotesPreparing) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = t.closeGuard.noteTakingConfirm;
      return e.returnValue;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    let unlisten: (() => void) | undefined;

    getCurrentWindow()
      .onCloseRequested(async (event) => {
        event.preventDefault();
        window.alert(t.closeGuard.noteTakingBlock);
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      unlisten?.();
    };
  }, [isNoteTaking, sessionNotesPreparing, t]);
}
