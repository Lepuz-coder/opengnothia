# Seans Sayfası — Tanışma Formu (Clinical Intake Form) Feature

## Context

OpenGnothia'da AI destekli terapi seansları var. AI, her seansta `buildSystemPrompt` / `buildGreetingPrompt` üzerinden kullanıcının temel profilini (name, age, gender, occupation, goals) görüyor — ama psikologların normalde ilk görüşmede doldurttuğu klinik **intake form** (başvuru sebebi, mevcut endişeler, önceki terapi, önemli yaşam olayları, vb.) yok. Bu zengin context olmadan AI "soğuk başlıyor" ve ilk birkaç seansı bu bilgileri toplamakla geçiriyor.

Çözüm: Kullanıcının bir kerelik doldurduğu, sonra kalıcı olarak AI prompt'una enjekte edilen bir **Tanışma Formu** eklemek.

**Hedef deneyim:**
- Seans sayfasında (pre-state) üstte güzel bir section: form boşsa motivasyonel CTA kutusu (dashboard'daki `TodaySessionHero` tasarımına benzer), doluysa kompakt özet kartı + "Düzenle" butonu.
- İlk seans başlarken form boşsa ve kullanıcıya hiç sorulmadıysa bir modal ile **bir kez** istenir; atlayabilir, ama flag set olur ve bir daha seans başlatırken görünmez.
- Doldurulduğu andan itibaren form bilgileri her seans system prompt'una enjekte edilir.

---

## Architecture

### 1. Data Model — Yeni DB Tablosu

Singleton pattern (id=1), `user_profile` / `patient_notes` ile aynı yaklaşım.

**Yeni migration:** [src-tauri/migrations/017_add_patient_intake_form.sql](src-tauri/migrations/017_add_patient_intake_form.sql)

```sql
CREATE TABLE IF NOT EXISTS patient_intake_form (
  id INTEGER PRIMARY KEY DEFAULT 1,
  reason_for_seeking TEXT,
  current_concerns TEXT,
  previous_therapy TEXT,
  current_medications TEXT,
  family_relationships TEXT,
  significant_life_events TEXT,
  sleep_patterns TEXT,
  physical_health TEXT,
  strengths_support TEXT,
  therapy_expectations TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Migration kayıt:** [src-tauri/src/lib.rs](src-tauri/src/lib.rs) — mevcut migration listesine `Migration { version: 17, ... MigrationKind::Up, sql: include_str!("../migrations/017_add_patient_intake_form.sql") }` satırını ekle (016'nın hemen altına).

### 2. TypeScript Type

**Dosya:** [src/types/index.ts](src/types/index.ts) — mevcut `UserProfile`'dan hemen sonra ekle:

```typescript
export interface PatientIntakeForm {
  id: number;
  reason_for_seeking: string | null;
  current_concerns: string | null;
  previous_therapy: string | null;
  current_medications: string | null;
  family_relationships: string | null;
  significant_life_events: string | null;
  sleep_patterns: string | null;
  physical_health: string | null;
  strengths_support: string | null;
  therapy_expectations: string | null;
  created_at: string;
  updated_at: string;
}
```

### 3. DB Queries

**Dosya:** [src/services/db/queries.ts](src/services/db/queries.ts) — `upsertUserProfile` blocundan hemen sonra ekle. `user_profile` pattern'ini tıpatıp taklit et:

```typescript
export async function getPatientIntakeForm(): Promise<PatientIntakeForm | null> {
  const db = await getDatabase();
  const rows = await db.select<PatientIntakeForm[]>("SELECT * FROM patient_intake_form WHERE id = 1");
  return rows[0] ?? null;
}

export async function upsertPatientIntakeForm(
  data: Partial<Omit<PatientIntakeForm, "id" | "created_at" | "updated_at">>
): Promise<void> {
  // UPDATE if row exists, INSERT if not — aynı pattern upsertUserProfile ile
}

export async function hasIntakeFormContent(): Promise<boolean> {
  // En az bir alan dolu mu? — CTA kutusu / dolu kart ayrımı için
}
```

Export'ları da `PatientIntakeForm` type'ını types import satırına ekle.

### 4. Prompt Injection

**Dosya:** [src/services/ai/promptBuilder.ts:44-177](src/services/ai/promptBuilder.ts)

`buildSystemPrompt` ve `buildGreetingPrompt` signature'larına yeni opsiyonel param ekle:

```typescript
intakeForm?: PatientIntakeForm | null;
```

Profile bloğunun **hemen sonrasında** (line 123'ten sonra, check-in'den önce) yeni bir section ekle:

```typescript
if (intakeForm) {
  const filledFields: string[] = [];
  if (intakeForm.reason_for_seeking) filledFields.push(`- Reason for seeking support: ${intakeForm.reason_for_seeking}`);
  if (intakeForm.current_concerns) filledFields.push(`- Current concerns: ${intakeForm.current_concerns}`);
  // ... diğer 8 alan
  if (filledFields.length > 0) {
    prompt += `\n\n--- Clinical Intake (filled by the client at the start of therapy) ---`;
    prompt += `\nThis is the client's self-reported intake information. Use it to inform your understanding of their background and current situation.\n`;
    prompt += filledFields.join("\n");
  }
}
```

Sadece dolu alanlar prompt'a eklenir (boş alanlar gürültü yapmasın).

### 5. SessionPage Entegrasyonu — Veri Yükleme

**Dosya:** [src/pages/SessionPage.tsx](src/pages/SessionPage.tsx)

**a)** `getPatientIntakeForm` çağrısını **tüm prompt yapıcı 3 yere** ekle:
- `handleGreeting` içindeki `Promise.all` (line 163)
- `performCompaction` içindeki `Promise.all` (line 267)
- `handleSendMessage` içindeki `Promise.all` (line 344)

Her birinde `buildSystemPrompt` / `buildGreetingPrompt` çağrısına `intakeForm` param'ını geçir.

**b)** `queries.ts` import'una `getPatientIntakeForm, upsertPatientIntakeForm, hasIntakeFormContent` ekle (line 31).

### 6. Settings Store — "Bir kez gösterildi" Flag

**Dosya:** [src/lib/store.ts](src/lib/store.ts) — `STORE_DEFAULTS` içine ekle:

```typescript
hasSeenIntakeFormPrompt: false,
```

**Dosya:** [src/stores/useAppStore.ts](src/stores/useAppStore.ts) — `hasSeenNoteTutorial` pattern'i aynen. `hasSeenIntakeFormPrompt: boolean` ve `setHasSeenIntakeFormPrompt(v: boolean): void` ekle.

**Dosya:** [src/App.tsx:35-111](src/App.tsx) — mevcut `hasSeenNoteTutorial` load bloğunun (line 42-43) yanına ekle:

```typescript
const hasSeenIntakeFormPrompt = await store.get<boolean>("hasSeenIntakeFormPrompt");
if (hasSeenIntakeFormPrompt) setHasSeenIntakeFormPrompt(true);
```

### 7. Yeni UI Komponentleri

#### a) `IntakeFormModal.tsx` (merkezi form modal)

**Yeni dosya:** [src/components/session/IntakeFormModal.tsx](src/components/session/IntakeFormModal.tsx)

- `Modal` primitive'ini kullan ([src/components/ui/Modal.tsx](src/components/ui/Modal.tsx)), ancak büyük form için `className` override ile `max-w-2xl` yap.
- Props: `isOpen`, `onClose`, `onSaved`, `allowSkip: boolean` (ilk açılışta true, edit modunda Kaydet-Vazgeç), `initialData: PatientIntakeForm | null`.
- 10 alan, `<textarea>` (3-4 satır) + label + opsiyonel yardımcı açıklama:
  1. Başvuru sebebi — "Şu an destek arama kararını ne motive etti?"
  2. Mevcut endişeler/belirtiler — "Şu an hangi durumlar en çok zorluyor?"
  3. Önceki terapi deneyimi — "Daha önce terapi aldın mı? Nasıl bir deneyimdi?"
  4. Mevcut ilaç/sağlık takibi — "Kullandığın ilaçlar veya düzenli sağlık takibin var mı?"
  5. Aile ve önemli ilişkiler — "Yakın aile ve önemli ilişkilerinden bahseder misin?"
  6. Önemli yaşam olayları — "Seni şekillendiren önemli yaşam olayları neler?"
  7. Uyku düzeni — "Uyku düzenin nasıl?"
  8. Fiziksel sağlık — "Fiziksel sağlığında etkili olan durumlar var mı?"
  9. Güçlü yönler ve destek — "Güçlü yönlerin ve destek sistemin neler?"
  10. Terapiden beklentiler — "Bu süreçten ne umuyorsun?"
- Form state: her alan controlled `useState<string>`, `initialData`'dan seed.
- Her textarea, input tasarımına uygun sınıflar: `rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm focus:border-primary-500 ...` ([src/components/ui/Input.tsx](src/components/ui/Input.tsx)'den al).
- Alt butonlar:
  - `allowSkip=true` → solda "Daha sonra" (ghost, `onClose` + `onSaved(null)`), sağda "Kaydet" (primary, `upsertPatientIntakeForm` çağır, `onSaved(form)`, `onClose`).
  - `allowSkip=false` → solda "Vazgeç" (ghost, `onClose`), sağda "Kaydet".
- Scroll: uzun form için `max-h-[80vh] overflow-y-auto` wrapper.

#### b) `IntakeFormCTA.tsx` (boş durumda motivasyonel kutu)

**Yeni dosya:** [src/components/session/IntakeFormCTA.tsx](src/components/session/IntakeFormCTA.tsx)

- [src/components/dashboard/TodaySessionHero.tsx](src/components/dashboard/TodaySessionHero.tsx) ile **birebir aynı görsel dil**: `rounded-3xl p-6 md:p-8 bg-gradient-to-br ... border-accent-500/20`, `breathing-circle` orb, 14×14 ikon kutusu, başlık/subtitle/CTA butonu.
- İkon: `ClipboardList` (lucide-react) — yeni import.
- Label: "TANIŞMA FORMU" (uppercase tracking-wide), Başlık: "Kendini AI'a tanıt" (`t.session.intakeCtaTitle`), Subtitle: "10 kısa soruyla birlikte başlayalım. Bu bilgiler her seansta AI'a arka plan sağlar — dilediğin zaman güncelleyebilirsin." (`t.session.intakeCtaSubtitle`).
- Button: "Formu Doldur" + `ArrowRight` ikonu. `onClick={() => setIntakeModalOpen(true)}`.
- Accent renk `accent` varyantı (farklı hissettirmek için primary'den ayır — accent yeşil/turkuaz tonları).

#### c) `IntakeFormSummaryCard.tsx` (dolu durumda kompakt özet)

**Yeni dosya:** [src/components/session/IntakeFormSummaryCard.tsx](src/components/session/IntakeFormSummaryCard.tsx)

- Küçük card: `rounded-2xl border border-[var(--border-color)]/50 bg-[var(--bg-secondary)] p-4`.
- Sol: yeşil check ikonu (`CheckCircle2`, accent-500) + başlık "Tanışma bilgilerin kaydedildi" (`t.session.intakeSavedTitle`).
- Altta: `reason_for_seeking` ilk 100 karakterinden bir preview (`line-clamp-2`, `text-sm text-[var(--text-muted)]`).
- Sağda: `"Görüntüle / Düzenle"` ghost button → `setIntakeModalOpen(true)`, modal `allowSkip=false` açar.

### 8. SessionPage'e Entegrasyon — Pre-state Hero Section

**Dosya:** [src/pages/SessionPage.tsx:793-1042](src/pages/SessionPage.tsx)

**a) State:**
```typescript
const [intakeForm, setIntakeForm] = useState<PatientIntakeForm | null>(null);
const [intakeModalOpen, setIntakeModalOpen] = useState(false);
const [intakeModalAllowSkip, setIntakeModalAllowSkip] = useState(false);
```

**b) Initial load** (new `useEffect`):
```typescript
useEffect(() => {
  getPatientIntakeForm().then(setIntakeForm);
}, []);
```

**c) Render:** idle/pre JSX içinde, header'ın (line 797-834) hemen altına, `PastSessionsList`'in üstüne ekle:

```tsx
<div className="mb-6">
  {!intakeFormHasContent(intakeForm) ? (
    <IntakeFormCTA onClick={() => { setIntakeModalAllowSkip(false); setIntakeModalOpen(true); }} />
  ) : (
    <IntakeFormSummaryCard
      intakeForm={intakeForm}
      onEdit={() => { setIntakeModalAllowSkip(false); setIntakeModalOpen(true); }}
    />
  )}
</div>
```

`intakeFormHasContent` küçük helper: en az bir alan null/empty değil mi?

**d) Modal:** idle/pre ve modal render blokundan sonra:

```tsx
<IntakeFormModal
  isOpen={intakeModalOpen}
  onClose={() => setIntakeModalOpen(false)}
  onSaved={(updated) => setIntakeForm(updated)}
  allowSkip={intakeModalAllowSkip}
  initialData={intakeForm}
/>
```

### 9. İlk Seans Öncesi Modal Akışı

**Dosya:** [src/pages/SessionPage.tsx](src/pages/SessionPage.tsx) — Start Session Modal'ındaki "Başla" butonunun (line 923-988) akışını değiştir.

Mevcut akış: apiTesting → setStartModalOpen(false) → handleStartSession() → handleGreeting().

**Yeni:** api test başarılı olduktan sonra, `handleStartSession()` çağrısından **önce**:

```typescript
const appStore = useAppStore.getState();
const currentIntake = await getPatientIntakeForm();
if (!intakeFormHasContent(currentIntake) && !appStore.hasSeenIntakeFormPrompt) {
  // Start modal'ı kapat, intake modal'ı aç (allowSkip=true)
  setStartModalOpen(false);
  setIntakeModalAllowSkip(true);
  setIntakeModalOpen(true);
  // Flag'i hemen set et (bir kez gösterildi)
  appStore.setHasSeenIntakeFormPrompt(true);
  const store = await loadSettings();
  await store.set("hasSeenIntakeFormPrompt", true);
  await store.save();
  // Kullanıcı modal'ı kapattığında seansı başlatacak bir "pending start" flag'i tut.
  setPendingSessionStart(true);
  return;
}
```

`IntakeFormModal`'ın `onClose` / `onSaved` callback'lerinde:
```typescript
onSaved={async (updated) => {
  setIntakeForm(updated);
  if (pendingSessionStart) {
    setPendingSessionStart(false);
    // seansa devam et
    await handleStartSession();
    handleGreeting();
    if (selectedMode === "voice") voiceLoop.startLoop();
  }
}}
```

`onClose` ile "Daha sonra" denirse (pendingSessionStart true ise), yine seansı başlat ama form boş.

### 10. i18n Translation Keys

**Dosya:** [src/i18n/tr.ts](src/i18n/tr.ts) + [src/i18n/en.ts](src/i18n/en.ts) + diğer 6 dil.
**Type dosyası:** [src/i18n/index.ts](src/i18n/index.ts) — `Translations` interface'ine ekle.

`session` namespace altına (`session.title` ile aynı grubun içinde):
- `intakeCtaTitle`, `intakeCtaSubtitle`, `intakeCtaButton`
- `intakeSavedTitle`, `intakeEditButton`
- `intakeModalTitle`, `intakeModalDescription`
- `intakeFieldReason`, `intakeFieldReasonPlaceholder` (10 alan × 2 = 20 key)
- `intakeSaveButton`, `intakeSkipButton`, `intakeCancelButton`
- `intakeFirstSessionModalTitle`, `intakeFirstSessionModalHint` (ilk seans prompt'u için)

---

## Critical Files — Özet

**Değiştirilecek:**
- [src/services/ai/promptBuilder.ts:44-201](src/services/ai/promptBuilder.ts) — `buildSystemPrompt` + `buildGreetingPrompt` içine intake injection
- [src/services/db/queries.ts](src/services/db/queries.ts) — 3 yeni fonksiyon + `PatientIntakeForm` import
- [src/types/index.ts](src/types/index.ts) — yeni `PatientIntakeForm` interface
- [src/pages/SessionPage.tsx](src/pages/SessionPage.tsx) — intake load, hero section, modal, ilk-seans flow, 3 ayrı promptBuilder çağrısına param
- [src/lib/store.ts](src/lib/store.ts) — `hasSeenIntakeFormPrompt: false` default
- [src/stores/useAppStore.ts](src/stores/useAppStore.ts) — flag state + setter
- [src/App.tsx:35-111](src/App.tsx) — flag'i store'dan yükle
- [src-tauri/src/lib.rs](src-tauri/src/lib.rs) — migration kaydı
- [src/i18n/index.ts](src/i18n/index.ts) + 8 dil dosyası — yeni translation keys

**Oluşturulacak:**
- [src-tauri/migrations/017_add_patient_intake_form.sql](src-tauri/migrations/017_add_patient_intake_form.sql)
- [src/components/session/IntakeFormModal.tsx](src/components/session/IntakeFormModal.tsx)
- [src/components/session/IntakeFormCTA.tsx](src/components/session/IntakeFormCTA.tsx)
- [src/components/session/IntakeFormSummaryCard.tsx](src/components/session/IntakeFormSummaryCard.tsx)

---

## Reused Existing Components & Utilities

- `Modal` primitive ([src/components/ui/Modal.tsx](src/components/ui/Modal.tsx)) — `className` override ile büyük form için
- `Button` variants ([src/components/ui/Button.tsx](src/components/ui/Button.tsx)) — primary/ghost/danger
- Hero visual dil ([src/components/dashboard/TodaySessionHero.tsx](src/components/dashboard/TodaySessionHero.tsx)) — `rounded-3xl`, `bg-gradient-to-br`, `breathing-circle`, ikon kutusu
- `loadSettings` ([src/lib/store.ts](src/lib/store.ts)) — Tauri store persistence
- `upsertUserProfile` pattern ([src/services/db/queries.ts:16-40](src/services/db/queries.ts)) — upsert singleton row
- `hasSeenNoteTutorial` pattern (App.tsx'te yükleme + useAppStore'da state) — flag persistence için birebir
- Lucide icons: `ClipboardList`, `CheckCircle2`, `ArrowRight`

---

## Verification Plan

1. **DB migration:** `bun tauri dev` ile uygulamayı başlat, yeni tablonun oluştuğunu `sqlite3` ile doğrula.
2. **İlk akış (boş form):**
   - Seans sayfasına git → `IntakeFormCTA` (hero kutu) görünmeli.
   - "Seans Başlat" butonuna bas → API testi geçtikten sonra `IntakeFormModal` açılmalı (allowSkip=true, "Daha sonra" butonu görünür).
   - "Daha sonra" bas → modal kapanır, seans başlar, `hasSeenIntakeFormPrompt=true` settings.json'a yazılır.
   - Seansı bitir → seans sayfasına dön → CTA hala görünmeli (form boş), başka seans başlat → modal **bir daha açılmamalı**.
3. **Dolu akış:**
   - Yukarıdaki akışta "Daha sonra" yerine "Kaydet" bas, birkaç alanı doldur.
   - DB'ye yazıldığını `sqlite3 select * from patient_intake_form;` ile kontrol et.
   - Seans sayfasına dön → `IntakeFormSummaryCard` (check ikonu + preview) görünmeli, CTA yerine.
   - "Düzenle" butonuna bas → modal `allowSkip=false` ile açılır ("Vazgeç" + "Kaydet"), mevcut veriler alanlara prefill edilir.
4. **Prompt injection:**
   - Form dolu iken yeni seans başlat → ChatContainer'daki ilk greeting mesajı, intake bilgilerini reflect ediyor mu (örn. "başvuru sebebi"nde yazdığın konuyu hatırlayıp dokunuyor mu)? Manuel test.
   - DevTools Network'ten `/v1/messages` request body'sine bak: system prompt içinde `--- Clinical Intake ---` bloğu var mı, sadece dolu alanlar geliyor mu?
5. **Regression:**
   - Form olmadan (yeni kullanıcı) seans başlat → normal çalışmalı, prompt'ta intake bloğu olmamalı.
   - `performCompaction` ve `handleSendMessage` akışlarında da intake bilgisi korunuyor mu?
6. **TypeScript + lint:** `bun run typecheck` (veya proje komutu) ile derleme hatasız olmalı.
