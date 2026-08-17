# Mac'te chat scrollbar görünümünü düzeltme

## Context

Mac'te (Safari/Chrome/Edge) seans ekranında iki ayrı yerde scrollbar görüntüsü kötü:

1. **Chat mesaj listesi** (sağdaki dikey scrollbar) — `src/components/chat/ChatContainer.tsx:25`'deki kapsayıcıya `scrollbar-thin` class'ı zaten uygulanmış, fakat `src/styles.css:66-69`'daki `.scrollbar-thin` tanımı yalnızca Firefox'un desteklediği `scrollbar-width` / `scrollbar-color` özelliklerini içeriyor. WebKit tarayıcıları bu özellikleri yok sayıp varsayılan sistem scrollbar'ını gösterdiği için, koyu temanın üstünde açık gri / beyaz sistem çubuğu görünüyor.
2. **Chat input textarea'sı** — `src/components/chat/ChatInput.tsx:185-194`'deki textarea max 120px boyuna ulaşınca scroll'a geçiyor (line 120), ancak üzerinde hiçbir scrollbar class'ı yok. Dolayısıyla Mac'te brüt varsayılan scrollbar gözüküyor.

Amaç: Mevcut `.scrollbar-thin` utility'sine WebKit pseudo-element stilleri eklemek ve input textarea'sına aynı class'ı uygulamak. Böylece hem chat listesi hem input aynı ince, tema ile uyumlu, hover'da hafifçe belirginleşen scrollbar'ı kullanır ve uygulamadaki diğer 14+ scrollable alan da otomatik yararlanır.

## Yapılacak Değişiklikler

### 1. `src/styles.css` — `.scrollbar-thin` utility'sini genişlet

Mevcut tanımın (satır 66-69) yerine aşağıdaki hâli koy:

```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--color-surface-600) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: var(--color-surface-700);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: var(--color-surface-600);
}

.scrollbar-thin::-webkit-scrollbar-corner {
  background: transparent;
}
```

Notlar:
- `border: 2px solid transparent` + `background-clip: padding-box` hilesi, thumb'ı 4px görünecek şekilde küçültüp çevresine hafif padding koyar — modern, yumuşak bir his verir.
- Renkler mevcut palette'ten: thumb default `--color-surface-700 (#243556)`, hover `--color-surface-600 (#3F5378)` — koyu tema üzerinde zar zor görünür, scroll ederken belirginleşir.
- Firefox kuralları aynen kaldı, o platformda da aynı görünüm korunuyor.

### 2. `src/components/chat/ChatInput.tsx:193` — textarea'ya `scrollbar-thin` ekle

Textarea'nın mevcut className satırını:

```tsx
className="flex-1 resize-none bg-transparent px-4 py-3 pr-20 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:opacity-50"
```

şuna güncelle:

```tsx
className="scrollbar-thin flex-1 resize-none bg-transparent px-4 py-3 pr-20 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:opacity-50"
```

Sadece class listesinin başına `scrollbar-thin` eklemek yeterli.

## Kritik dosyalar

- [src/styles.css:66-69](src/styles.css:66) — utility genişletmesi
- [src/components/chat/ChatInput.tsx:193](src/components/chat/ChatInput.tsx:193) — textarea class'ı
- [src/components/chat/ChatContainer.tsx:25](src/components/chat/ChatContainer.tsx:25) — dokunmuyoruz, zaten `scrollbar-thin` uygulanmış

## Neden daha global bir `* { scrollbar }` değil?

Proje zaten `scrollbar-thin` utility'sini bilinçli olarak belirli scrollable'lara uyguluyor (15 dosyada kullanılıyor). Global `*::-webkit-scrollbar` override'ı browser kontrollerini (ör. `<select>` dropdown'ları, iframe içerikleri) da etkileyebilir. Utility'yi genişletmek daha öngörülebilir ve mevcut mimariye saygılı.

## Doğrulama

1. `pnpm dev` ile dev server'ı başlat.
2. Seans sayfasına gir, chat'te yeterince mesaj olsun ki sağ scrollbar görünür olsun — scrollbar'ın ince, koyu-gri, transparan bir track ile göründüğünü doğrula; hover'da thumb rengi açılmalı.
3. Input'a çok satırlı metin yapıştır (ör. ekrandaki uzun cevap gibi) — textarea 120px'te scroll'a geçiyor, scrollbar aynı ince stilde olmalı, default beyaz sistem çubuğu olmamalı.
4. Sidebar, geçmiş seanslar listesi, analizler sayfası gibi `scrollbar-thin` kullanan diğer alanlarda da tutarlılığı göz ile doğrula.
5. Firefox'ta da açıp (varsa) mevcut ince scrollbar görünümünün bozulmadığını kontrol et.
