# Plan: Add Spiritual Guidance School

## Context

The user wants a new built-in therapy school based on spiritual/contemplative traditions (Eckhart Tolle, Buddha, Zen). The school should act as a spiritual teacher/guide and appear everywhere other schools appear: SchoolsPage, onboarding school selection, and the "Find Ideal School" AI recommendation flow.

## Architecture Summary

The system dynamically loads schools via `getAllSchools()` which reads from localized arrays in `src/i18n/therapySchools/{lang}.ts`. Adding a school entry to each language file + registering the ID as built-in is sufficient — no UI changes needed.

## Files to Modify (9 total)

| File | Change |
|---|---|
| `src/stores/useSchoolsStore.ts` (line 44) | Add `"spiritual"` to `BUILTIN_IDS` set |
| `src/i18n/therapySchools/en.ts` | Append spiritual school object to array |
| `src/i18n/therapySchools/tr.ts` | Append spiritual school object to array |
| `src/i18n/therapySchools/zh.ts` | Append spiritual school object to array |
| `src/i18n/therapySchools/es.ts` | Append spiritual school object to array |
| `src/i18n/therapySchools/pt.ts` | Append spiritual school object to array |
| `src/i18n/therapySchools/de.ts` | Append spiritual school object to array |
| `src/i18n/therapySchools/fr.ts` | Append spiritual school object to array |
| `src/i18n/therapySchools/ja.ts` | Append spiritual school object to array |

**No changes needed**: SchoolsPage.tsx, OnboardingPage, SchoolSelectionStep, promptBuilder.ts, therapySchools/index.ts — all use dynamic `getAllSchools()`.

## School Metadata

- **ID**: `"spiritual"`
- **English**: name="Spiritual Guidance (Contemplative Traditions)", shortName="Spiritual"
- **Turkish**: name="Ruhani Rehberlik (Tefekkur Gelenekleri)", shortName="Ruhani"

## promptInstructions Structure (~200 lines, matching stoic school format)

### 1. Role and Identity
- Experienced guide rooted in contemplative spiritual traditions
- Sources: Eckhart Tolle, Buddha, Zen (Shunryu Suzuki, Thich Nhat Hanh), Advaita Vedanta (Ramana Maharshi), Sufi (Rumi), contemplative Christianity (Meister Eckhart)
- Stance: calm, spacious, deeply present — experiential rather than analytical
- Goal: not to fix/cure, but to point toward the client's own deeper nature — awareness itself

### 2. Core Theoretical Framework
- **Presence and the Power of Now** — present moment as only reality, Tolle's teachings
- **Nature of Suffering (Four Noble Truths)** — dukkha, craving/clinging, pain vs suffering, pain-body concept
- **Ego and the Constructed Self** — anatta, awareness behind thoughts, Advaita "I am the witness"
- **Non-Attachment and Impermanence (Anicca)** — freedom from clinging, Rumi/Zen teachings
- **Compassion and Interconnectedness (Karuna/Metta)** — interbeing, self-compassion, loving-kindness
- **Direct Experience Beyond Thought (Prajna/Satori)** — beginner's mind, "Who am I?" inquiry

### 3. Therapeutic Techniques (8)
1. Present-Moment Awareness Practice (body/breath anchoring)
2. Observing the Thinker (disidentification from thought)
3. Pain-Body Inquiry (Tolle's framework)
4. Acceptance and Surrender (Wu Wei)
5. Self-Inquiry / Atma Vichara (Ramana Maharshi)
6. Loving-Kindness / Metta Practice
7. Contemplation of Koans and Wisdom Teachings
8. Gratitude and Sacred Ordinary

### 4. In-Session Stance
- Spacious Presence (silence as teacher)
- Pointing Rather Than Teaching
- Gentle Directness
- Meeting the Client Where They Are
- Embodying the Teaching

### 5. Clinical Situations
- Anxiety/Fear — bring to present, body scan
- Anger/Resentment — ego defense, forgiveness practice
- Grief/Loss — honor fully, impermanence, sit in silence
- Low Self-Worth — disidentify from ego stories, metta inward
- Existential Crisis — "dark night of the soul", sit in not-knowing

### 6. Communication Style
- Calm, unhurried warmth; simple language; nature metaphors
- One insight per response; questions that turn attention inward
- Wisdom quotes as seeds, not lectures; non-dogmatic, universal

### 7. Ethical Boundaries
- Same safety protocol as all other schools (crisis -> professional help, no diagnosis, no medication)
- Not a guru; spiritual teachings are offerings, not impositions

## Implementation Order

1. Add `"spiritual"` to `BUILTIN_IDS` in `useSchoolsStore.ts`
2. Write full English school definition in `en.ts`
3. Write full Turkish school definition in `tr.ts`
4. Write remaining 6 language versions (zh, es, pt, de, fr, ja)

## Differentiation from Existing Schools

| Aspect | Spiritual | ACT | Stoic |
|---|---|---|---|
| Mindfulness source | Buddhist/Zen, for awakening | Clinical technique in hexaflex | Not core |
| Suffering cause | Ego identification | Experiential avoidance | False judgments |
| Goal | Presence, inner peace, awakening | Psychological flexibility | Virtue, rational tranquility |
| Language | Poetic, contemplative, spacious | Experiential, pragmatic | Dignified, philosophical |

## Verification

1. Run `npm run dev` / `npm run build` — no TypeScript errors
2. SchoolsPage: verify "Spiritual" appears in school list with "Built-in" badge
3. Onboarding: verify school appears in manual selection list
4. Recommendation: verify "Find Ideal School" includes spiritual in its options
5. Select spiritual school -> start a chat -> verify prompt instructions are applied correctly
