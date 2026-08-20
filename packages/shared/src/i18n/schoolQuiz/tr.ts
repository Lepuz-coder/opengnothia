import type { SchoolQuizTexts } from "./index";

export const trSchoolQuiz: SchoolQuizTexts = {
  title: "Sana Uygun Yaklaşım",
  intro:
    "Birkaç soruyla sana en uygun terapi yaklaşımını bulalım. Doğru ya da yanlış cevap yok — içinden geleni seç.",
  progress: "Soru {current}/{total}",
  resultTitle: "Sana önerdiğimiz yaklaşım",
  resultWhyTitle: "Neden bu yaklaşım?",
  retakeButton: "Anketi yeniden çöz",
  takeButton: "Anketi çöz",
  noSchoolLabel: "Henüz seçilmedi",
  questions: {
    hardDay: {
      text: "Zor bir gün geçirdiğinde içinden ilk ne gelir?",
      options: {
        analyze: "Oturup ne olduğunu adım adım çözümlemek",
        lookBack: "Bu hissin bana neyi hatırlattığını düşünmek",
        turnInward: "Durup nefes almak, içime dönmek",
        control: "“Şu an elimde olan ne?” diye sormak",
        depends: "Duruma göre değişir — bazen biri, bazen öbürü",
      },
    },
    rootCause: {
      text: "Bugünkü zorluklarının kaynağı sence daha çok nerede?",
      options: {
        thoughts: "Düşünce alışkanlıklarımda — olaylara yüklediğim anlamlarda",
        past: "Geçmişimde — eski ilişkiler ve yaşantılar bugün hâlâ sahnede",
        childhood: "Çocuklukta öğrendiğim “ben buyum” kalıplarında",
        howToLive: "Kaynağı kurcalamaktan çok, zorluklarla nasıl yaşayacağımı bulmakta",
      },
    },
    hardEmotion: {
      text: "Zorlayıcı bir duygu geldiğinde onunla ne yapmak istersin?",
      options: {
        test: "Onu tetikleyen düşünceyi bulup sınamak",
        carry: "Onunla savaşmadan yanımda taşımayı öğrenmek",
        calm: "Sükûnetle karşılamak — dalgada sarsılmamak",
        underneath: "Derinde neyin kıpırdadığını anlamak",
        refuge: "Nefese, duaya ya da sessizliğe sığınmak",
      },
    },
    missing: {
      text: "Şu sıralar hayatında en çok neyin eksikliğini hissediyorsun?",
      options: {
        quietMind: "Zihnimin susması — dönüp duran düşüncelerden bir mola",
        meaning: "Yaptıklarımın bir anlam taşıdığı hissi",
        selfPeace: "Kendimle barışmak — eski yaraların sesinin kısılması",
        balance: "Kolay sarsılmayan bir iç denge",
      },
    },
    guide: {
      text: "Sana eşlik edecek rehber nasıl biri olsun isterdin?",
      options: {
        structured: "Somut araçlar ve küçük denemeler öneren, yapılandırılmış biri",
        digger: "Derin sorular soran, hikâyemi birlikte kazıyan biri",
        sage: "Bilge ve sakin — oturmuş bir hayat felsefesi olan biri",
        flexible: "O an neye ihtiyacım varsa onu kullanan, esnek biri",
        accepting: "Beni olduğum gibi kabul eden, değerlerim yönünde yüreklendiren biri",
      },
    },
    faith: {
      text: "Maneviyat ya da inanç hayatında nasıl bir yer tutuyor?",
      options: {
        central: "Merkezî bir yerde — iç dünyamın ana dillerinden biri",
        sometimes: "Ara sıra döndüğüm, bana iyi gelen bir kaynak",
        notReally: "Pek yer tutmuyor — bana daha somut, dünyevi bir dil iyi geliyor",
        bigQuestions: "İnançtan bağımsız; hayatın büyük soruları zihnimi çok meşgul ediyor",
      },
    },
    changeStyle: {
      text: "Bir şeyi değiştirmek istediğinde sana en doğal gelen yol hangisi?",
      options: {
        experiment: "Küçük denemeler yapıp sonuca bakmak",
        resistance: "Önce içimde neyin direndiğini anlamak",
        values: "Benim için önemli olanı netleştirip küçük adımlarla o yöne yürümek",
        tryPaths: "Farklı yollar denemek; işe yaramayanı bırakıp yenisine geçmek",
      },
    },
    familiar: {
      text: "Hangi cümle sana en tanıdık geliyor?",
      options: {
        worstCase: "“Zihnim hep en kötü senaryoya koşuyor.”",
        notEnough: "“Ne yaparsam yapayım içimde ‘yetersizim’ diyen bir ses var.”",
        emptiness: "“Her şey yolunda görünüyor ama içimde bir boşluk var.”",
        samePlay: "“Farklı insanlarla hep aynı hikâyeyi yaşıyorum.”",
        uncontrollable: "“Elimde olmayan şeyler beni çok yoruyor.”",
      },
    },
    bestMoments: {
      text: "Kendini en iyi hissettiğin anlarda genellikle ne var?",
      options: {
        clarity: "Bir sorunu çözmüşüm, kafam netleşmiş",
        serving: "Kendimden büyük bir şeye katkıda bulunuyorum",
        presence: "Doğayla, sessizlikle ya da içimle temas hâlindeyim",
        livedValues: "Sonucu ne olursa olsun, benim için önemli olana zaman ayırmışım",
        composure: "Fırtınanın ortasında bile kendime hâkim kalabilmişim",
      },
    },
    innerCritic: {
      text: "İçindeki eleştirel ses (“yetmedi”, “hata yaptın”) seninle nasıl konuşur?",
      options: {
        oldVoice: "Çok sert — ve tonu eskilerden, bana hiç yabancı olmayan bir yerden geliyor",
        reason: "Sesi çıkıyor ama kanıt gösterince yumuşuyor",
        defuse: "Onu “bir düşünce” olarak görüp mesafe alabiliyorum",
        external: "İç sesimden çok, beni asıl yoran dış dünyanın gürültüsü",
      },
    },
  },
  reasons: {
    integrative:
      "Cevapların tek bir yönteme değil, duruma göre değişen ihtiyaçlara işaret ediyor. Entegre yaklaşım, farklı ekollerin araçlarını tek ve tutarlı bir eşlikçide birleştirir — esnekliğe değer verenler için biçilmiş kaftan.",
    psychodynamic:
      "Cevaplarında bugünü anlamak için geçmişe ve tekrar eden örüntülere bakma eğilimi belirgin. Psikodinamik yaklaşım tam bunu yapar: ilişki kalıplarının ve eski yaşantıların bugünkü izini birlikte sürer.",
    cbt: "Cevapların düşüncelerle çalışmaya — anlamak, sınamak, düzenlemek — yatkın olduğunu gösteriyor. BDT sana somut araçlar ve küçük denemelerle düşünce-duygu döngülerini dönüştürmeyi öğretir.",
    logotherapy:
      "Cevaplarında anlam arayışı öne çıkıyor: boşluk hissi, büyük sorular, bir şeye hizmet etme isteği. Logoterapi tam bu damarda çalışır — acıyı bile anlamla taşınabilir kılmayı hedefler.",
    act: "Cevapların duygularla savaşmak yerine onlara yer açıp değerlerin yönünde yürümeye yatkın olduğunu gösteriyor. ACT bu esnekliği sistemli biçimde geliştirir: kabul, mesafe alma ve değer odaklı küçük adımlar.",
    schema:
      "Cevaplarında çocukluktan gelen “ben buyum” kalıpları ve tanıdık bir iç eleştirmen izi var. Şema terapi bu eski kalıpları tanıyıp köklerine inerek dönüştürmeye odaklanır.",
    stoic:
      "Cevaplarında elinde olanla olmayanı ayırma ve sarsılmaz bir iç denge arayışı öne çıkıyor. Stoacı danışmanlık bu kası çalıştırır: kontrol ayrımı, erdem pratiği ve sükûnet.",
    spiritual:
      "Cevaplarında içe dönüş, sessizlik ve maneviyat belirgin bir yer tutuyor. Ruhani rehberlik bu kaynağı merkeze alır — kendi geleneğin içinden mevcudiyet ve iç huzur pratikleriyle ilerlersin.",
  },
};
