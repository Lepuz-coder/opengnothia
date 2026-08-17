# AI Model Listesine Yeni Modelleri Ekleme Planı

## Context

Ayarlar > AI sekmesi ve onboarding (API kurulum adımı), `providers.ts` dosyasındaki model listesinden dinamik olarak dropdown oluşturuyor. Ancak listede Nisan 2026 itibarıyla çıkmış olan yeni modeller yer almıyor:

- **Anthropic:** En güncel model **Claude Opus 4.7** (16 Nisan 2026'da yayınlandı). Listede en yeni olarak Opus 4.6 duruyor.
- **OpenAI:** En güncel model **GPT-5.4** (Mart 2026'da yayınlandı, Nisan'da 5.4-Cyber varyantı da geldi), ayrıca **GPT-5.3** da mevcut. Listede en yeni olarak GPT-5.2 duruyor.

**Amaç:** Yeni modelleri hem Ayarlar/AI sekmesinde hem onboarding'de seçilebilir hale getirmek; chat için "Önerilen" etiketini Opus 4.7'ye taşımak; ilk kurulum fallback'lerini de yeni varsayılanla hizalamak.

**Kullanıcı kararları (AskUserQuestion ile onaylandı):**
1. OpenAI: tüm GPT-5.4 ailesi (5.4, 5.4 Mini, 5.4 Pro) + GPT-5.3 eklenecek.
2. Chat için "Önerilen" → Opus 4.7; bellek için "Önerilen" → Sonnet 4.6 (değişmiyor, yeni Sonnet yok).
3. `lib/store.ts` fallback'i Anthropic + Opus 4.7'ye hizalanacak (mevcut `useSettingsStore.ts` ile uyumsuzdu).

---

## Değişecek Dosyalar

### 1. [`src/constants/providers.ts`](src/constants/providers.ts) — Model listeleri

**Anthropic bloğunun başına (mevcut `claude-opus-4-6`'dan önce) ekle:**

```ts
{
  id: "claude-opus-4-7",
  name: "Claude Opus 4.7",
  contextWindow: 200000,
  costPer1kInput: 0.005,
  costPer1kOutput: 0.025,
  supportsThinking: true,
  supportsAdaptiveThinking: true,
},
```

Fiyat Opus 4.6 ile aynı ($5/M input, $25/M output) — Anthropic duyurusunda teyit edildi.

**OpenAI bloğunun GPT-5 serisinin en başına (mevcut `gpt-5.2`'den önce) ekle:**

```ts
{
  id: "gpt-5.4",
  name: "GPT-5.4",
  contextWindow: 400000,
  costPer1kInput: 0.0025,      // $2.50/M short-context
  costPer1kOutput: 0.015,       // $15/M short-context
  supportsThinking: true,
},
{
  id: "gpt-5.4-mini",
  name: "GPT-5.4 Mini",
  contextWindow: 400000,
  costPer1kInput: 0.00075,      // $0.75/M
  costPer1kOutput: 0.0045,      // $4.50/M
  supportsThinking: true,
},
{
  id: "gpt-5.4-pro",
  name: "GPT-5.4 Pro",
  contextWindow: 400000,
  costPer1kInput: 0.03,         // $30/M short-context
  costPer1kOutput: 0.18,        // $180/M short-context
  supportsThinking: true,
},
{
  id: "gpt-5.3",
  name: "GPT-5.3",
  contextWindow: 400000,
  costPer1kInput: 0.0015,       // 5.2 ile 5.4 arası tahmini
  costPer1kOutput: 0.012,
  supportsThinking: true,
},
```

> Not: `src/services/ai/providers.ts:72` içindeki `isReasoningModel` regex'i `/^gpt-5/` desenini kullanıyor — yeni `gpt-5.3/5.4/5.4-mini/5.4-pro` ID'leri otomatik olarak Responses API yoluna düşecek, ek değişiklik gerekmiyor.

---

### 2. [`src/stores/useSettingsStore.ts`](src/stores/useSettingsStore.ts:56) — Varsayılan chat modeli

**Satır 56:** `model: "claude-opus-4-6"` → `model: "claude-opus-4-7"`

Satır 67 (`memoryModel: "claude-sonnet-4-6"`) **değişmez** — memory için önerilen hâlâ Sonnet 4.6.

---

### 3. [`src/lib/store.ts`](src/lib/store.ts) — İlk kurulum fallback'leri

**Satır 7:** `provider: "openai"` → `provider: "anthropic"`
**Satır 9:** `model: "gpt-4o"` → `model: "claude-opus-4-7"`
**Satır 18:** `memoryModel: "gpt-4o-mini"` → `memoryModel: "claude-sonnet-4-6"`

Bu değişiklik `useSettingsStore.ts`'teki varsayılanlarla tutarsızlığı giderir (daha önce ilk açılışta OpenAI seçiliyken app içi state Anthropic'i gösteriyordu).

---

### 4. [`src/pages/SettingsPage.tsx`](src/pages/SettingsPage.tsx:88) — "Önerilen" etiketi

**Satır 88:** chat modeli dropdown'ında "Önerilen" etiketi:

```ts
label: m.id === "claude-opus-4-6" ? `${m.name} (${t.settings.recommended})` : m.name,
```
→
```ts
label: m.id === "claude-opus-4-7" ? `${m.name} (${t.settings.recommended})` : m.name,
```

**Satır 94:** memory modeli için `claude-sonnet-4-6` **değişmez**.

---

### 5. [`src/components/onboarding/ApiSetupStep.tsx`](src/components/onboarding/ApiSetupStep.tsx:35) — Onboarding "Önerilen" etiketi

**Satır 35:** `SettingsPage.tsx` ile aynı değişiklik:

```ts
label: m.id === "claude-opus-4-6" ? `${m.name} (${t.settings.recommended})` : m.name,
```
→
```ts
label: m.id === "claude-opus-4-7" ? `${m.name} (${t.settings.recommended})` : m.name,
```

**Satır 39:** memory modeli için `claude-sonnet-4-6` **değişmez**.

---

## Yeniden Kullanılan Mevcut Yapılar

Yeni yardımcı fonksiyon veya tip gerekmiyor — tüm altyapı hazır:

- [`AIModel` interface](src/types/index.ts) — model objelerinin şeması
- [`getProvider()`, `modelSupportsThinking()`, `modelSupportsAdaptiveThinking()`](src/constants/providers.ts:195) — yeni modeller için `supportsThinking: true` alanı eklendiği için thinking toggle'ı otomatik görünecek
- [`isReasoningModel()` regex](src/services/ai/providers.ts:72) — `gpt-5.*` deseni yeni GPT-5.3/5.4 ID'lerini otomatik yakalayacak
- Provider geçiş mantığı ([`setProvider` in useSettingsStore](src/stores/useSettingsStore.ts:77)) — yeni model eklendiğinde bir değişiklik gerektirmiyor

---

## Verification (Uçtan Uca Test)

1. **Build / type-check:**
   ```bash
   npm run typecheck   # veya tsc --noEmit, projeye göre
   npm run dev
   ```

2. **Ayarlar > AI sekmesi:**
   - Provider = Anthropic iken chat model dropdown'ında **"Claude Opus 4.7 (Önerilen)"** en üstte görünmeli.
   - Memory model dropdown'ında **"Claude Sonnet 4.6 (Önerilen)"** görünmeli (değişmemiş).
   - Provider = OpenAI seçildiğinde GPT-5 bloğunun en üstünde **GPT-5.4, GPT-5.4 Mini, GPT-5.4 Pro, GPT-5.3** sırayla görünmeli.
   - Opus 4.7 seçiliyken thinking toggle + "Adaptive/Budget" seçimi + "low/medium/high/max" seviyeleri görünmeli.
   - GPT-5.4 seçiliyken thinking toggle görünmeli; seviye listesinde "max" **olmamalı** (OpenAI için max yok — `provider !== "openai"` koşulu).

3. **Onboarding > API Setup adımı:**
   - Aynı model listesinin ve "Önerilen" etiketinin onboarding akışında da geldiğini doğrula.
   - Test butonu ile Opus 4.7 + geçerli Anthropic API key kombinasyonu yeşil ✓ dönmeli.

4. **İlk kurulum fallback:**
   - `settings.json`'u temizle (veya uygulamayı ilk kez açıyormuş gibi davran) → provider `anthropic`, chat `claude-opus-4-7`, memory `claude-sonnet-4-6` olarak başlamalı.

5. **Mevcut kullanıcı regression kontrolü:**
   - Daha önce Opus 4.6 seçili olan kayıtlı settings, yükleme sonrası Opus 4.6 olarak kalmalı (default sadece yeni kullanıcılar için). Store'dan `model` okunduğunda mevcut değer korunuyor.

---

## Kapsam Dışı

- Yeni Sonnet/Haiku sürümü eklemek (henüz 4.6 sonrası Sonnet yok).
- GPT-5.4-Cyber varyantı (sadece "Trusted Access" programı için, normal API erişimi yok).
- Kullanıcının kayıtlı modelini otomatik migrate etmek (4.6 → 4.7); mevcut seçimleri olduğu gibi bırakıyoruz.
- `tts-1`/`tts-1-hd` ses modelleri (istek TTS değil, chat/memory modelleri).
