# OpenAI gpt-5.4 için `xhigh` Reasoning Desteği

## Context

OpenAI'ın gpt-5.4 modeli resmi dokümantasyonda `none`, `minimal`, `low`, `medium`, `high`, `xhigh` reasoning effort değerlerini destekliyor. Mevcut kod `xhigh`'ı hiç kullanmıyor — [providers.ts:44-49](src/services/ai/providers.ts:44) içinde `OPENAI_REASONING_EFFORT["max"]` sessizce `"high"`'a downgrade ediyor ve UI'da ([SettingsPage.tsx:512](src/pages/SettingsPage.tsx:512), [:582](src/pages/SettingsPage.tsx:582), [ApiSetupStep.tsx:171](src/components/onboarding/ApiSetupStep.tsx:171), [:238](src/components/onboarding/ApiSetupStep.tsx:238)) OpenAI için "Kapsamlı" seçeneği tamamen gizleniyor.

Kullanıcı gpt-5.4 (ve mini/pro varyantları) kullandığında en yüksek reasoning seviyesine erişmek istiyor. SessionPage.tsx akışı (lines 225, 451, 560, 721) `thinkingLevel`'ı zaten doğru şekilde `streamMessage` → `formatStreamRequest` → Responses API body'sine iletiyor — bu katmanda değişiklik gerekmez, sadece map'leme ve UI gate'leri düzeltilecek.

**Karar:** Mevcut "max" ("Kapsamlı") UI seçeneği yeniden kullanılacak; OpenAI tarafında backend'de `xhigh` effort'a map'lenecek. `supportsXHighThinking` flag'i sadece gpt-5.4 serisinde `true` olacak — `modelSupportsAdaptiveThinking` pattern'iyle simetrik.

## Değişiklikler

### 1. [src/types/index.ts](src/types/index.ts)
`AIModel` interface'ine (line 119-128) opsiyonel flag ekle:
```ts
supportsXHighThinking?: boolean;
```
`ThinkingLevel` type'ı dokunulmaz — `"low" | "medium" | "high" | "max"` olarak kalır. "max" artık Anthropic'te "max" effort, OpenAI'da "xhigh" effort anlamına gelir.

### 2. [src/constants/providers.ts](src/constants/providers.ts)
**Model bayrakları** (lines 115-138): `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.4-pro`'ya `supportsXHighThinking: true` ekle. Diğer gpt-5 varyantlarına (gpt-5.3 ve önceki) eklenmez — kullanıcı tercihine göre yalnızca 5.4 serisi.

**Yeni helper'lar** (lines 241-260 bloğunun sonuna, mevcut `modelSupportsAdaptiveThinking` pattern'ini mirror ederek):
```ts
export function modelSupportsXHighThinking(providerId: string, modelId: string): boolean {
  const provider = getProvider(providerId);
  if (!provider) return false;
  const model = provider.models.find((m) => m.id === modelId);
  return model?.supportsXHighThinking ?? false;
}

export function modelSupportsMaxThinking(providerId: string, modelId: string): boolean {
  if (providerId === "anthropic") return modelSupportsThinking(providerId, modelId);
  return modelSupportsXHighThinking(providerId, modelId);
}
```
`modelSupportsMaxThinking` = tek çağrı ile UI'ın "max" seçeneğini gösterip göstermeyeceğine karar verir. Anthropic'te thinking destekli tüm modeller max'ı destekler (mevcut davranış); OpenAI'da yalnızca gpt-5.4 serisi.

### 3. [src/services/ai/providers.ts](src/services/ai/providers.ts)
- Line 48: `OPENAI_REASONING_EFFORT["max"]` değerini `"high"` → `"xhigh"` yap.
- Line 55: `OPENAI_THINKING_TOKENS["max"]` değerini `50000` → `100000` yap (xhigh daha çok reasoning tokeni tükettiği için çıktı penceresini iki katına çıkar; gpt-5.4 context window'u 400k olduğu için güvenli).

Bu iki map hem `formatRequest` (Chat Completions, line 93-94) hem `formatStreamRequest` (Responses API, line 131, 134) tarafından okunur; değişiklik her iki akışta da otomatik etkinleşir.

### 4. [src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx)
**Import** (line 16): `modelSupportsMaxThinking`'i de import et.

**Chat model seçeneği** (line 512) — mevcut spread'i şununla değiştir:
```tsx
...(modelSupportsMaxThinking(settings.provider, settings.model) ? [{ value: "max", label: t.settings.thinkingMax }] : []),
```

**Memory model seçeneği** (line 582) — aynı pattern `settings.memoryModel` için:
```tsx
...(modelSupportsMaxThinking(settings.provider, settings.memoryModel) ? [{ value: "max", label: t.settings.thinkingMax }] : []),
```

**Chat model onChange** (line 463-471) — model değiştiğinde seviyeyi düşür:
```tsx
onChange={(e) => {
  settings.setModel(e.target.value);
  if (!modelSupportsThinking(settings.provider, e.target.value)) {
    settings.setThinkingEnabled(false);
  }
  if (!modelSupportsMaxThinking(settings.provider, e.target.value) && settings.thinkingLevel === "max") {
    settings.setThinkingLevel("high");
  }
  settings.setThinkingType(
    modelRequiresAdaptiveThinking(settings.provider, e.target.value) ? "adaptive" : "budget",
  );
}}
```

**Memory model onChange** (line 533-541) — aynı düzeltmeyi `memoryThinkingLevel` için uygula.

### 5. [src/components/onboarding/ApiSetupStep.tsx](src/components/onboarding/ApiSetupStep.tsx)
**Import** (line 9): `modelSupportsMaxThinking`'i ekle.

**Chat model seçeneği** (line 171) ve **memory model seçeneği** (line 238): SettingsPage'dekiyle aynı pattern.

**Chat model onChange** (line 124-130) ve **memory model onChange** (line 191-197): SettingsPage'dekiyle aynı düşürme mantığı, ancak `settings.` yerine store'dan destructure edilen local değişkenler kullanılır (`setThinkingLevel`, `thinkingLevel`).

### 6. [src/stores/useSettingsStore.ts](src/stores/useSettingsStore.ts)
**Auto-downgrade bloklarını sil** — yeni UI gating doğru çalıştığı için artık gereksiz:
- Lines 97-99 (`if (provider === "openai" && restoredLevel === "max") { restoredLevel = "high"; }`)
- Lines 105-107 (aynı blok memory için)

`restoredLevel` ve `restoredMemoryLevel` artık doğrudan `restored.level` olarak atanabilir. Sebebi: provider switch sonrası `newModel = newProvider?.models[0]?.id` OpenAI için `gpt-5.4` (ilk model) — bu zaten `xhigh` destekler, dolayısıyla "max" geçerli. Kullanıcı sonradan desteklemeyen bir modele geçerse (SettingsPage/ApiSetupStep onChange), oradaki gate devreye girer.

### Dokunulmayanlar
- **i18n dosyaları** (8 dil): `thinkingMax` label'ı her iki provider için de semantic olarak doğru ("en yüksek seviye"); değişiklik gerektirmez.
- **SessionPage.tsx**: `thinkingLevel`'ı zaten doğru iletiyor — geçiş noktası (pass-through).
- **Anthropic adapter**: Dokunulmaz; mevcut `max` davranışı korunur.
- **App.tsx / lib/store.ts**: Schema'sız string olarak saklandığı için migration gerekmez; eski `"max"` değerleri direkt `xhigh`'a map'lenir.

## Verification

1. **Type check:** `tsc --noEmit` → yeni flag opsiyonel, tüm `Record<ThinkingLevel, ...>` map'leri hâlâ exhaustive.
2. **Dev modda manuel akış (OpenAI chat)**:
   - Settings → AI → provider = OpenAI, API key gir, model = `gpt-5.4`, thinking ON.
   - Thinking Level dropdown'ında artık 4 seçenek görünmeli: low/medium/high/**Kapsamlı**.
   - "Kapsamlı" seç → kaydet → yeni session başlat → mesaj gönder.
   - DevTools → Network → `POST /v1/responses` body'sinde `"reasoning": { "effort": "xhigh", "summary": "concise" }` ve `"max_output_tokens": 100000` göreceksin.
   - Stream başarılı dönmeli (`response.reasoning_summary_text.delta` ve `response.output_text.delta` event'leri).
3. **Model değiştirme gating'i**:
   - gpt-5.4 + max seçiliyken model'i `gpt-5.3`'e değiştir → thinkingLevel otomatik "high"'a düşer; dropdown'da artık max seçeneği görünmez.
   - Tersine, `gpt-5` + high seçiliyken `gpt-5.4`'e geç → max seçeneği dropdown'a eklenir (kullanıcı manuel upgrade edebilir).
4. **Provider switch**:
   - Anthropic'te claude-opus-4-7 + max → OpenAI'a geç → model otomatik gpt-5.4 olur, thinkingLevel per-provider store'dan restore edilir. gpt-5 + max eskiden stored ise downgrade OLMAZ çünkü yeni model gpt-5.4 (ilk model) ve o max'ı destekler. Eğer gpt-5.4 dışı bir model en üstte olsaydı model onChange gate'i devreye girerdi.
5. **Regression — Anthropic**: Anthropic + claude-opus-4-7 + max payload'u değişmemiş olmalı (`budget_tokens: 50000` veya adaptive `effort: "max"`).
6. **Regression — memory model path**: Settings → memory model'i gpt-5.4 yap, memory thinking ON + max → seans bitir → insight extraction (SessionPage.tsx:560) ve patient notes (SessionPage.tsx:721) istekleri `effort: "xhigh"` gönderir.
7. **Onboarding**: Onboarding akışında ApiSetupStep'te aynı gating'in çalıştığını doğrula.

## Kritik Dosyalar

- [src/types/index.ts](src/types/index.ts) — `AIModel` interface
- [src/constants/providers.ts](src/constants/providers.ts) — gpt-5.4 bayrakları + 2 yeni helper
- [src/services/ai/providers.ts](src/services/ai/providers.ts) — OpenAI effort/token map'leri
- [src/pages/SettingsPage.tsx](src/pages/SettingsPage.tsx) — 2 UI spread + 2 onChange
- [src/components/onboarding/ApiSetupStep.tsx](src/components/onboarding/ApiSetupStep.tsx) — 2 UI spread + 2 onChange
- [src/stores/useSettingsStore.ts](src/stores/useSettingsStore.ts) — 2 auto-downgrade bloğu silinir
