# Dijital Detoks Kursu Ekleme Planı

## Context
Mevcut 5 kursa paralel olarak yeni bir "Dijital Detoks" kursu eklenmesi. Ekran bağımlılığı, sosyal medya döngüsü, dopamin tuzakları ve bilinçli teknoloji kullanımı odaklı. Aynı yapı: 24 adım, 7 blok.

---

## Kurs Tasarımı

**ID:** `digital_detox` | **Icon:** 📵 | **Adım:** 24 (7 blok)

**rolePrompt:** "a calm, tech-literate digital wellness coach who blends behavioral psychology, attention science, and practical digital minimalism. You treat technology as a powerful tool rather than an enemy, helping the student build a conscious and intentional relationship with screens. You validate the student's experience without shaming, explain dopamine and reward circuits in accessible language, and always offer concrete, actionable strategies. You use plain language, explain any technical term the first time it appears, and balance science with empathy"

### Adımlar (24)

**Blok 1: Dijital Bağımlılığı Anlamak (1-4)**
1. What Is Digital Addiction? — Understanding the Line Between Habit and Compulsion
2. The Dopamine Loop — How Your Brain Gets Hooked on Notifications and Novelty
3. The Slot Machine in Your Pocket — Why Screens Are Designed to Be Hard to Put Down
4. Your Digital Profile — Mapping Your Personal Screen Habits and Triggers

**Blok 2: Dikkat Ekonomisi (5-8)**
5. The Attention Economy — How Your Focus Became the Most Valuable Product
6. Infinite Scroll and Autoplay — The Design Tricks That Steal Your Time
7. Notification Psychology — Why That Red Badge Feels Impossible to Ignore
8. FOMO and the Urgency Illusion — Why You Feel You Must Check Right Now

**Blok 3: Sosyal Medya ve Ruh Sağlığı (9-12)**
9. The Comparison Trap — How Curated Feeds Distort Your Self-Image
10. Curated Reality — Understanding That What You See Is Not What Is
11. Likes, Comments, and Self-Worth — When Validation Comes from a Screen
12. Online vs. Real Connection — Why Five Hundred Friends Can Still Feel Lonely

**Blok 4: Bilişsel ve Duygusal Etkiler (13-16)**
13. The Shrinking Attention Span — How Constant Switching Fragments Your Focus
14. Deep Work and Flow States — Reclaiming the Ability to Think Without Interruption
15. Screens and Sleep — How Blue Light and Late-Night Scrolling Disrupt Your Rest
16. Always-On Anxiety — The Emotional Cost of Constant Connectivity

**Blok 5: Pratik Detoks Stratejileri (17-20)**
17. The Notification Audit — Taking Back Control of What Interrupts You
18. Phone-Free Zones — Creating Spaces Where Screens Do Not Belong
19. The Digital Sunset — Building an Evening Routine That Protects Your Sleep
20. The App Diet — Decluttering Your Devices and Simplifying Your Digital Life

**Blok 6: Bilinçli Dijital Yaşam İnşası (21-23)**
21. Intentional Use — Shifting from Reactive Scrolling to Purposeful Engagement
22. Digital Minimalism — Keeping Only the Technology That Truly Serves You
23. Real-World Replacements — Filling the Void with Activities That Nourish

**Blok 7: Entegrasyon (24)**
24. Your Digital Wellness Plan — Building a Sustainable Practice for a Balanced Life

### Highlights (6)
1. Understanding dopamine loops and digital addiction mechanics
2. Recognizing attention economy tricks and design manipulation
3. Social media's impact on self-worth and real connection
4. Cognitive effects: attention span, deep work, and sleep
5. Practical strategies: notification audit, phone-free zones, digital sunset
6. Building a sustainable, intentional relationship with technology

---

## Değiştirilecek Dosyalar (11)

### 1. `src/constants/courses.ts`
- `DIGITAL_DETOX` course definition ekle, `COURSES` dizisine ekle

### 2. `src/i18n/index.ts`
- 5 yeni alan: `digitalDetox`, `digitalDetoxDesc`, `digitalDetoxLongDesc`, `digitalDetoxHighlights`, `digitalDetoxSteps`

### 3-4. `src/i18n/en.ts`, `src/i18n/tr.ts` — İngilizce ve Türkçe çeviriler
### 5-10. `src/i18n/{zh,es,pt,de,fr,ja}.ts` — Diğer 6 dil

### 11. `src/constants/courseStepDescriptions.ts`
- `DIGITAL_DETOX_TEMPLATES` ekle (8 dil x 8 template)
- `COURSE_TEMPLATES` map'ine kaydet

---

## Doğrulama
- `npx tsc --noEmit` sıfır hata
- Kurslar sayfasında 6 kurs görünmeli
