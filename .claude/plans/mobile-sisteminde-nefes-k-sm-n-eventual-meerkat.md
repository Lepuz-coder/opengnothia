# Mobil "Nefes" sekmesini "Meditasyon"a dönüştürme

## Context

Mobil uygulamanın 4. sekmesi bugün sadece nefes egzersizi sunuyor: `app/(tabs)/breathe.tsx` →
`BreathingSetup` (teknik + süre seçimi) → `BreathingExercise` (tam ekran Modal runner).
Sekme tek amaçlı; meditasyon pratiği için hiçbir şey yok.

Amaç: sekmeyi **"Meditasyon"** çatısına taşımak. Nefes egzersizleri aynen erişilebilir kalacak,
yanına **aralık zilli bir meditasyon zamanlayıcısı** eklenecek. Ziller için internetten CC0
(kamu malı) Tibet kâsesi / gong sesleri indirilip uygulamaya gömülecek.

### Kullanıcı kararları (bu oturumda onaylandı)

| Konu | Karar |
|---|---|
| Sekme yapısı | Üstte `SegmentedTabs`: **Meditasyon \| Nefes**. Varsayılan Meditasyon. |
| Timer özellikleri | Aralık zili + hazırlık süresi + arka plan/kilit ekranı desteği. **Serbest (açık uçlu) süre yok.** |
| Zil sesleri | BigSoundBank CC0 seti (Tibet kâsesi ×3 + gong ×2) |
| Ad değişikliği kapsamı | **Sadece mobil sekme.** Desktop'ın `/tools` → "Nefes Egzersizi" sayfası aynen kalır. 8 dilin hepsi çevrilir. |

### Keşifte çıkan iki kritik kolaylık

1. **`expo-audio` zaten kurulu ve `app.json` plugin listesinde.** Plugin'in `enableBackgroundPlayback`
   varsayılanı `true` olduğu için `UIBackgroundModes: ["audio"]` **zaten** `ios/OpenGnothia/Info.plist`
   içinde (satır ~72). → **Yeni native bağımlılık yok, `app.json` değişikliği yok, prebuild/rebuild yok.**
2. **Metro zaten `mp3` ve `wav` uzantılarını asset olarak paketliyor** (doğrulandı:
   `assetExts` içinde `aac, caf, m4a, mp3, wav`). → `metro.config.js` değişmiyor.

---

## Adım 1 — Ses varlıkları

Yeni klasör: `apps/mobile/assets/sounds/` (repoda bugün hiç ses/font yok, ilk olacak).

İndirilecekler — hepsi **CC0 / kamu malı**, hesapsız, atıfsız, ticari kullanıma açık
(kaynak: [bigsoundbank.com/licenses.html](https://bigsoundbank.com/licenses.html), kayıtlar: Joseph SARDIN):

| Dosya | Kaynak | Süre |
|---|---|---|
| `bowl-start.mp3` | `https://bigsoundbank.com/UPLOAD/mp3/2553.mp3` (Tibet kâsesi vuruş #2) | 14 sn |
| `bowl-interval.mp3` | `https://bigsoundbank.com/UPLOAD/mp3/2554.mp3` (vuruş #3) | 10 sn |
| `bowl-end.mp3` | `https://bigsoundbank.com/UPLOAD/mp3/1110.mp3` (vuruş #1) | 31 sn |
| `gong-soft.mp3` | `Gong, sweet` — detay sayfası `bigsoundbank.com/gong-sweet-s1482.html` | 13 sn |
| `gong-strong.mp3` | `Gong, strong #1` — `bigsoundbank.com/gong-strong-1-s1483.html` | 15 sn |

> Gong'ların doğrudan MP3 URL'i indirmeden önce detay sayfasından doğrulanacak (kalıp:
> `UPLOAD/mp3/<id>.mp3`). URL kalıbı tutmazsa aynı CC0 kaynaktan muadili alınır.

Ek olarak **yerelde üretilecek** (indirme yok): `silence.wav` — 2 sn, 22.05 kHz mono, genliği
1 LSB olan neredeyse-sessiz döngü dosyası. Python stdlib `wave` ile üretilir (`python3` ve
`wave` modülü mevcut, doğrulandı). ~90 KB. Gerekçesi Adım 5'te.

`apps/mobile/assets/sounds/LICENSE.md` yazılacak: her dosyanın kaynağı, orijinal adı, lisansı.

---

## Adım 2 — i18n (`packages/shared`)

`packages/shared/src/i18n/index.ts` içindeki `Translations` arayüzü + **8 dil dosyasının hepsi**
(`tr, en, zh, es, pt, de, fr, ja`). TypeScript zaten eksik anahtarda derlemeyi kırar.

1. **`nav.breathe` → `nav.meditation`.** `nav.breathe` tüm repoda **tek yerde** kullanılıyor
   (`apps/mobile/app/(tabs)/_layout.tsx:52`), mobil-özel kısa sekme etiketi. Anahtar yeniden
   adlandırılıp değeri TR'de `"Meditasyon"` olur. `nav.breathing` ("Nefes Egzersizi" — desktop
   sidebar) **dokunulmaz**.
2. Yeni `meditation` bloğu ekle. TR taslağı:

```ts
meditation: {
  title: "Meditasyon",
  description: "Süreni ve zil aralığını seçerek oturuma başla",
  tabTimer: "Meditasyon",
  tabBreathing: "Nefes",
  duration: "Süre",
  prepare: "Hazırlık",
  prepareNone: "Yok",
  intervalBell: "Aralık Zili",
  intervalNone: "Kapalı",
  bellSound: "Zil Sesi",
  bellBowl: "Tibet Kâsesi",
  bellGong: "Gong",
  keepAwake: "Ekranı açık tut",
  keepAwakeHint: "Kapalıyken ekran kilitlense de oturum ve ziller devam eder.",
  start: "Meditasyona Başla",
  getReady: "Hazırlan",
  finishEarly: "Bitir",
  complete: "Oturum tamamlandı",
  completedMinutes: "dakika meditasyon",
},
```

Süre/aralık **etiketleri veri olarak dile gömülmez** — mevcut `t.common.minutes` ("dakika") ve
`t.common.minutesShort` ("dk") ile üretilir. (Nefesteki `getDurationOptions()` deseni her dil için
ayrı liste tutuyor; meditasyonda buna gerek yok, sayı + birim yeterli.)

> Not: `breathing` bloğundaki `technique478/techniqueBox/technique426/techniqueSimple(+Desc)` ve
> `durationMinute` anahtarları **ölü** (hiçbir yer okumuyor; gerçek metin
> `i18n/breathingTechniques/*.ts`'den geliyor). Temizlik bu planın kapsamı dışında — ayrı iş.

---

## Adım 3 — Ayar kalıcılığı

`apps/mobile/src/stores/useSettingsStore.ts` — mevcut düz alan konvansiyonuna sadık kalınır
(iç içe nesne kullanılmaz: zustand v5'te seçicinin her render'da yeni nesne döndürmesi ve
persist'in sığ merge'ü ayrı iki tuzak). Beş yeni alan:

| Alan | Varsayılan |
|---|---|
| `meditationDuration` | `600` (10 dk, saniye) |
| `meditationPrep` | `10` (saniye) |
| `meditationInterval` | `0` (kapalı, saniye) |
| `meditationBell` | `"bowl"` |
| `meditationKeepAwake` | `true` |

Her biri için dosyadaki **dört yere** dokunulur: `SettingsState` arayüzü, `PersistedSettingsState`
`Pick<>` listesi, creator'daki başlangıç değeri + setter, `partialize` dönüşü.
Segment seçimi (Meditasyon/Nefes) kalıcı değil — ekranda `useState`, varsayılan Meditasyon.

---

## Adım 4 — Sabitler ve zil çizelgesi (saf mantık)

Yeni: `apps/mobile/src/features/meditation/constants.ts`

Meditasyon mobil-özel olduğu için sabitler `packages/shared`'a değil feature klasörüne konur
(`useSettingsStore.ts`'deki "M13: mobile keeps its own stores; only pure logic is shared" notuyla tutarlı).

```ts
export const MEDITATION_DURATIONS = [300, 600, 900, 1200, 1800, 2700, 3600]; // 5–60 dk
export const MEDITATION_PREPS     = [0, 10, 30];
export const MEDITATION_INTERVALS = [0, 60, 120, 300, 600, 900];             // 0 = kapalı

export type BellPackId = "bowl" | "gong";
export interface BellCue { at: number; role: "start" | "interval" | "end" }

/** Oturum başından itibaren geçen saniye cinsinden, sıralı zil noktaları. */
export function buildBellSchedule(
  totalSeconds: number, prepSeconds: number, intervalSeconds: number
): BellCue[]
```

`buildBellSchedule` kuralları:
- `{ at: prepSeconds, role: "start" }` — hazırlık bitince başlangıç zili (prep 0 ise t=0'da).
- `intervalSeconds > 0` ise `prepSeconds + k*interval`, **`prepSeconds + total`'a eşit veya büyük
  olanlar hariç** (bitiş zili ile çakışmasın).
- `{ at: prepSeconds + totalSeconds, role: "end" }`.

---

## Adım 5 — Ses katmanı

Yeni: `apps/mobile/src/features/meditation/bells.ts`

Paket eşlemesi (`require()` ile statik import — Metro derleme anında çözer):

```ts
const PACKS: Record<BellPackId, Record<BellCue["role"], number>> = {
  bowl: { start: require("../../../assets/sounds/bowl-start.mp3"), … },
  gong: { start: require("../../../assets/sounds/gong-soft.mp3"),
          interval: require("../../../assets/sounds/gong-soft.mp3"),
          end: require("../../../assets/sounds/gong-strong.mp3") },
};
```

`createAudioPlayer` deseni `src/features/voice/useVoiceConversation.ts:56-88`'den kopyalanır
(hook değil, imperatif player + `remove()` ile temizlik — zil çalma render döngüsünün dışında olmalı).
Aynı sesi tekrar çalmak için SDK 57 kuralı: `player.seekTo(0)` sonra `player.play()`.

**Arka plan / kilit ekranı — neden `silence.wav` gerekiyor:** iOS uygulamayı yalnızca
*aktif ses çalarken* canlı tutar. Ziller arasında sessizlik olduğu için AVAudioSession boşa düşer,
uygulama askıya alınır ve JS `setInterval` durur → sonraki zil hiç çalmaz. Çözüm: oturum boyunca
`silence.wav`'ı `loop = true` ile çalan ikinci bir player. Bu, ses oturumunu ayakta tutar; JS timer
çalışmaya devam eder. Oturum bitince player `remove()` edilir.

Ses modu oturum başında set edilir, bitişte geri alınır (`useVoiceConversation.ts:282-299` deseni):

```ts
// başlangıç
await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true,
                          interruptionMode: "mixWithOthers" });
// bitiş
await setAudioModeAsync({ playsInSilentMode: false, shouldPlayInBackground: false,
                          interruptionMode: "mixWithOthers" });
```

`mixWithOthers`: kullanıcı kendi ambiyans/müzik uygulamasını paralel çalabilsin.
`playsInSilentMode: true`: sessiz moddaki telefonda da zil duyulsun.

---

## Adım 6 — Timer hook

Yeni: `apps/mobile/src/features/meditation/useMeditationTimer.ts`

Saat kaynağı `BreathingExercise.tsx:83-95`'teki **duvar saati temelli** desenin aynısı
(`Date.now()` baseline + 250 ms `setInterval`) — sürüklenme yok, arka plandan dönüşte gerçek zamana
yetişir. Üstüne zil tetikleyici eklenir:

```ts
const nextCueRef = useRef(0);
// her tick'te:
while (nextCueRef.current < cues.length && elapsed >= cues[nextCueRef.current].at) {
  const cue = cues[nextCueRef.current++];
  if (elapsed - cue.at < 5) playBell(pack, cue.role);   // <-- gecikme koruması
}
```

`< 5` sn koruması kritik: ses oturumu bir şekilde ölür ve uygulama dakikalarca askıda kalırsa,
dönüşte kaçırılan tüm ziller peş peşe çalmaz — indeks ilerler, ses çalmaz.

Hook'un döndürdüğü durum: `phase: "prep" | "running" | "done"`, `prepRemaining`, `remaining`,
`elapsedInSession`.

---

## Adım 7 — Kurulum ekranı

Yeni: `apps/mobile/src/features/meditation/MeditationSetup.tsx`

`BreathingSetup.tsx`'in birebir görsel dili: `<ScrollView contentContainerClassName="gap-6 px-4 py-4">`,
bölüm başlığı `text-sm font-medium text-ink-soft`, ve **aynı chip stili**
(`rounded-full border px-4 py-2`, seçili: `border-transparent bg-primary-500` + `text-white`,
seçili değil: `border-line bg-card active:bg-raised` + `text-ink-soft`) — kod
`BreathingSetup.tsx:72-92`'den alınır. UI kitinde bilinçli olarak `Select` yok.

Bölümler: Süre → Hazırlık → Aralık Zili → Zil Sesi → `<Toggle>` Ekranı açık tut →
`<Button size="lg">` Meditasyona Başla.

Chip satırı 4 kez tekrarlandığı için bu dosyada yerel bir `<ChipRow>` alt bileşeni çıkarılır
(`app/settings.tsx`'in yerel `SettingsSection` deseniyle aynı yaklaşım). `src/ui/` genişletilmez.

---

## Adım 8 — Oturum ekranı

Yeni: `apps/mobile/src/features/meditation/MeditationSession.tsx`

`BreathingExercise.tsx:124` ile aynı kabuk: `<Modal visible animationType="fade" onRequestClose
statusBarTranslucent>` — sekme çubuğunu ve header'ı örten şey bu; kapanması onları geri getirir.

- Görsel: mevcut **`<MiniOrb size={180} />`** (`src/ui/MiniOrb.tsx`) yeniden kullanılır. Nefesteki
  faz-güdümlü ölçekleme meditasyonda yanlış olur; MiniOrb'un 5 sn'lik sakin nefesi tam da doğru
  şey ve `ReduceMotion.System`'e zaten saygı duyuyor.
- `phase === "prep"`: `t.meditation.getReady` + büyük geri sayım.
- `phase === "running"`: büyük `m:ss` kalan süre (`formatTime` mantığı `BreathingExercise.tsx:32-36`),
  altında aralık zili açıksa bir sonraki zile kalan süre, sağ üstte X, altta `t.meditation.finishEarly`.
- `phase === "done"`: `GradientCircle` + `Check` bitiş ekranı — `BreathingExercise.tsx:126-144`
  ile aynı düzen, metinler `t.meditation.complete` / `X dakika meditasyon`.
- `meditationKeepAwake` true ise `useKeepAwake()` çağrılır. **Koşullu hook olamaz** — küçük bir
  `<KeepAwake />` alt bileşeni koşullu render edilir.
- Unmount'ta: bitiş zilini durdur, sessizlik döngüsünü `remove()` et, ses modunu geri al.

---

## Adım 9 — Sekme ve rota

- `app/(tabs)/breathe.tsx` → **`app/(tabs)/meditate.tsx`** (git mv). Rota adı `breathe` başka
  hiçbir yerde geçmiyor — deep link yok, dashboard'dan link yok (doğrulandı).
- `app/(tabs)/_layout.tsx`: `name="breathe"` → `name="meditate"`, `title: t.nav.meditation`,
  ikon `Wind` → `Flower2` (lucide-react-native).
- Yeni `meditate.tsx` gövdesi: segment state + iki kurulum ekranı + iki runner.
  `BreathingSetup` / `BreathingExercise` **imzaları değişmez** — mevcut nefes state'i
  (`selectedTechniqueId`, `selectedDuration`, `isActive`) aynen kalır.

```tsx
<View className="flex-1 bg-canvas">
  <View className="px-4 pt-4">
    <SegmentedTabs tabs={[{ id: "timer", label: t.meditation.tabTimer },
                          { id: "breathing", label: t.meditation.tabBreathing }]}
                   activeTab={segment} onChange={setSegment} />
  </View>
  {segment === "timer" ? <MeditationSetup … /> : <BreathingSetup … />}
  {breathingActive && <BreathingExercise … />}
  {meditationActive && <MeditationSession … />}
</View>
```

Runner'lar bugünkü gibi koşullu render edilir — her çalıştırma sıfırdan mount olsun
(timer baseline ve animasyonlar sıfırdan başlasın).

---

## Adım 10 — Plan panosu

`docs/plans/mobile-app.html`'e yeni bir faz kartı eklenir (repo konvansiyonu; Faz 10'a kadar dolu).

---

## Kapsam dışı (bilerek)

- **Veritabanı kaydı yok.** Nefes egzersizleri de bugün hiçbir yere yazılmıyor (breathing tablosu,
  sorgusu, analitiği yok). Meditasyon oturumlarını loglamak migration + `queries.ts` + dashboard
  değişikliği demek — ayrı bir iş olarak bırakılıyor.
- **Desktop dokunulmuyor.**
- **Ambiyans/arka plan sesi yok** (yağmur, drone vb.). Altyapı (`silence.wav` yerine gerçek bir
  ambiyans dosyası) buna hazır olacak; içerik ayrı karar.
- `breathing` bloğundaki ölü i18n anahtarlarının temizliği.

---

## Doğrulama

Native bağımlılık eklenmediği için **rebuild gerekmez**; Metro yeniden başlatması yeterli.

```bash
cd /Users/patika-server/Desktop/opengnothia-mono/opengnothia && LANG=en_US.UTF-8 pnpm --filter @opengnothia/mobile run:ios
```

Ardından `mcp__Claude_Code_iOS_Simulator__control` ile:

1. **Segment** — Meditasyon sekmesi açılıyor, ikon çiçek, başlık "Meditasyon". Nefes segmentine
   geçince bugünkü teknik kartları + süre chip'leri aynen çalışıyor, egzersiz tam tur dönüyor.
2. **Hızlı tur (geçici deep-link sürücüsü)** — Faz 2/3'te kullanılan desenle `meditate.tsx`'e
   geçici `useLocalSearchParams` sürücüsü eklenir (`?autostart=1&duration=40&prep=5&interval=15`),
   böylece 40 sn'de tam bir oturum (hazırlık zili → 2 aralık zili → bitiş zili → bitiş ekranı)
   izlenir. **Sürücü commit'ten önce kaldırılır.**
3. **Kalıcılık** — süre/hazırlık/aralık/zil seçilir, uygulama öldürülüp yeniden açılır, seçimler duruyor.
4. **Sessiz mod** — cihaz sessize alınır, `playsInSilentMode: true` sayesinde zil yine duyuluyor.
5. **Arka plan (gerçek cihazda)** — oturum başlat, ekranı kilitle, aralık zilinin kilitli ekranda
   zamanında çaldığını doğrula; geri dönüldüğünde kalan sürenin gerçek zamana yetiştiğini gör.
   Simülatörün arka plan davranışı cihazdan farklı olabilir, bu adım cihazda yapılır.
6. **Zil yığılması olmuyor** — uygulamayı uzun süre arka planda tut, dönüşte peş peşe zil çalmıyor.
7. **Dil** — TR ↔ EN geçişinde tüm meditasyon yüzeyi anında güncelleniyor.
8. `pnpm -w exec tsc --noEmit` (veya repo'nun tsc script'i) temiz — 8 dil dosyası da eksiksiz.
