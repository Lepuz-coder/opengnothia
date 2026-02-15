import type { UserProfile, CheckIn, SessionSummary, TherapySchool } from "@/types";
import { getTherapySchool } from "@/constants/therapySchools";

export function buildSystemPrompt(params: {
  profile: UserProfile | null;
  todayCheckIn: CheckIn | null;
  lastSessionSummary: SessionSummary | null;
  therapySchool?: TherapySchool;
  patientNotes?: string;
}): string {
  const { profile, todayCheckIn, lastSessionSummary, therapySchool, patientNotes } = params;

  let prompt = `Sen OpenGnothia'nın yapay zeka destekli psikolojik destek asistanısın. Türkçe konuşuyorsun.

Temel ilkeler:
- Empatik, sıcak ve yargılamayan bir yaklaşım sergile
- Danışanın duygularını yansıt ve doğrula
- Açık uçlu sorular sor
- Gerektiğinde nazikçe yüzleştir
- Profesyonel sınırları koru — sen bir terapist değilsin, bir destek aracısın
- Kriz durumlarında profesyonel yardım almayı öner
- Yanıtlarını kısa ve öz tut, paragraflar halinde konuş`;

  if (therapySchool) {
    const school = getTherapySchool(therapySchool);
    if (school) {
      prompt += `\n\n--- Terapi Ekolü ---\n${school.promptInstructions}`;
    }
  }

  if (profile) {
    prompt += `\n\nDanışan bilgileri:`;
    if (profile.name) prompt += `\n- İsim: ${profile.name}`;
    if (profile.age) prompt += `\n- Yaş: ${profile.age}`;
    if (profile.gender) prompt += `\n- Cinsiyet: ${profile.gender}`;
    if (profile.occupation) prompt += `\n- Meslek/Okul: ${profile.occupation}`;
    if (profile.goals.length > 0) prompt += `\n- Hedefler: ${profile.goals.join(", ")}`;
    prompt += `\n- Tercih edilen yaklaşım: ${
      profile.approach === "practical" ? "Pratik ve çözüm odaklı" :
      profile.approach === "depth" ? "Derinlikli ve keşif odaklı" :
      "Dengeli"
    }`;
  }

  if (todayCheckIn) {
    prompt += `\n\nBugünkü check-in:`;
    prompt += `\n- Ruh hali: ${todayCheckIn.mood}/10`;
    prompt += `\n- Enerji: ${todayCheckIn.energy}/10`;
    prompt += `\n- Uyku: ${todayCheckIn.sleep}/5`;
    if (todayCheckIn.had_dream && todayCheckIn.dream_note) {
      prompt += `\n- Rüya: ${todayCheckIn.dream_note}`;
    }
    if (todayCheckIn.tags.length > 0) {
      prompt += `\n- Etiketler: ${todayCheckIn.tags.join(", ")}`;
    }
  }

  if (lastSessionSummary) {
    prompt += `\n\nSon seans özeti:`;
    if (lastSessionSummary.themes.length > 0) prompt += `\n- Temalar: ${lastSessionSummary.themes.join(", ")}`;
    if (lastSessionSummary.insights.length > 0) prompt += `\n- İçgörüler: ${lastSessionSummary.insights.join(", ")}`;
    if (lastSessionSummary.homework.length > 0) prompt += `\n- Ödev: ${lastSessionSummary.homework.join(", ")}`;
  }

  if (patientNotes && patientNotes.trim().length > 0) {
    prompt += `\n\n--- Kümülatif Hasta Notları (Terapist Olarak Kendin İçin Tuttuğun Notlar) ---`;
    prompt += `\nBu notlar önceki seanslarda senin tuttuğun klinik notlardır. Danışanla süreklilik sağlamak için bunları dikkate al:`;
    prompt += `\n${patientNotes}`;
  }

  return prompt;
}

export function buildGreetingPrompt(params: {
  profile: UserProfile | null;
  todayCheckIn: CheckIn | null;
  lastSessionSummary: SessionSummary | null;
  therapySchool?: TherapySchool;
  patientNotes?: string;
}): string {
  let prompt = buildSystemPrompt(params);

  prompt += `\n\n--- Seans Açılışı ---
Bu seansın ilk mesajını sen gönderiyorsun. Danışanı sıcak ve kısa bir şekilde selamla.
Eğer hasta notların varsa, önceki seanslardaki konulara veya ödevlere kısaca atıfta bulunabilirsin.
ÖNEMLİ: Check-in verilerini (ruh hali puanı, enerji puanı, uyku puanı gibi sayısal değerleri) danışana söyleme. Bu veriler sadece senin arka plan bilgin olarak kullan — konuşmanın tonunu ve yaklaşımını buna göre ayarla ama skorları açıkça belirtme.
Uzun olma — 2-3 cümle ile başla ve danışanı konuşmaya davet et.`;

  return prompt;
}

export function buildRecommendationPrompt(): string {
  return `Yukarıdaki seans konuşmasını değerlendir ve danışana yönelik sıcak, destekleyici bir öneri yaz.

Kurallar:
- Markdown formatında yaz (başlıklar, kalın metin, listeler vb. kullanabilirsin)
- Danışana doğrudan hitap et ("sen" dili kullan)
- Seansın ana temasına atıfta bulun
- Somut ve uygulanabilir bir öneri veya düşünce pratiği öner
- Sıcak, motive edici ve umut verici bir ton kullan
- Terapist jargonu kullanma, anlaşılır ol
- Türkçe yaz`;
}

export function buildPatientNotesUpdatePrompt(existingNotes: string): string {
  return `Sen deneyimli bir klinik psikologsun. Aşağıda danışanla ilgili mevcut kümülatif notların var. Bu seans konuşmasını analiz ederek notları güncelle.

${existingNotes ? `--- Mevcut Notlar ---\n${existingNotes}\n\n` : ""}--- Görevin ---
Mevcut notları bu seansın bilgileriyle birleştirerek güncel bir kümülatif not belgesi oluştur. Şunları içermeli:
- Danışanın genel profili ve temel konuları
- Önemli isimler, ilişkiler, olaylar
- Tekrarlayan temalar ve örüntüler
- Dirençli olduğu alanlar
- Verilen ödevler ve takip edilecek konular
- Kriz riski veya dikkat edilmesi gereken durumlar
- Bu seanstaki yeni bilgiler ve gelişmeler

Önemli: Sadece güncellenmiş notları yaz, başka açıklama ekleme. Notlar düzenli ve okunabilir olsun. Türkçe yaz.`;
}

export function buildSummaryPrompt(): string {
  return `Yukarıdaki seans konuşmasını analiz et ve aşağıdaki JSON formatında bir özet oluştur. Sadece JSON döndür, başka bir şey yazma.

{
  "themes": ["seansta işlenen ana temalar"],
  "defenses": ["gözlemlenen savunma mekanizmaları"],
  "insights": ["ortaya çıkan içgörüler"],
  "homework": ["danışana önerilen ödevler veya düşünce egzersizleri"]
}`;
}
