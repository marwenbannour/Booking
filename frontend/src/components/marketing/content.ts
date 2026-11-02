import type { Lang } from "@/lib/i18n";

/** Contenu bilingue (FR / AR) des pages marketing publiques Booking+. */
export interface MarketingContent {
  nav: { home: string; features: string; pricing: string; contact: string };
  cta: { login: string; signup: string };
  home: {
    badge: string;
    h1a: string;
    h1b: string;
    lede: string;
    cta1: string;
    cta2: string;
    trust: string[];
    logosLabel: string;
    advEyebrow: string;
    advH2: string;
    advP: string;
    adv: { title: string; text: string; points: string[] }[];
    stats: { value: string; label: string }[];
    ctaH2: string;
    ctaP: string;
    ctaBtn1: string;
    ctaBtn2: string;
  };
  features: {
    eyebrow: string;
    h2: string;
    p: string;
    splits: { eyebrow: string; title: string; text: string; points: string[] }[];
    moreH: string;
    more: { title: string; text: string }[];
  };
  pricing: {
    eyebrow: string;
    h2: string;
    p: string;
    perMonth: string;
    popular: string;
    choose: string;
    start: string;
    plans: { name: string; desc: string; price: string; features: { label: string; off?: boolean }[]; popular?: boolean }[];
    faqH: string;
    faq: { q: string; a: string }[];
  };
  contact: {
    eyebrow: string;
    h2: string;
    p: string;
    reach: string;
    email: string;
    whatsapp: string;
    address: string;
    addressValue: string;
    hours: string;
    hoursValue: string;
    formTitle: string;
    name: string;
    message: string;
    send: string;
    sent: string;
    faqH: string;
    faq: { q: string; a: string }[];
  };
  footer: {
    tagline: string;
    product: string;
    company: string;
    legal: string;
    terms: string;
    privacy: string;
    faq: string;
    rights: string;
  };
}

const FR: MarketingContent = {
  nav: { home: "Accueil", features: "Fonctionnalités", pricing: "Tarifs", contact: "Contact" },
  cta: { login: "Connexion", signup: "Commencer" },
  home: {
    badge: "Rappels WhatsApp automatiques",
    h1a: "Vos rendez-vous,",
    h1b: "gérés tout seuls.",
    lede: "Booking+ gère vos réservations, vos rappels et vos disponibilités 24/7. Vos clients réservent en ligne, vos rappels partent par WhatsApp, vous réduisez les absences.",
    cta1: "Créer mon établissement",
    cta2: "Se connecter",
    trust: ["14 jours gratuits", "Sans carte bancaire", "Annulable à tout moment"],
    logosLabel: "Adopté par les salons, cliniques et instituts en Tunisie",
    advEyebrow: "Pourquoi Booking+",
    advH2: "Tout ce qu'il faut pour remplir votre agenda",
    advP: "Trois piliers pour automatiser la prise de rendez-vous et vous concentrer sur votre métier.",
    adv: [
      { title: "Réservation 24/7", text: "Vos clients réservent en ligne à toute heure. Chaque créneau respecte vos disponibilités réelles — fini les doubles réservations.", points: ["Page de réservation à votre nom", "Choix du service et de l'employé"] },
      { title: "Rappels WhatsApp", text: "Confirmations et rappels automatiques par WhatsApp pour réduire les absences et les annulations de dernière minute.", points: ["Modèles personnalisables", "Programmation 24h / 2h avant"] },
      { title: "Pilotage & croissance", text: "Toute votre activité au même endroit : agenda, clients, revenus et statistiques pour mieux décider.", points: ["Tableau de bord temps réel", "Historique et fiches clients"] },
    ],
    stats: [
      { value: "−38%", label: "d'absences en moyenne" },
      { value: "24/7", label: "de réservations possibles" },
      { value: "+28%", label: "de rendez-vous confirmés" },
      { value: "5 min", label: "pour tout configurer" },
    ],
    ctaH2: "Plus de rendez-vous. Moins de gestion.",
    ctaP: "Lancez votre page de réservation en quelques minutes et laissez WhatsApp s'occuper des rappels.",
    ctaBtn1: "Démarrer gratuitement",
    ctaBtn2: "Voir les tarifs",
  },
  features: {
    eyebrow: "Fonctionnalités",
    h2: "Une plateforme complète de réservation",
    p: "De la prise de rendez-vous en ligne jusqu'au rappel WhatsApp et aux statistiques.",
    splits: [
      { eyebrow: "Réservation en ligne", title: "Un agenda qui se remplit tout seul", text: "Partagez votre page de réservation. Vos clients choisissent le service, l'employé et le créneau — en temps réel, selon vos disponibilités.", points: ["Disponibilités, pauses et congés respectés", "Durée et tarif par service", "Confirmation instantanée"] },
      { eyebrow: "Rappels WhatsApp", title: "Des rappels qui réduisent les absences", text: "Confirmations, rappels et relances partent automatiquement via WhatsApp Business. Personnalisez chaque modèle et programmez l'envoi.", points: ["Modèles FR / AR réutilisables", "Envoi 24h et 2h avant le RDV", "Historique des messages envoyés"] },
      { eyebrow: "Tableau de bord", title: "Vos chiffres clés, en un coup d'œil", text: "Suivez vos rendez-vous, votre chiffre d'affaires et votre taux de confirmation. Pilotez la charge de chaque membre de l'équipe.", points: ["KPI temps réel et graphiques", "Répartition par service et par employé", "Export et rapports"] },
    ],
    moreH: "Et bien plus encore",
    more: [
      { title: "Gestion d'équipe", text: "Employés, services affectés, horaires et rôles pour toute votre équipe." },
      { title: "Disponibilités", text: "Horaires d'ouverture, pauses et congés configurables par employé." },
      { title: "Multi-langue", text: "Interface et messages en français et en arabe (RTL)." },
      { title: "Multi-établissement", text: "Gérez plusieurs établissements avec des données isolées et sécurisées." },
      { title: "Abonnements", text: "Plans, quotas et facturation gérés depuis votre espace." },
      { title: "Sécurité & RGPD", text: "Données chiffrées, isolées par organisation et conformes aux bonnes pratiques." },
    ],
  },
  pricing: {
    eyebrow: "Tarifs",
    h2: "Des formules adaptées à chaque établissement",
    p: "Sans engagement. 14 jours d'essai gratuit sur toutes les formules.",
    perMonth: "DT / mois",
    popular: "Le plus populaire",
    choose: "Choisir Pro",
    start: "Commencer",
    plans: [
      { name: "Starter", desc: "Pour se lancer en solo ou en petite équipe.", price: "29", features: [{ label: "1 établissement" }, { label: "Jusqu'à 3 employés" }, { label: "Réservation en ligne" }, { label: "200 rappels WhatsApp / mois" }, { label: "Statistiques avancées", off: true }] },
      { name: "Pro", desc: "Le choix des établissements en croissance.", price: "59", popular: true, features: [{ label: "1 établissement" }, { label: "Jusqu'à 10 employés" }, { label: "Rappels WhatsApp illimités" }, { label: "Statistiques avancées" }, { label: "Support prioritaire" }] },
      { name: "Business", desc: "Pour les réseaux et multi-établissements.", price: "99", features: [{ label: "Établissements multiples" }, { label: "Employés illimités" }, { label: "Tout le plan Pro" }, { label: "Rôles & permissions avancés" }, { label: "Accompagnement dédié" }] },
    ],
    faqH: "Questions sur les tarifs",
    faq: [
      { q: "Puis-je changer de formule à tout moment ?", a: "Oui. Vous pouvez passer d'une formule à l'autre à tout moment depuis votre espace ; la facturation est ajustée au prorata." },
      { q: "Les rappels WhatsApp sont-ils inclus ?", a: "Oui. Starter inclut 200 rappels par mois, Pro et Business les proposent en illimité." },
      { q: "Y a-t-il un engagement ?", a: "Aucun engagement. Vous êtes libre d'annuler votre abonnement quand vous le souhaitez." },
    ],
  },
  contact: {
    eyebrow: "Assistance",
    h2: "Contact & questions fréquentes",
    p: "Une question avant de vous lancer ? Notre équipe répond en français et en arabe.",
    reach: "Nous contacter",
    email: "Email",
    whatsapp: "WhatsApp",
    address: "Adresse",
    addressValue: "Rue du Lac, Les Berges du Lac, Tunis",
    hours: "Horaires",
    hoursValue: "Lun — Ven · 9h00 à 18h00",
    formTitle: "Envoyez-nous un message",
    name: "Nom complet",
    message: "Message",
    send: "Envoyer",
    sent: "Message envoyé ✓ Nous vous répondons sous 24h.",
    faqH: "Questions fréquentes",
    faq: [
      { q: "Comment mes clients réservent-ils ?", a: "Vous recevez une page de réservation à votre nom. Vos clients y choisissent le service, l'employé puis le créneau, et reçoivent une confirmation immédiate." },
      { q: "Ai-je besoin d'un compte WhatsApp Business ?", a: "Booking+ s'appuie sur l'API WhatsApp Business pour envoyer les rappels. Nous vous accompagnons lors de la configuration." },
      { q: "Puis-je gérer plusieurs établissements ?", a: "Oui, avec la formule Business. Chaque établissement a ses propres employés, services et données, totalement isolés." },
      { q: "Mes données sont-elles sécurisées ?", a: "Vos données sont chiffrées, isolées par organisation et traitées conformément aux bonnes pratiques de sécurité et au RGPD." },
    ],
  },
  footer: {
    tagline: "La plateforme de réservation et de rappels WhatsApp pour les établissements de services en Tunisie.",
    product: "Produit",
    company: "Entreprise",
    legal: "Légal",
    terms: "Conditions d'utilisation",
    privacy: "Confidentialité",
    faq: "FAQ",
    rights: "Tous droits réservés.",
  },
};

const AR: MarketingContent = {
  nav: { home: "الرئيسية", features: "المزايا", pricing: "الأسعار", contact: "اتصل بنا" },
  cta: { login: "تسجيل الدخول", signup: "ابدأ الآن" },
  home: {
    badge: "تذكيرات واتساب تلقائية",
    h1a: "مواعيدك،",
    h1b: "تُدار تلقائيًا.",
    lede: "يدير Booking+ حجوزاتك وتذكيراتك وأوقات توفّرك على مدار الساعة. يحجز عملاؤك عبر الإنترنت وتنطلق التذكيرات عبر واتساب فتقلّ حالات الغياب.",
    cta1: "أنشئ مؤسستي",
    cta2: "تسجيل الدخول",
    trust: ["14 يومًا مجانًا", "بدون بطاقة بنكية", "يمكن الإلغاء في أي وقت"],
    logosLabel: "تعتمده الصالونات والعيادات والمعاهد في تونس",
    advEyebrow: "لماذا Booking+",
    advH2: "كل ما تحتاجه لملء أجندتك",
    advP: "ثلاث ركائز لأتمتة حجز المواعيد والتفرّغ لمهنتك.",
    adv: [
      { title: "حجز على مدار الساعة", text: "يحجز عملاؤك عبر الإنترنت في أي وقت، مع احترام أوقات توفّرك الفعلية — لا مزيد من الحجوزات المزدوجة.", points: ["صفحة حجز باسمك", "اختيار الخدمة والموظف"] },
      { title: "تذكيرات واتساب", text: "تأكيدات وتذكيرات تلقائية عبر واتساب لتقليل الغياب والإلغاء في آخر لحظة.", points: ["قوالب قابلة للتخصيص", "جدولة قبل 24 ساعة / ساعتين"] },
      { title: "القيادة والنمو", text: "كل نشاطك في مكان واحد: الأجندة والعملاء والإيرادات والإحصائيات لاتخاذ قرارات أفضل.", points: ["لوحة تحكم فورية", "سجل وبطاقات العملاء"] },
    ],
    stats: [
      { value: "−38%", label: "انخفاض في الغياب" },
      { value: "24/7", label: "إمكانية الحجز" },
      { value: "+28%", label: "مواعيد مؤكدة" },
      { value: "5 دقائق", label: "لإعداد كل شيء" },
    ],
    ctaH2: "مواعيد أكثر. إدارة أقل.",
    ctaP: "أطلق صفحة الحجز خلال دقائق ودع واتساب يتكفّل بالتذكيرات.",
    ctaBtn1: "ابدأ مجانًا",
    ctaBtn2: "شاهد الأسعار",
  },
  features: {
    eyebrow: "المزايا",
    h2: "منصة حجز متكاملة",
    p: "من حجز المواعيد عبر الإنترنت إلى تذكيرات واتساب والإحصائيات.",
    splits: [
      { eyebrow: "الحجز عبر الإنترنت", title: "أجندة تمتلئ تلقائيًا", text: "شارك صفحة الحجز الخاصة بك. يختار عملاؤك الخدمة والموظف والموعد في الوقت الفعلي وفق أوقات توفّرك.", points: ["احترام أوقات التوفّر والاستراحات والعطل", "مدة وسعر لكل خدمة", "تأكيد فوري"] },
      { eyebrow: "تذكيرات واتساب", title: "تذكيرات تقلّل الغياب", text: "تنطلق التأكيدات والتذكيرات تلقائيًا عبر واتساب للأعمال. خصّص كل قالب واجدول الإرسال.", points: ["قوالب فرنسية / عربية قابلة لإعادة الاستخدام", "إرسال قبل 24 ساعة وساعتين من الموعد", "سجل الرسائل المُرسلة"] },
      { eyebrow: "لوحة التحكم", title: "أرقامك الأساسية بنظرة واحدة", text: "تابع مواعيدك ورقم أعمالك ونسبة التأكيد، وأدِر حمل كل عضو في الفريق.", points: ["مؤشرات ورسوم فورية", "توزيع حسب الخدمة والموظف", "تصدير وتقارير"] },
    ],
    moreH: "والمزيد أيضًا",
    more: [
      { title: "إدارة الفريق", text: "الموظفون والخدمات المخصّصة والأوقات والأدوار لكامل فريقك." },
      { title: "أوقات التوفّر", text: "ساعات العمل والاستراحات والعطل قابلة للضبط لكل موظف." },
      { title: "متعدد اللغات", text: "الواجهة والرسائل بالفرنسية والعربية (من اليمين لليسار)." },
      { title: "متعدد المؤسسات", text: "أدِر عدة مؤسسات ببيانات معزولة وآمنة." },
      { title: "الاشتراكات", text: "الخطط والحصص والفوترة من مساحتك." },
      { title: "الأمان وحماية البيانات", text: "بيانات مشفّرة ومعزولة حسب المؤسسة ومتوافقة مع أفضل الممارسات." },
    ],
  },
  pricing: {
    eyebrow: "الأسعار",
    h2: "صيغ مناسبة لكل مؤسسة",
    p: "بدون التزام. 14 يومًا تجربة مجانية على كل الصيغ.",
    perMonth: "دينار / شهر",
    popular: "الأكثر رواجًا",
    choose: "اختر Pro",
    start: "ابدأ",
    plans: [
      { name: "Starter", desc: "للانطلاق منفردًا أو ضمن فريق صغير.", price: "29", features: [{ label: "مؤسسة واحدة" }, { label: "حتى 3 موظفين" }, { label: "حجز عبر الإنترنت" }, { label: "200 تذكير واتساب / شهر" }, { label: "إحصائيات متقدمة", off: true }] },
      { name: "Pro", desc: "خيار المؤسسات النامية.", price: "59", popular: true, features: [{ label: "مؤسسة واحدة" }, { label: "حتى 10 موظفين" }, { label: "تذكيرات واتساب غير محدودة" }, { label: "إحصائيات متقدمة" }, { label: "دعم ذو أولوية" }] },
      { name: "Business", desc: "للشبكات والمؤسسات المتعددة.", price: "99", features: [{ label: "مؤسسات متعددة" }, { label: "موظفون غير محدودين" }, { label: "كل مزايا Pro" }, { label: "أدوار وصلاحيات متقدمة" }, { label: "مرافقة مخصّصة" }] },
    ],
    faqH: "أسئلة حول الأسعار",
    faq: [
      { q: "هل يمكنني تغيير الصيغة في أي وقت؟", a: "نعم، يمكنك الانتقال بين الصيغ في أي وقت من مساحتك، وتُعدّل الفوترة تناسبيًا." },
      { q: "هل تذكيرات واتساب مشمولة؟", a: "نعم. تشمل Starter 200 تذكير شهريًا، وتوفّرها Pro و Business بلا حدود." },
      { q: "هل هناك التزام؟", a: "لا يوجد أي التزام. يمكنك إلغاء اشتراكك متى شئت." },
    ],
  },
  contact: {
    eyebrow: "الدعم",
    h2: "اتصل بنا والأسئلة الشائعة",
    p: "سؤال قبل البدء؟ فريقنا يجيب بالفرنسية والعربية.",
    reach: "تواصل معنا",
    email: "البريد الإلكتروني",
    whatsapp: "واتساب",
    address: "العنوان",
    addressValue: "نهج البحيرة، ضفاف البحيرة، تونس",
    hours: "الأوقات",
    hoursValue: "الإثنين — الجمعة · من 9:00 إلى 18:00",
    formTitle: "أرسل لنا رسالة",
    name: "الاسم الكامل",
    message: "الرسالة",
    send: "إرسال",
    sent: "تم إرسال الرسالة ✓ سنردّ خلال 24 ساعة.",
    faqH: "الأسئلة الشائعة",
    faq: [
      { q: "كيف يحجز عملائي؟", a: "تحصل على صفحة حجز باسمك. يختار عملاؤك الخدمة والموظف ثم الموعد ويتلقّون تأكيدًا فوريًا." },
      { q: "هل أحتاج حساب واتساب للأعمال؟", a: "يعتمد Booking+ على واجهة واتساب للأعمال لإرسال التذكيرات، ونرافقك في الإعداد." },
      { q: "هل يمكنني إدارة عدة مؤسسات؟", a: "نعم، مع صيغة Business. لكل مؤسسة موظفوها وخدماتها وبياناتها المعزولة تمامًا." },
      { q: "هل بياناتي آمنة؟", a: "بياناتك مشفّرة ومعزولة حسب المؤسسة وتُعالَج وفق أفضل ممارسات الأمان وحماية البيانات." },
    ],
  },
  footer: {
    tagline: "منصة الحجز وتذكيرات واتساب لمؤسسات الخدمات في تونس.",
    product: "المنتج",
    company: "الشركة",
    legal: "قانوني",
    terms: "شروط الاستخدام",
    privacy: "الخصوصية",
    faq: "الأسئلة الشائعة",
    rights: "كل الحقوق محفوظة.",
  },
};

const DICTS: Record<Lang, MarketingContent> = { fr: FR, ar: AR };

export function getMarketing(lang: Lang): MarketingContent {
  return DICTS[lang] ?? FR;
}
