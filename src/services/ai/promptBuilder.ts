import type { UserProfile, CheckIn, SessionSummary, TherapySchool } from "@/types";
import { getTherapySchool } from "@/constants/therapySchools";

export function buildSystemPrompt(params: {
  profile: UserProfile | null;
  todayCheckIn: CheckIn | null;
  lastSessionSummary: SessionSummary | null;
  therapySchool?: TherapySchool;
  recentTherapistNotes?: { session_id: string; started_at: string; notes: string[] }[];
}): string {
  const { profile, todayCheckIn, lastSessionSummary, therapySchool, recentTherapistNotes } = params;

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

  if (recentTherapistNotes && recentTherapistNotes.length > 0) {
    prompt += `\n\n--- Geçmiş Seans Notların (Terapist Olarak Kendin İçin Tuttuğun Notlar) ---`;
    prompt += `\nBu notlar önceki seanslarda senin tuttuğun klinik notlardır. Danışanla süreklilik sağlamak için bunları dikkate al:`;
    for (const entry of recentTherapistNotes) {
      const date = new Date(entry.started_at).toLocaleDateString("tr-TR");
      prompt += `\n\n[${date}]:`;
      for (const note of entry.notes) {
        prompt += `\n- ${note}`;
      }
    }
  }

  return prompt;
}

export function buildSummaryPrompt(): string {
  return `Yukarıdaki seans konuşmasını analiz et ve aşağıdaki JSON formatında bir özet oluştur. Sadece JSON döndür, başka bir şey yazma.

"therapist_notes" alanına, bir terapist olarak gelecek seanslarda hatırlamak isteyeceğin klinik notları yaz. Bunlar danışana gösterilmeyecek, sadece senin süreklilik sağlamak için kullanacağın notlar olacak. Örnekler: danışanın direnci, transfer dinamikleri, dikkat edilmesi gereken noktalar, takip edilecek konular.

{
  "themes": ["seansta işlenen ana temalar"],
  "defenses": ["gözlemlenen savunma mekanizmaları"],
  "insights": ["ortaya çıkan içgörüler"],
  "homework": ["danışana önerilen ödevler veya düşünce egzersizleri"],
  "therapist_notes": ["gelecek seanslar için terapist notları"]
}`;
}
