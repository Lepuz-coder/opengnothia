# Mobil: seans başlangıcında mod seçimi + yazılı modda dikte mikrofonu

## Context

Desktop'ta seans akışı iki parçalı: **(1)** "Seans Başlat" modalında yazılı/sesli mod seçilir
(`apps/desktop/src/pages/SessionPage.tsx:1014-1080`), **(2)** yazılı seansta input'un yanındaki
mikrofon **dikte** yapar — kaydı transkript edip taslağa ekler, mesajı göndermez
(`SessionPage.tsx:695-738` + `apps/desktop/src/components/chat/ChatInput.tsx:196-217`).

Mobilde bugün ikisi de yok:
- `apps/mobile/app/(tabs)/session.tsx` "Seans Başlat"a basınca doğrudan seansı açıyor; mod
  `SessionModal.tsx:100`'de lokal state ve **her seans "chat" başlıyor**. Sesli mod ancak seans
  içinde mikrofona basılarak açılabiliyor — yani sesli seans "başlatılamıyor", ortasından giriliyor.
- Aynı mikrofon dikte değil, **sesli moda geçiş** düğmesi (`ChatInput.tsx:82-92` → `enterVoiceMode`).

Hedef: desktop'la aynı mantık. Mod seansın başında seçilir ve tercih hatırlanır; yazılı seansta
mikrofon dikte eder; sesliden yazılıya geçiş tek yönlü kalır (desktop'ta da öyle).

**Kullanıcı kararları (2026-08-22):** (a) tam desktop paritesi — yazılıdan sesliye geçiş kalkar;
(b) başlangıç sheet'i **yalnız mod seçimi** içerir, terapi ekolü satırı yok; (c) onboarding tanışma
görüşmesi de dikte mikrofonunu alır.

**Yeniden kullanılan altyapı (Faz 8'den, yeniden yazılmayacak):** `useVoiceRecorder`
(expo-audio, mono 64 kbps .m4a, metering, izin akışı), `client.transcribe()` (Worker
`/v1/audio/transcriptions`), `useAIErrorHandler`, `Sheet`/`Button`/`Card` primitifleri.
`voice.*` ve `transcript.*` i18n anahtarlarının **tamamı 8 dilde zaten var** — yeni metin gerekmez.
Yeni native bağımlılık yok → **rebuild gerekmiyor**, Metro reload yeter.

---

## Adım 1 — `src/features/voice/voiceRuntime.ts` (YENİ)

`useVoiceConversation.ts` içindeki modül-private yardımcıları ortak katmana taşı (dikte de kullanacak):

- `deleteQuietly(file)` — `useVoiceConversation.ts:49-56`'dan taşı.
- `trackVoiceUsage(callType: "stt" | "tts")` — `useVoiceConversation.ts:90-107`'den taşı, gövde aynı.
  `useSessionStore.getState().sessionId` okuduğu için onboarding'de doğal olarak `session_id: null`
  yazar (Faz 7'nin `intake_interview` deseni) — ek parametre gerekmez.
- `setRecordingAudioMode()` / `resetAudioMode()` — `configureAudioSession`'ın iki dalının birebir
  aynısı (`{playsInSilentMode:true, allowsRecording:true, interruptionMode:"doNotMix",
  shouldRouteThroughEarpiece:false}` ve `{playsInSilentMode:false, allowsRecording:false,
  interruptionMode:"mixWithOthers"}`), try/catch + `console.error`.

Ardından `useVoiceConversation.ts`: iki tanımı sil, `./voiceRuntime`'dan import et;
`configureAudioSession(voiceActive)` gövdesini `voiceActive ? setRecordingAudioMode() : resetAudioMode()`
haline getir. Davranış değişmez → bu adım tek başına `tsc` ile doğrulanabilir.

> **Neden şart:** expo-audio iOS'ta `allowsRecording` bayrağı kapalıyken `record()` fırlatıyor;
> `useVoiceRecorder.startRecording()` bunu yutup `false` döndürür ve **izin reddi gibi görünür**.
> Yazılı modda bugün `setAudioModeAsync` hiç çağrılmıyor, dikte bu yüzden kendi profilini kurmalı.
> `playsInSilentMode:false` + `allowsRecording:true` kombinasyonu da exception fırlatır — ikisi birlikte.

## Adım 2 — `src/features/voice/useDictation.ts` (YENİ)

`useDictation({ onText, onAIError })` → `{ state, audioLevel, durationSeconds, start, stop }`,
`state: "idle" | "recording" | "transcribing"` (desktop'ın `RecordingState`'i).
İçeride `useVoiceRecorder()`; `audioLevel`/`durationSeconds` doğrudan ondan geçer.

- `start()`: `await setRecordingAudioMode()` → `startRecording()`. `false` dönerse
  `resetAudioMode()` + `showToast(t.transcript.microphoneError, "error")`, state `idle` kalır.
- `stop()`:
  1. `recording = await stopRecording()` → `setState("transcribing")` → `void resetAudioMode()`
     (**sıra önemli**: `allowsRecording:false` aktif recorder'ı durdurur, o yüzden `stop`'tan sonra)
  2. `transcribe(recording, getCurrentLanguage())` → `void trackVoiceUsage("stt")`
  3. metin doluysa `onText(text)`; boşsa `showToast(t.transcript.emptyTranscription, "info")`
  4. `catch` → **yalnız** `onAIError(err)` (403 → paywall; diğerleri zaten toast üretir — çift toast
     basma. `t.transcript.transcriptionError` metni "API anahtarını kontrol et" dediği için mobilde
     kullanılmaz; mobilde kullanıcı anahtarı yok)
  5. `finally` → `deleteQuietly(recording)` + `setState("idle")`
- Unmount cleanup: kayıt sürüyorsa `cancelRecording()` + `resetAudioMode()`.
- `useVoiceRecorder`'ın modül seviyesi `globalStarting` kilidi, sesli döngü recorder'ıyla yarışı
  zaten engelliyor — ek kilit gerekmez.

## Adım 3 — `src/features/voice/RecordingWave.tsx` (YENİ)

Desktop `ChatInput.tsx:19-81`'in Reanimated 4.5.1 portu. Sabitler birebir: `BAR_COUNT=24`,
`MIN_HEIGHT=6`, `MAX_HEIGHT=32`, `LEVEL_SCALE=8`.

- `target` shared value ← `Math.min(Math.sqrt(audioLevel * 8), 1)`.
- `useFrameCallback` (worklet) ile desktop'ın RAF interpolasyonu: `speed = target > level ? 18 : 8`,
  `level += (target - level) * min(speed*dt, 1)`.
- Bar başına ayrı `<WaveBar index level time />` bileşeni (hook döngüde çağrılamaz), tek
  `useAnimatedStyle`: `w1 = sin(t*0.005 + i*0.6)*0.35`, `w2 = sin(t*0.008 + i*1.2)*0.15`,
  `bar = clamp(level + (w1+w2)*level, 0, 1)`.
- **Yükseklik yerine `scaleY`**: sabit `height: MAX_HEIGHT`, `transform:[{scaleY: (MIN + bar*(MAX-MIN))/MAX}]`
  — 24 view için her karede layout pass yerine yalnız transform.
- `useReducedMotion()` true ise frame callback autostart kapalı, `level` sadece
  `withTiming(target, {duration:120})` izler, sinüs terimi 0 (`MiniOrb.tsx`'in `ReduceMotion.System`
  politikasıyla aynı çizgi). Bar rengi `#F87171` (Toast'ın hata kırmızısı).

## Adım 4 — `src/features/session/StartSessionSheet.tsx` (YENİ)

Mevcut `Sheet` primitive'i (`src/ui/Sheet.tsx`). Props: `{ visible, initialMode, onClose, onStart(mode) }`;
seçim state'i sheet içinde, `visible` değişiminde `initialMode`'a resetlenir.

- Başlık `t.session.startSessionModal`; altında `t.voice.modeSelection` +
  `t.voice.modeSelectionDescription`.
- **Alt alta iki kart** (desktop 2 sütun grid kullanıyor; açıklama metinleri 375pt'de iki sütuna
  sığmaz). Desen: `src/features/breathing/BreathingSetup.tsx:47-66` — `Pressable` +
  `accessibilityRole="radio"` + `accessibilityState={{selected}}` + `<Card className={cn(selected &&
  "border-primary-500 bg-primary-500/10")}>`. Sağ üstte 18px radio göstergesi (seçiliyse
  `border-primary-500` + 8px dolu nokta).
  - Yazılı: `MessageSquare`, `t.voice.chatConversation` / `t.voice.chatDescription`
  - Sesli: `Mic`, `t.voice.voiceConversation` / `t.voice.voiceDescription`
- Alt: `<Button size="lg" className="w-full">{t.session.startSession}</Button>`.
  Desktop'ın `testApiKey` / `testTranscriptApiKey` doğrulama zinciri mobilde **yok** (proxy modeli,
  BYOK değil) — buton anında başlatır.

## Adım 5 — Store'lar

`src/stores/useSessionStore.ts`: `sessionMode: SessionMode` + `setSessionMode` (tip
`packages/shared/src/types/index.ts:11`'den). Başlangıç `"chat"`; `startSession()` **dokunmaz**
(çağrıdan hemen önce yazılır); `reset()` `"chat"`e döndürür — bayat "voice" sonraki seansa sızmasın.
Desktop `apps/desktop/src/stores/useSessionStore.ts:26,102,167` ile aynı şekil.

`src/stores/useSettingsStore.ts`: `preferredSessionMode: SessionMode` (varsayılan `"chat"`) +
`setPreferredSessionMode`; `PersistedSettingsState` Pick listesine ve `partialize` objesine ekle.
**`version` bump gerekmez** — persist'in shallow merge'ü eksik anahtarı varsayılana düşürür,
mevcut v0→v1 `migrate` dokunulmaz.

## Adım 6 — `src/features/session/SessionModal.tsx`

- Lokal `mode` state'ini **`useSessionStore.sessionMode`** ile değiştir; `sessionId` selector'ı ekle;
  `autoStartedRef = useRef<string | null>(null)`.
- `enterVoiceMode`'u `useCallback`'e çevir ve snapshot'ı `null` yerine **`""`** yap:
  ```ts
  const streamedSoFar = s.isStreaming ? (s.messages.find(m => m.id === s.streamingMessageId)?.content ?? "") : "";
  ```
  > **Neden:** `startLoop` (`useVoiceConversation.ts:308-324`) `typeof === "string"` ise
  > `waiting_for_ai`'ya, değilse `beginListening()`'e gidiyor. Seans başlangıcında effect,
  > `streamGreeting` `startStreaming()` demeden önce koşabilir → bugünkü `null` mikrofonu
  > selamlamadan önce açar ve kullanıcının ilk sözü sessizce çöpe gider. `""` ile döngü
  > "Düşünüyor…"da bekler, selamlama gelince konuşur, sonra dinlemeye düşer.
- Otomatik başlatma effect'i:
  ```ts
  useEffect(() => {
    if (status !== "active" || sessionMode !== "voice" || sessionId === null) return;
    if (autoStartedRef.current === sessionId) return;   // aynı seansta bir kez
    autoStartedRef.current = sessionId;
    enterVoiceMode();
  }, [status, sessionMode, sessionId, enterVoiceMode]);
  ```
  Yarış zaten kapalı: `getState()` → `setVoiceSink` → `startLoop` üçlüsü senkron, chunk teslimi
  yalnız async callback'lerde — arada chunk sızamaz.
- `setVoiceSink({ feed, flush, fail: () => voiceLoopRef.current?.pauseLoop() })`.
- `<ChatInput>`: `onVoicePress` **çıkar**, `onAIError={handleAIError}` **girer**.
- `exitVoiceMode` aynen kalır (tek yönlü sesli→yazılı); `autoStartedRef` sayesinde çıkıştan sonra
  effect yeniden tetiklenmez.

## Adım 7 — `src/features/session/sessionActions.ts`

`VoiceStreamSink`'e `fail?: () => void` ekle; `streamAssistantTurn`'ün `onError`'ında (satır 160-168)
ve `streamGreeting`'in catch'inde `voiceSink?.fail?.()` çağır.

> **Neden gerekli:** `streamGreeting` `session.tsx`'in `handleAIError`'ıyla çağrılıyor,
> `SessionModal`'ın voice-aware handler'ından geçmiyor. Selamlama isteği patlarsa döngü
> `waiting_for_ai`'da asılı kalır. Sohbet turunda `onVoiceAwareAIError` zaten `pauseLoop` yapıyor;
> `fail` ikinci kez çağırsa da `pauseLoop` idempotent.

## Adım 8 — `src/features/session/ChatInput.tsx`

- Props: `onVoicePress` **çıkar**, `onAIError: (error: unknown) => void` **girer** (mikrofon artık
  her iki yüzeyde de var → zorunlu). `pr-[88px]`/`pr-[52px]` koşulu sabit `pr-[88px]` olur.
- `useDictation({ onText: text => setDraft(prev => prev + (prev.trim() ? " " : "") + text), onAIError })`
  — ekleme kuralı desktop `insertText` (`ChatInput.tsx:107-115`) ile birebir. Mobilde draft zaten
  bileşen içinde olduğundan desktop'ın imperative `ref` handle'ına gerek yok.
- Render dallanması:
  - **`recording`**: pill'in içi tamamen değişir — sol: kırmızı `Mic` + nabız atan nokta
    (`withRepeat(..., ReduceMotion.System)`); orta: `<RecordingWave audioLevel={...} />` +
    `t.transcript.recordingAudio`; sağ: `formatClock(Math.floor(durationSeconds))`
    (`@/lib/duration` — desktop kendi sayacını tutuyor, mobilde gerçek kayıt süresi var) + 32pt
    kırmızı yuvarlak durdurma butonu (`Square`), `accessibilityLabel={t.transcript.recording}`.
  - **`transcribing` / `idle`**: bugünkü TextInput + buton satırı; mikrofon `transcribing` iken
    `<ActivityIndicator>` gösterir ve disabled olur. Disabled semantiği desktop'la aynı:
    `disabled={disabled || state === "transcribing"}`.
- Kayıtta TextInput unmount olduğu için gönder erişilemez (desktop'ta da öyle). Kayıt bitip metin
  eklendikten sonra `ref` + `requestAnimationFrame(() => inputRef.current?.focus())` ile odağı geri ver.
- Kayıt sırasındaki kırmızı kenarlık/gölge `src/theme/sessionAmbience.ts`'teki `GlassPalette`'e
  `pillBorderRecording` + `pillShadowRecording` olarak eklenir (light/dark ayrı) — dosyanın açık
  amacı bu literalleri tek yerde tutmak.

## Adım 9 — `app/(tabs)/session.tsx`

- `const [modeSheetOpen, setModeSheetOpen] = useState(false)`.
- `openModeSheet()`: `noteTakingStartedAt !== null` ise `showToast(t.session.noteTakingStartBlocked, "info")`,
  değilse `setModeSheetOpen(true)`.
- `handleStartPress = () => gate(openModeSheet)` — **gate sheet'ten önce** (abone olmayana mod
  seçtirme). `?start=` deep-link effect'i de `openModeSheet()` çağırır (hero'da gate zaten uygulanmış).
- `handleModeStart(mode)`:
  1. `setModeSheetOpen(false)`
  2. `setPreferredSessionMode(mode)` (tercih persist)
  3. `useSessionStore.getState().setSessionMode(mode)` — **`startSessionInDb`'den önce**, ki status
     `active` olduğu commit'te effect doğru değeri görsün
  4. `setTimeout(() => void beginStartFlow(), SHEET_DISMISS_MS)` — iki RN Modal üst üste binmemeli;
     dosyada `IntakeFormSheet.onSaved`'de aynı gerekçeyle 350 ms var, sabiti tek yere al.
- `beginStartFlow` gövdesi **aynı kalır** (intake nudge dahil) — mod zaten seçilmiş olur.
- `<StartSessionSheet visible={modeSheetOpen} initialMode={preferredSessionMode} ... />`.

## Adım 10 — `app/(onboarding)/interview.tsx`

`<ChatInput disabled={isStreaming} onSend={send} onAIError={handleAIError} />` — `handleAIError`
dosyada zaten var (satır 28, `modalHosted` **olmadan**; bu ekran modal içinde değil, 403 `/paywall`
route'una gider — doğru davranış). Başka değişiklik yok.

---

## Sıralama

1. Adım 1 (voiceRuntime + refactor) → `tsc`; davranış değişmediği için sıfır regresyon riski
2. Adım 5 (store'lar)
3. Adım 4 + 9 (StartSessionSheet + session.tsx) → **mod seçimi tamam**; sesli moda hâlâ ChatInput
   mikrofonundan da girilebiliyor, uygulama her adımda çalışır durumda
4. Adım 6 + 7 (SessionModal auto-start + sink `fail`) → sesli seans **başlangıçtan** çalışır
5. Adım 3 + 2 + 8 + 10 (RecordingWave, useDictation, ChatInput, interview) → **dikte tamam**;
   `onVoicePress` bu adımda silinir

## Riskler

- **`allowsRecording`**: en olası hata kaynağı. Unutulursa dikte "mikrofon izni reddedildi" gibi
  görünür — simülatör log'unda `RecordingDisabledException` ara.
- **Ses profili sızıntısı**: `resetAudioMode()` her yolda (hata, boş transkript, unmount) çalışmalı
  → `finally` şart. Sızarsa meditasyon zilleri ve TTS ses yolu bozulur.
- **İki `useVoiceRecorder` örneği** aynı anda mount (sesli döngü + dikte): modlar karşılıklı
  dışlayıcı ve `globalStarting` kilidi var → kabul edilebilir.
- **Çift Modal**: mod sheet → seans modal geçişi gecikmesiz yapılırsa iOS'ta siyah ekran (dosyadaki
  mevcut yorumların anlattığı hata).
- **24 bar × her kare `useAnimatedStyle`**: eski cihazda ölç; sorun çıkarsa `BAR_COUNT` 16'ya inebilir.

## Doğrulama

Bu projede simülatör MCP'si `xcode-select` yanlış alarmı veriyor, dokunuş sentezi yapılamıyor →
önceki fazların **deep-link sürücü deseni** kullanılır (geçici `?mode=`/`autostart=`/`dictate=`
parametreleri + gerekirse AsyncStorage tohumlama), sürücü **commit'ten önce tamamen silinir** ve
temiz boot ile doğrulanır.

1. `pnpm --filter @opengnothia/mobile exec tsc --noEmit` + desktop için aynısı (proje kuralı).
2. **Mod seçimi**: Seans Başlat → sheet'in iki kartı + radio göstergesi. "Yazılı" → bugünkü
   davranış aynen. "Sesli" → modal açılır açılmaz orb `waiting_for_ai` ("Düşünüyor…"), **mikrofon
   açılmaz**, selamlama seslenir, sonra `listening`. `xcrun simctl spawn … log stream` ile
   AVAudioSession kategorisinin `PlayAndRecord`'a ancak dinlemede geçtiğini doğrula.
   Uygulamayı kapat/aç → `preferredSessionMode` hatırlanıyor mu.
3. **Dikte (canlı Worker)**: yazılı seansta mikrofona bas → kırmızı bar + dalga + sayaç; konuş,
   durdur → spinner → metin taslağa **eklendi**, mesaj **gönderilmedi**; taslakta yazı varken ikinci
   dikte → araya tek boşluk. Sonra gönder → normal tur. `token_usage`'da `call_type="stt"`,
   `session_id` dolu satır.
4. **Onboarding**: tanışma görüşmesinde aynı dikte turu; `token_usage` satırında `session_id` **null**.
5. **Hata yolları**: mikrofon iznini kapat → `transcript.microphoneError` toast'ı (seans modalı
   içinde de görünüyor mu); sessiz kayıt → `transcript.emptyTranscription`; uçak modu → tek toast
   (çift **olmamalı**); abonesiz hesapta 403 → paywall overlay (route değil).
6. **Regresyon**: sesli→yazılı `exitVoiceMode` çalışıyor; yazılı→sesli geçiş **artık yok**; seans
   bitirme + end-marker prompt'u + meditasyon zilleri dikteden sonra normal.
7. Bitince `docs/plans/mobile-app.html`'e yeni faz notu (mevcut "Sonuç (tarih, commit)" deseniyle).
