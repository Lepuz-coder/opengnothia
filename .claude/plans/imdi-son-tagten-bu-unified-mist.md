# Release v1.4.0 — README Refresh, Version Bump, GitHub Tag

## Context

Son yayınlanan tag `v1.3.0`, ancak sürüm dosyaları (`package.json`, `tauri.conf.json`, `Cargo.toml`) hâlâ `1.2.0`'da — tag çıkılırken sürüm dosyaları güncellenmemiş. Bu tag'ten beri 10 commit birikmiş: klinik intake form sihirbazı, in-session insights paneli, dashboard yeniden tasarımı, AI-önerili seans sonu, Opus 4.7 / GPT-5.4 model eklemeleri, README screenshot tazeleme, vb. Ek olarak working tree'de scrollbar temasıyla ilgili uncommitted değişiklikler var (`ChatInput.tsx` + `styles.css`).

README'nin sürüm rozetinde hâlâ `1.0.5` yazıyor (3 release geride) ve yeni özelliklerin hiçbiri Features bölümünde yok. Hedef: tüm yeni değişiklikleri GitHub'a pushlamak, README'yi güncel tutmak ve `v1.4.0` tag'ini kesmek. `.github/workflows/release.yml` tag push olduğunda otomatik olarak macOS/Linux/Windows build'lerini yapıp GitHub release oluşturacak — yani tag push CI'yı tetikleyecek.

## Değişiklikler

### 1. WIP dosyaları commit et

Working tree'deki iki dosya tag'e dahil edilecek:

- `src/components/chat/ChatInput.tsx` — textarea'ya `scrollbar-thin` sınıfı ekleniyor.
- `src/styles.css` — global temalı scrollbar kuralları (WebKit + Firefox `scrollbar-width`/`scrollbar-color`, tüm scrollable elementler için).

Önerilen commit mesajı:

```
Add global themed thin scrollbars

Apply subtle surface-700 scrollbars to html/body/div/textarea/pre/etc.
on both WebKit and Firefox so every scrollable area matches the dark
theme instead of the OS default.
```

### 2. Sürüm numaralarını `1.4.0`'a yükselt

3 dosyada tek satır değişiklik:

- [package.json:4](package.json#L4) — `"version": "1.2.0"` → `"1.4.0"`
- [src-tauri/tauri.conf.json:4](src-tauri/tauri.conf.json#L4) — `"version": "1.2.0"` → `"1.4.0"`
- [src-tauri/Cargo.toml:3](src-tauri/Cargo.toml#L3) — `version = "1.2.0"` → `version = "1.4.0"`

(Not: `v1.3.0` tag'i zaten çakışık olduğundan 1.3.0'a geri dönmek mümkün değil — 1.4.0 sürüm dosyalarıyla tag numarasını hizalayan tek temiz seçenek.)

### 3. README rozet + Features güncelle

**Rozet** — [README.md:10](README.md#L10):

```
[![Version](https://img.shields.io/badge/version-1.0.5-green.svg)...
```
→ `version-1.4.0`

**Features bölümü** — [README.md:81-117](README.md#L81):

#### 3a. Yeni alt başlıklar ekle (Journal altına ve AI Therapy Sessions güncellemesinden sonra)

- **Clinical Intake Form** — "Optional 10-question wizard captures your background (history, goals, current stressors) with auto-save. The intake is injected as context into every AI session so therapy feels continuous from the first message." Journal başlığından hemen önce veya AI Therapy Sessions bloğunun hemen altına yerleştir.

- **In-Session Insights Panel** — "Capture observations mid-session without breaking flow. Your own notes and AI-proposed insights appear in a side panel; accept the ones that resonate and they're saved to your insights library." AI-Generated Insights başlığından hemen önce.

- **Redesigned Dashboard** — "A hero session card surfaces your current or next session, ritual cards track journal and dream streaks, and an icon-based mood slider lets you log a check-in without leaving the home screen." Features bölümünün başına (ilk başlık olarak) koy — dashboard ilk açılan ekran olduğu için mantıklı bir giriş.

- **AI Therapy Sessions** bloğunu hafifçe güncelle: "automatic summaries" → "opt-in AI summaries and session-closure proposals" (seans sonu marker'ı ve opt-in generate butonlarını yansıtmak için).

#### 3b. Model listesini tazele — [README.md:104-108](README.md#L104):

```
- **Anthropic Claude** — Opus, Sonnet, and Haiku families (with extended thinking support)
- **OpenAI** — GPT-5 series, GPT-4.1, GPT-4o families
```
→
```
- **Anthropic Claude** — Opus 4.7, Sonnet 4.6, Haiku 4.5 (with extended thinking / adaptive budget)
- **OpenAI** — GPT-5.4 (+ Mini, Pro), GPT-5.3, GPT-4.1, GPT-4o families
```

Önerilen commit mesajı (sürüm bump + README birlikte):

```
Bump version to 1.4.0 and refresh README features

Align package.json, tauri.conf.json, and Cargo.toml to 1.4.0 after
v1.3.0 tag. Update README version badge and document new features
since v1.3.0: clinical intake form, in-session insights panel,
redesigned dashboard, refreshed AI model list.
```

### 4. Tag oluştur ve push et

```bash
git push origin master                          # 3 yeni commit (screenshot refresh + scrollbar + version bump)
git tag -a v1.4.0 -m "Release v1.4.0"
git push origin v1.4.0                          # CI workflow'u tetikler
```

`release.yml` workflow'u macOS universal + Ubuntu + Windows build'lerini çalıştıracak ve release body'siyle birlikte GitHub Release oluşturacak.

## Kritik dosyalar

- [package.json](package.json) — sürüm
- [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) — sürüm
- [src-tauri/Cargo.toml](src-tauri/Cargo.toml) — sürüm
- [README.md](README.md) — rozet + Features
- [src/components/chat/ChatInput.tsx](src/components/chat/ChatInput.tsx) — WIP scrollbar
- [src/styles.css](src/styles.css) — WIP scrollbar
- [.github/workflows/release.yml](.github/workflows/release.yml) — tag push'ta tetikleniyor (değişmiyor, sadece referans)

## Doğrulama

1. `git tag --list` → `v1.4.0` listede olmalı.
2. `git log origin/master..HEAD` → push öncesi yeni 3 commit görünmeli, push sonrası boş olmalı.
3. `grep "1.4.0" package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml` → 3 eşleşme.
4. `grep "version-1.4.0" README.md` → 1 eşleşme.
5. GitHub Actions: `gh run list --workflow=release.yml --limit 1` ile tetiklenen run'ı takip et, "completed success" olmasını bekle (macOS build'i ~15 dk sürebilir).
6. Release sayfası: `gh release view v1.4.0` veya `https://github.com/Lepuz-coder/opengnothia/releases/tag/v1.4.0` — üç platform için asset (.dmg, .AppImage, .msi / .exe) görünmeli.

## Kapsam dışı

- `.claude/plans/*.md` (untracked) — repo'ya dahil edilmeyecek.
- `CHANGELOG.md` — henüz yok, bu PR'da oluşturmuyoruz; release body'si `release.yml`'nin default metnini kullanacak.
- Manifest lock (`pnpm-lock.yaml`, `Cargo.lock`) — sürüm değişikliği mevcut deps'i etkilemediği için elle regen gerekmez; `pnpm install` / `cargo build` bir sonraki çalışmada auto-update eder.
