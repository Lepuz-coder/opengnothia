import { useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppStore } from "@/stores/useAppStore";

export function useCloseGuard() {
  const isNoteTaking = useAppStore((s) => s.isNoteTaking);

  useEffect(() => {
    if (!isNoteTaking) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "Şu anda not alınıyor. Uygulamayı kapatmak istediğinize emin misiniz?";
      return e.returnValue;
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    let unlisten: (() => void) | undefined;

    getCurrentWindow()
      .onCloseRequested(async (event) => {
        event.preventDefault();
        window.alert(
          "Şu anda not alınıyor. Notlar tamamlanmadan uygulama kapatılamaz."
        );
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      unlisten?.();
    };
  }, [isNoteTaking]);
}
