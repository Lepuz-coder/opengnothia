# Mobil seans ekranını desktop'ın görsel diline taşı

## Context

Mobil seans yüzeyi (`SessionModal`) işlevsel olarak desktop'la eşit ama görsel olarak
"düzleştirilmiş" bir port. Faz 5–8 boyunca desktop'ın atmosferik katmanları bilinçli
olarak atlanmış — kod içindeki yorumlar bunu itiraf ediyor:

- `ChatMessages.tsx:39` — *"Desktop's mini-orb identity marker, flattened to a tinted dot."*
- `TodaySessionHero.tsx:29` — *"Desktop's animated gradient orb flattens to a static tinted disc."*

Sonuç: düz `bg-canvas` zemin, düz teal nokta, gradientsiz kullanıcı balonu, opak bir
alt çubuk, hiç hareket yok. Desktop'ta ise aynı ekran üç sürüklenen aurora orb'unun
üzerinde yüzen cam yüzeylerden oluşuyor.

**Hedef:** seans sohbet yüzeyini desktop'ın görsel diline getirmek — gradient/aurora
zemin, nefes alan mini-orb, gradient kullanıcı balonu, cam composer, mesaj giriş
animasyonu — mobilin açık/koyu tema desteğini koruyarak.

### Kullanıcı kararları (bu oturumda alındı)

| Konu | Karar |
|---|---|
| Tema | **Tema duyarlı** — aurora ve cam yüzeyler hem açık hem koyu şemada çalışacak |
| Kapsam | **Yalnızca sohbet seansı** — `SessionModal` + `SessionTopBar` + `ChatMessages` + `ChatInput` |
| Cam efekti | **`expo-blur` eklenecek** — gerçek `backdrop-blur`, dev client yeniden derlenecek |

---

## Referans: desktop'ta ne var, mobilde ne yok

| Öğe | Desktop | Mobil bugün |
|---|---|---|
| Zemin | `#0F1729` + 3 sürüklenen aurora orb (`AmbientBackground.tsx`, `styles.css:365-396`) | düz `bg-canvas` (`SessionModal.tsx:195`) |
| Header | `bg-surface-950/55` + `backdrop-blur-xl` + `border-white/[0.06]` (`SessionPage.tsx:1235`) | opak `bg-card` + `border-line` (`SessionTopBar.tsx:78`) |
| AI işareti | 16px radial gradient orb + `0 0 12px` glow + 5sn nefes (`styles.css:404-409`) | düz 12px `bg-primary-500/60` (`ChatMessages.tsx:40`) |
| AI mesajı | balonsuz prose, `min-h-[3.5rem]` streaming'de (`ChatMessage.tsx:36`) | balonsuz prose, min-height yok |
| Kullanıcı balonu | 135° gradient `primary-500/13 → surface-800/90` + gölge (`ChatMessage.tsx:36`) | düz `bg-primary-500/10`, gölgesiz (`ChatMessages.tsx:27`) |
| Composer | yüzen cam kart, blur 24, teal focus glow, gradient send (`ChatInput.tsx:150-227`) | opak çubuk, mic dışarıda solda, düz send (`ChatInput.tsx:36-67`) |
| Yazıyor noktaları | gradient + glow + `animate-bounce` 0/150/300ms (`ChatContainer.tsx:138-142`) | statik opacity kademesi (`ChatMessages.tsx:10-16`) |
| Mesaj girişi | `msg-enter` 0.35s ease-out, opacity + 8px yükselme (`styles.css:399,463`) | yok |
| Reduced motion | tüm animasyonlar kapanır (`styles.css:485-497`) | yok |

**Doğrulanmış teknik zemin:**

- Gradient idiom'u zaten var: `react-native-svg` + `<Defs><LinearGradient>` + absolute-fill `<Rect>` — `LockBadge.tsx:40-49` ve `MoodPicker.tsx:118-130`.
- `boxShadow` string'i RN 0.86'da çalışıyor — `LockBadge.tsx:30-35` tek kullanıcısı.
- Reanimated 4.5.1 kurulu, `useSharedValue`/`withRepeat`/`withTiming` idiom'u `BreathingExercise.tsx:98-114`'te.
- Desktop `Inter`'ı **hiç yüklemiyor** (ne `@font-face` ne `<link>`) — sistem fontuna düşüyor. Mobilde font işi yok.
- `expo-linear-gradient` kurulu değil ve gerekmiyor; aurora radial, `LinearGradient` zaten yapamaz.

---

## Kritik kısıt: paylaşılan bileşenler

`ChatMessages` ve `ChatInput` üç yüzey tarafından kullanılıyor:

| Dosya | Kullanım |
|---|---|
| `apps/mobile/src/features/session/SessionModal.tsx:205,234,236` | asıl hedef |
| `apps/mobile/app/session/[id].tsx:230` | geçmiş seans transkripti (yalnız `ChatMessages`, salt okunur) |
| `apps/mobile/app/(onboarding)/interview.tsx:95,117` | onboarding görüşmesi (ikisi de) |

Mesaj seviyesindeki değişiklikler (mini-orb, gradient balon, giriş animasyonu, yazıyor
noktaları) zemin bağımsız — üç yüzeyde de doğru görünür ve iyileştirmedir.

Composer'ın cam hali onboarding'e de yansır; orada aurora yok, BlurView düz canvas'ı
bulanıklaştırır ve hafif tonlu bir çubuk olarak görünür — bozulma değil. Yine de
doğrulama adımlarında ikisi de gözle kontrol edilecek.

**Geçmiş seans transkriptinde tuzak:** giriş animasyonu tüm mesajlara uygulanırsa 30
mesajlık bir transkript açılışta hep birlikte fade-in yapar. Çözüm: `ChatMessages`
ilk render'daki mesaj id'lerini bir `ref`'e alsın, yalnızca sonradan eklenen id'ler
animasyonlu girsin.

---

## Yapılacaklar

### Adım 1 — `expo-blur` kurulumu

```bash
pnpm --filter @opengnothia/mobile exec expo install expo-blur
```

`apps/mobile/AGENTS.md` gereği kod yazmadan önce
<https://docs.expo.dev/versions/v57.0.0/sdk/blur-view/> okunacak — `intensity`, `tint`
ve Android'de gerçek bulanıklık için gereken `experimentalBlurMethod` değerleri o
sürümden doğrulanacak, bellekten yazılmayacak.

Sonrasında dev client yeniden derlenmeli (yeni native modül):

```bash
LANG=en_US.UTF-8 pnpm --filter @opengnothia/mobile run:ios
```

### Adım 2 — Token'ları tamamla

`apps/mobile/src/theme/colors.ts` — `ThemeColors`'a `raised` ekle (`global.css`'teki
`--raised` ile senkron; dosyanın kendi yorumu bu sözleşmeyi zaten yazıyor):

- light: `#C9D3E5` (surface-100), dark: `#243556` (surface-700)

`apps/mobile/src/theme/sessionAmbience.ts` (yeni) — desktop'ta token olmayan, literal
alfa değerleriyle kullanılan cam/aurora paletini tek yerde topla:

```ts
// dark = desktop styles.css:373-396 birebir; light = aynı hue'ların açık zemin karşılığı
export const AURORA = {
  dark:  { teal: "#3ABAB4", blue: "#3E63DD", violet: "#8B7CF6",
           alpha: { teal: 0.10, blue: 0.08, violet: 0.07 } },
  light: { teal: "#2D8F8B", blue: "#3E63DD", violet: "#7C6BF0",
           alpha: { teal: 0.14, blue: 0.10, violet: 0.09 } },
};
export const GLASS = {
  dark:  { hairline: "rgba(255,255,255,0.06)", pillBorder: "rgba(255,255,255,0.08)" },
  light: { hairline: "rgba(15,23,41,0.08)",    pillBorder: "rgba(15,23,41,0.10)" },
};
```

Açık şema alfaları desktop'takinden yüksek: aynı düşük alfa `#E8EDF5` zeminde
görünmez kalıyor. Değerler cihazda göz kararı ayarlanacak — başlangıç noktası bunlar.

### Adım 3 — `SessionAmbience` (yeni: `src/features/session/SessionAmbience.tsx`)

Desktop'ın `AmbientBackground` + `.aurora-orb` kurallarının RN karşılığı.

- 3 orb, her biri `<Animated.View>` içinde bir `<Svg>` + `<RadialGradient>`:
  merkez alfa → `%40`'ta alfanın ~%37'si → `%70`'te tam saydam (desktop'ın üç durağı).
  Desktop'taki `blur(60px)` gerekmiyor — `styles.css:363-364` yorumu yumuşaklığın
  gradient'ten geldiğini, blur'un yalnız banding düzelttiğini söylüyor. Banding
  görülürse durak sayısı artırılır.
- Boyut ve konum `useWindowDimensions()` üzerinden, desktop'ın yüzdeleri telefona
  çevrilerek: teal `1.5×W` @ `top -18%H / left -12%W`, blue `1.3×W` @ `top 28%H /
  right -14%W`, violet `1.1×W` @ `bottom -14%H / left 18%W`.
- Sürüklenme: her orb için tek bir `progress` shared value,
  `withRepeat(withTiming(1, { duration }), -1, true)` (75s / 90s / 60s — desktop'la
  aynı), sonra `interpolate(progress, [0, 0.5, 1], [...])` ile translateX/Y, scale ve
  opacity. Bu, desktop'ın 3 keyframe'li `alternate` döngüsünün birebir karşılığı.
  `vw`/`vh` değerleri `W`/`H` çarpanına çevrilir.
- **Yalnızca transform ve opacity animasyonlanır** — gradient'e hiç dokunulmaz
  (desktop'ın kendi kuralı).
- `pointerEvents="none"`, `StyleSheet.absoluteFill`.
- `AccessibilityInfo.isReduceMotionEnabled()` true ise sürüklenme başlatılmaz, orblar
  statik yıkama olarak kalır — desktop'ın `prefers-reduced-motion` bloğunun karşılığı.

`SessionModal.tsx:195` yeniden yapılandırılacak: `paddingTop: insets.top` kök
`View`'dan alınıp bir iç sarmalayıcıya taşınacak. Aksi halde absolute konumlanan
aurora katmanı padding kutusuna hizalanır ve status bar altında kesilir. `Modal`
zaten `statusBarTranslucent` (`:193`), yani aurora status bar'ın altına akacak.

```
<View className="flex-1 bg-canvas">
  <SessionAmbience />
  <View className="flex-1" style={{ paddingTop: insets.top }}>  ← mevcut içerik
  ...
  <ConfirmSheet /> <NewInsightModal /> <ToastContainer />        ← kök seviyede kalır
```

### Adım 4 — `MiniOrb` (yeni: `src/ui/MiniOrb.tsx`)

Desktop `.mini-orb` (`styles.css:404-409`) karşılığı, `{ size }` prop'u ile.

- `<RadialGradient cx="35%" cy="35%">` + desktop'ın dört durağı:
  `rgba(75,195,190,0.95)` → `rgba(58,186,180,0.55)` @45% → `rgba(35,110,107,0.2)` @72%
  → saydam @100%.
- Glow: `boxShadow: "0px 0px 12px rgba(58,186,180,0.35)"` (koyu), açık şemada
  `LockBadge.tsx:30-35`'teki gibi biraz daha yumuşak.
- Nefes: `withRepeat(withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }), -1, true)`
  → scale `1 ↔ 1.08`, opacity `0.7 ↔ 1` (desktop 5sn tam tur = 2.5sn yarım tur).
- Reduced motion'da statik.
- SVG id'si tüm örneklerde aynı gradient'i tanımladığı için sabit kalabilir —
  `LockBadge.tsx:38-39`'daki belgelenmiş idiom.

Kullanım: `ChatMessages.tsx:40`'taki düz nokta → `<MiniOrb size={16} />` (desktop 16px,
mobil bugün 12px), `:95`'teki boş durum diski → `<MiniOrb size={48} />`.

### Adım 5 — `ChatMessages.tsx`

- **Kullanıcı balonu** (`:27`): `overflow-hidden` + absolute-fill `<Svg><LinearGradient x1=0 y1=0 x2=1 y2=1>`
  (`LockBadge` idiom'u), duraklar şemaya göre:
  - koyu: `#3ABAB4` @0.16 → `#1A2744` @0.92
  - açık: `#3ABAB4` @0.18 → `#FFFFFF` @0.95

  `border-primary-500/20` korunur; `boxShadow` eklenir — koyu
  `0px 4px 20px rgba(10,33,32,0.6)`, açık `0px 4px 16px rgba(45,143,139,0.18)`.
  `max-w-[80%]` telefonda kalır (desktop'ın `70%`'i geniş pencere içindir).
- **AI mesajı**: `<MiniOrb size={16} />`; streaming'de `minHeight: 56` (desktop'ın
  `min-h-[3.5rem]`'i) ile yerleşim sıçraması önlenir.
- **`TypingDots`** (`:9-17`): 3 × 8px gradient nokta (`primary-400 → primary-600`) +
  `boxShadow "0px 0px 8px rgba(58,186,180,0.45)"`, reanimated ile 0/150/300ms
  gecikmeli zıplama.
- **Giriş animasyonu**: `Animated.View entering={FadeInDown.duration(350).withInitialValues({ transform: [{ translateY: 8 }] }).reduceMotion(ReduceMotion.System)}`
  — desktop'ın `msg-enter`'ı (opacity + 8px, 0.35s ease-out) birebir.
  İlk render'daki id'ler bir `useRef<Set<string>>`'e alınır; yalnız sonradan gelen
  mesajlar animasyonlu girer (geçmiş transkript toplu fade-in yapmasın).
- `memo` (`:21`) ve streaming-düz-metin / settled-markdown ayrımı (`:41-54`) aynen
  korunur — 48ms'lik streaming flush'larında markdown yeniden parse edilmesin diye
  bilinçli konmuş.
- `ScrollView`'a zemin verilmez, aurora görünsün.

### Adım 6 — `ChatInput.tsx`

Desktop'ın yüzen cam kartına geçiş (`ChatInput.tsx:147-231`):

- Dış kap: `border-t` ve `bg-card` **kaldırılır**, saydam bir bant olur
  (`px-4 pb-3 pt-2`) — desktop'ta composer'ın üstünde ayırıcı yok, aurora'nın üzerinde
  yüzüyor.
- Pill: `overflow-hidden rounded-2xl` + `<BlurView>` + üstüne `canvas`/`card` %60
  tonlama katmanı + `GLASS.pillBorder` hairline +
  `boxShadow "0px 8px 32px rgba(0,0,0,0.4)"` (açık şemada daha yumuşak).
- **Focus durumu**: `onFocus`/`onBlur` ile border → `rgba(58,186,180,0.40)`,
  boxShadow'a teal glow `0px 0px 28px rgba(58,186,180,0.35)` eklenir. RN'de
  `boxShadow` string'i ucuza animasyonlanamadığı için geçiş anlık olacak — desktop'ın
  `duration-300`'ü birebir taşınmıyor, bilinçli sapma.
- Mic ve send **pill'in içine**, sağ alta (`absolute right-2 bottom-1.5`, `gap-1`) —
  desktop yerleşimi. Butonlar 36px görsel, `hitSlop` ile 44pt dokunma hedefi
  (desktop'ın 32px'i fare için; HIG minimumunun altına inilmez).
- Mic: dolgusuz, `colors.tint` ikon, `active:` arkaplan. (Mobilde mic sesli moda
  geçiyor, desktop'taki dikte değil — davranış aynen korunur.)
- Send: aktifken SVG gradient dolgu `#4BC3BE → #2D8F8B` +
  `boxShadow "0px 0px 14px rgba(58,186,180,0.4)"`; pasifken dolgusuz, `inkMute` ikon.
  İkon `ArrowUp` kalır (telefon idiom'u; desktop `Send` kullanıyor — istenirse tek
  satırlık değişiklik).
- `canSend = !disabled && draft.trim().length > 0` semantiği (`:26`) aynen korunur:
  asistan yazarken alan yazılabilir kalır, yalnız gönderme kilitlenir.

### Adım 7 — `SessionTopBar.tsx`

- Kap (`:78`): `bg-card` → `<BlurView>` + `canvas` %55 tonlama;
  `border-b border-line` → `GLASS.hairline` (1px).
- İçerik satırı (timer + ACT pill + ring + ampul + kırmızı dur) **olduğu gibi kalır** —
  desktop bunları header ile alt kontrol çubuğuna yayıyor, telefonda tek satır doğru
  uyarlama ve `SessionTopBar.tsx:55-60`'taki yorum bunu zaten gerekçelendiriyor.
- ACT pill'e desktop'ın `Badge variant="primary"` tonu:
  `bg-primary-900/30` + `text-primary-300` (koyu) — mevcut `primary-500/10` +
  `primary-600/400`'den daha yakın eşleşme.

### Adım 8 — `Markdown.tsx`

`code_inline` / `fence` / `code_block` arkaplanı `colors.canvas` → `colors.raised`.
Desktop `var(--color-surface-700)` kullanıyor; canvas artık aurora taşıyor, kod
blokları zemine karışıp kayboluyordu.

---

## Değişecek / eklenecek dosyalar

**Yeni**
- `apps/mobile/src/features/session/SessionAmbience.tsx`
- `apps/mobile/src/ui/MiniOrb.tsx` (+ `src/ui/index.ts` export)
- `apps/mobile/src/theme/sessionAmbience.ts`

**Değişecek**
- `apps/mobile/src/features/session/SessionModal.tsx` (inset yapısı + ambience)
- `apps/mobile/src/features/session/SessionTopBar.tsx` (cam header)
- `apps/mobile/src/features/session/ChatMessages.tsx` (orb, gradient balon, animasyon, noktalar)
- `apps/mobile/src/features/session/ChatInput.tsx` (cam composer)
- `apps/mobile/src/features/session/Markdown.tsx` (kod bloğu zemini)
- `apps/mobile/src/theme/colors.ts` (`raised` token'ı)
- `apps/mobile/package.json` (`expo-blur`)

**Dokunulmayacak:** `sessionActions.ts`, `useSessionStore`, `VoiceConversationView`,
`SessionEndScreen`, `IntakeCard` — bu tur salt görsel.

---

## Doğrulama

1. **Tip kontrolü** — `apps/mobile` dizininde:

```bash
npx tsc --noEmit -p apps/mobile/tsconfig.json
```

2. **Dev client yeniden derleme** (yeni native modül şart):

```bash
LANG=en_US.UTF-8 pnpm --filter @opengnothia/mobile run:ios
```

3. **Simülatörde uçtan uca** — iOS Simulator MCP araçlarıyla, `attach` ile canlı panel
   açık: seans başlat → ilk AI mesajını bekle → mesaj yaz ve gönder → streaming'i
   izle. Ekran görüntüleriyle kanıtlanacaklar:
   - aurora zemin görünür ve status bar altına akıyor (kesilmiyor)
   - AI mini-orb parlıyor ve nefes alıyor
   - kullanıcı balonu gradientli, gölgeli
   - composer cam, focus'ta teal glow yanıyor, send gradient + glow
   - yeni mesaj fade + yükselerek giriyor, yazıyor noktaları zıplıyor
4. **İki şemada da** — Ayarlar'dan açık ve koyu tema, ikisinde de yukarıdaki liste.
   Açık şemada aurora'nın görünür ama kirli olmaması kritik kontrol.
5. **Paylaşılan yüzeylerde regresyon** — geçmiş seans transkripti
   (`app/session/[id].tsx`: toplu fade-in olmamalı) ve onboarding görüşmesi
   (`app/(onboarding)/interview.tsx`: cam composer düz canvas üzerinde bozulmamalı).
6. **Reduced motion** — Simulator'da Settings → Accessibility → Motion → Reduce Motion
   açıkken aurora ve orb donmalı, giriş animasyonu kapanmalı.
7. **Klavye** — `KeyboardAvoidingView` ile composer klavyenin üstünde doğru
   konumlanıyor, cam pill kırpılmıyor.
8. **Android notu** — proje iOS öncelikli. Android'de `expo-blur` gerçek bulanıklık
   için ek yapılandırma istiyor; Android denenecekse SDK 57 dokümanındaki
   `experimentalBlurMethod` değeri kullanılacak ve ayrıca doğrulanacak.
