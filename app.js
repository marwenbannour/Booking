const iconPaths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5h6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1ZM8 10h8M8 14h8M8 18h5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z"/>',
  chart: '<path d="M3 3v18h18M18 17V9M13 17V5M8 17v-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m7 10 5 5 5-5"/>',
  arrowLeft: '<path d="m15 18-6-6 6-6"/>',
  arrowRight: '<path d="m9 18 6-6-6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  location: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8.1 8.1 12.8 12.8M14.8 9.2 20 4M8.1 15.9l3.9-3.9"/>',
  spark: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3ZM19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z"/>',
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  x: '<path d="m18 6-12 12M6 6l12 12"/>',
  external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
};

const translations = {
  fr: {
    dashboard: "Vue d'ensemble", calendar: "Calendrier", appointments: "Rendez-vous", customers: "Clients", messages: "Messages", reports: "Statistiques", settings: "Paramètres",
    today: "Aujourd'hui", todayDate: "Mardi 28 octobre 2026", greeting: "Bonjour, Amira 👋", greetingSub: "Voici ce qui se passe dans votre établissement aujourd'hui.",
    newBooking: "Nouveau rendez-vous", export: "Exporter", thisWeek: "Cette semaine", appointmentsToday: "Rendez-vous aujourd'hui", upcoming: "À venir", completed: "Terminés", cancellations: "Annulations",
    vsYesterday: "vs hier", confirmed: "Confirmé", pending: "En attente", done: "Terminé", occupancy: "Taux d'occupation", weeklyBookings: "Réservations de la semaine", weekDescription: "Activité de votre établissement", appointmentsByDay: "Réservations", completedLabel: "Terminés",
    todaysSchedule: "Planning du jour", scheduleSubtitle: "Vos prochains rendez-vous", seeAll: "Tout voir", newClient: "Nouveau client", booked: "a réservé", minutesAgo: "min", plan: "Plan Pro", remindersUsed: "Rappels WhatsApp utilisés", upgrade: "Gérer le plan",
    dashboardCrumb: "Espace professionnel", all: "Tous", allStaff: "Toute l'équipe", week: "Semaine", day: "Jour", month: "Mois", previousWeek: "Semaine précédente", nextWeek: "Semaine suivante",
    appointmentListTitle: "Tous les rendez-vous", appointmentListSub: "Suivez et gérez les réservations de votre établissement.", searchPlaceholder: "Rechercher un client ou un service…", filter: "Filtrer", client: "Client", service: "Prestation", dateTime: "Date & heure", teamMember: "Collaborateur", status: "Statut", action: "Action",
    bookingFlow: "Réservation en ligne", backOffice: "Espace professionnel", reserveIntro: "Choisissez votre prestation, votre créneau, et le tour est joué.", chooseService: "Choisissez une prestation", chooseServiceSub: "Sélectionnez le service qui vous convient.", teamTitle: "Choisissez votre spécialiste", teamSub: "Sélectionnez une personne ou laissez-nous choisir pour vous.", anyone: "Aucune préférence",
    chooseDate: "Choisissez une date", chooseTime: "Choisissez un horaire", yourDetails: "Vos coordonnées", yourDetailsSub: "Nous vous enverrons la confirmation et le rappel de votre rendez-vous.", firstName: "Prénom et nom", phone: "Numéro de téléphone", email: "Adresse e-mail", consent: "J'accepte les conditions d'annulation et souhaite recevoir les rappels liés à mon rendez-vous par WhatsApp.",
    continue: "Continuer", back: "Retour", confirmBooking: "Confirmer le rendez-vous", summary: "Récapitulatif", duration: "Durée", date: "Date", time: "Horaire", specialist: "Spécialiste", total: "Total à régler sur place", cancellationNote: "Annulation gratuite jusqu'à 24 h avant votre rendez-vous.", secureNote: "Vos informations restent confidentielles.",
    signIn: "Se connecter", signOut: "Se déconnecter", signInTitle: "Connexion à l’espace professionnel", signInSub: "Connectez-vous pour gérer les rendez-vous de votre établissement.", identifier: "E-mail ou téléphone", password: "Mot de passe", loginFailed: "Connexion impossible. Vérifiez vos identifiants.", noEstablishmentAccess: "Aucun établissement actif n’est associé à ce compte.", liveAppointments: "Rendez-vous chargés depuis votre espace.", refresh: "Actualiser", rejected: "Refusé", noShow: "Absent", viewNotConnected: "Cette vue reste en mode prototype pour le moment.",
    bookingSuccess: "C'est réservé !", successSub: "Votre rendez-vous est confirmé. Vous recevrez un rappel WhatsApp avant votre visite.", reference: "Référence de réservation", backToDashboard: "Retour à l'espace pro", chooseDifferent: "Choisir un autre créneau", services: "Services", locationTunis: "La Marsa, Tunis", rating: "4,9 · 128 avis", days: ["Mar","Mer","Jeu","Ven","Sam","Dim","Lun"],
    barber: "Coupe classique", fade: "Coupe dégradée", beard: "Taille de barbe", combo: "Coupe + barbe", barberDesc: "Coupe aux ciseaux, finition soignée", fadeDesc: "Dégradé précis, style sur mesure", beardDesc: "Contours nets et serviette chaude", comboDesc: "Le rituel complet Atelier 17", shopSlogan: "Des coupes soignées, du style et la bonne humeur.", barberShop: "Barbershop",
    amira: "Amira Ben Salem", yassine: "Yassine Trabelsi", nour: "Nour Gharbi", next: "Suivant", viewBooking: "Page de réservation", clientsInMonth: "depuis le mois dernier", appointmentsLabel: "rendez-vous", clientsLabel: "clients", loading: "Chargement…", noAppointments: "Aucun rendez-vous trouvé.", addAppointment: "Ajouter un rendez-vous", quickAdd: "Rendez-vous ajouté au planning.", chooseServiceFirst: "Choisissez une prestation pour continuer.", chooseTimeFirst: "Choisissez une date et un horaire.", fillContact: "Renseignez votre nom et votre numéro de téléphone.", chooseNotification: "Sélectionnez votre choix pour les rappels.", saved: "Rendez-vous enregistré dans cette maquette.", confirmedToast: "Votre rendez-vous est confirmé !", notificationDemo: "Vous avez 2 nouveaux rappels à traiter.", apiUnavailable: "Le service de réservation est indisponible.", noServices: "Aucune prestation n’est disponible pour le moment.", noSlots: "Aucun créneau disponible pour cette date.", loadingSlots: "Recherche des créneaux disponibles…", bookingFailed: "La réservation n’a pas pu être confirmée.", connectApi: "Vérifiez que l’API est démarrée et que l’établissement existe.",         appointmentInPast: "Choisissez une date à venir.", submitBooking: "Envoi de la réservation…", slotConflict: "Ce créneau vient d’être réservé. Choisissez-en un autre.", noEmployees: "Aucun spécialiste n’est disponible pour cette prestation.", invalidEmail: "Vérifiez le format de votre adresse e-mail.",
    newClients: "Nouveaux clients", notificationsSent: "Rappels envoyés", notificationsFailed: "Échecs", topServices: "Prestations les plus réservées", last7Days: "7 derniers jours", noData: "Aucune donnée pour cette période.",
    customersSub: "Recherchez et consultez vos clients et leur historique.", customersSearchPlaceholder: "Rechercher par nom ou téléphone…", noCustomers: "Aucun client trouvé.", loadMore: "Charger plus", backToList: "Retour à la liste", customerSince: "Client depuis le", history: "Historique des rendez-vous",
    messagesSub: "Suivez les notifications WhatsApp et réglez les rappels.", notifSettingsTitle: "Réglages des notifications", notifSettingsSub: "Activez les messages et définissez les délais de rappel.", whatsappEnabled: "Notifications WhatsApp activées", confirmationEnabled: "Envoyer la confirmation", cancellationEnabled: "Envoyer l’annulation", firstReminder: "1er rappel (min avant)", secondReminder: "2e rappel (min avant)", disabled: "Désactivé", reminderHint: "Laissez vide pour désactiver un rappel.", save: "Enregistrer", saved2: "Enregistré.", notifLogTitle: "Journal des notifications", notifLogSub: "Dernières notifications planifiées et envoyées.", event: "Événement", channel: "Canal", scheduled: "Planifié", attempts: "Tentatives", errorCol: "Erreur", noNotifications: "Aucune notification pour le moment.",
    settingsSub: "Gérez le profil de l’établissement et l’abonnement.", profileTitle: "Profil de l’établissement", slug: "Identifiant public", establishmentName: "Nom", timezone: "Fuseau horaire", descriptionLabel: "Description", addressLabel: "Adresse", defaultLang: "Langue par défaut", minNotice: "Préavis minimum (min)", maxDays: "Réservation à l’avance (jours)", cancelNotice: "Préavis d’annulation (h)", subscription: "Abonnement", planLabel: "Formule", noBillingAccess: "Accès facturation réservé au propriétaire.", implicitFree: "Gratuit (par défaut)", freePlan: "Gratuit", perMonth: "mois", perYear: "an", currentPlan: "Formule actuelle", choose: "Choisir", usageThisPeriod: "Consommation de la période", employees: "Employés", notificationsWord: "Notifications", availablePlans: "Formules disponibles", planUpdated: "Abonnement mis à jour.", actions: "Actions", confirmAction: "Confirmer", cancelAction: "Annuler", rejectAction: "Refuser", completeAction: "Terminer", noShowAction: "Absent", cancelReasonPrompt: "Motif de l’annulation ?", rejectReasonPrompt: "Motif du refus ?", reasonRequired: "Un motif est requis.", statusUpdated: "Statut mis à jour."
  },
  ar: {
    dashboard: "نظرة عامة", calendar: "التقويم", appointments: "المواعيد", customers: "العملاء", messages: "الرسائل", reports: "الإحصائيات", settings: "الإعدادات",
    today: "اليوم", todayDate: "الثلاثاء، 28 أكتوبر 2026", greeting: "مرحباً أميرة 👋", greetingSub: "إليك ملخص نشاط مؤسستك لهذا اليوم.",
    newBooking: "موعد جديد", export: "تصدير", thisWeek: "هذا الأسبوع", appointmentsToday: "مواعيد اليوم", upcoming: "القادمة", completed: "المكتملة", cancellations: "الإلغاءات",
    vsYesterday: "مقارنة بالأمس", confirmed: "مؤكد", pending: "قيد الانتظار", done: "مكتمل", occupancy: "نسبة الإشغال", weeklyBookings: "حجوزات الأسبوع", weekDescription: "نشاط مؤسستك", appointmentsByDay: "الحجوزات", completedLabel: "المكتملة",
    todaysSchedule: "جدول اليوم", scheduleSubtitle: "مواعيدك القادمة", seeAll: "عرض الكل", newClient: "عميل جديد", booked: "حجز", minutesAgo: "دقيقة", plan: "الخطة الاحترافية", remindersUsed: "تذكيرات واتساب المستخدمة", upgrade: "إدارة الخطة",
    dashboardCrumb: "مساحة العمل", all: "الكل", allStaff: "الفريق بالكامل", week: "أسبوع", day: "يوم", month: "شهر", previousWeek: "الأسبوع السابق", nextWeek: "الأسبوع التالي",
    appointmentListTitle: "جميع المواعيد", appointmentListSub: "تابع حجوزات مؤسستك وأدرها.", searchPlaceholder: "ابحث عن عميل أو خدمة…", filter: "تصفية", client: "العميل", service: "الخدمة", dateTime: "التاريخ والوقت", teamMember: "عضو الفريق", status: "الحالة", action: "إجراء",
    bookingFlow: "الحجز عبر الإنترنت", backOffice: "مساحة العمل", reserveIntro: "اختر خدمتك والموعد المناسب، وانتهى الأمر.", chooseService: "اختر الخدمة", chooseServiceSub: "حدد الخدمة المناسبة لك.", teamTitle: "اختر المختص", teamSub: "اختر شخصاً أو اترك لنا مهمة الاختيار.", anyone: "لا أفضلية",
    chooseDate: "اختر التاريخ", chooseTime: "اختر الوقت", yourDetails: "بياناتك", yourDetailsSub: "سنرسل إليك تأكيداً وتذكيراً بموعدك.", firstName: "الاسم الكامل", phone: "رقم الهاتف", email: "البريد الإلكتروني", consent: "أوافق على سياسة الإلغاء وأرغب في تلقي تذكيرات الموعد عبر واتساب.",
    continue: "متابعة", back: "رجوع", confirmBooking: "تأكيد الموعد", summary: "ملخص الحجز", duration: "المدة", date: "التاريخ", time: "الوقت", specialist: "المختص", total: "المبلغ عند الحضور", cancellationNote: "يمكنك الإلغاء مجاناً حتى 24 ساعة قبل الموعد.", secureNote: "بياناتك الشخصية محفوظة.",
    signIn: "تسجيل الدخول", signOut: "تسجيل الخروج", signInTitle: "تسجيل الدخول إلى مساحة العمل", signInSub: "سجل الدخول لإدارة مواعيد مؤسستك.", identifier: "البريد الإلكتروني أو الهاتف", password: "كلمة المرور", loginFailed: "تعذر تسجيل الدخول. تحقق من بياناتك.", noEstablishmentAccess: "لا توجد مؤسسة نشطة مرتبطة بهذا الحساب.", liveAppointments: "تم تحميل المواعيد من مساحة العمل.", refresh: "تحديث", rejected: "مرفوض", noShow: "لم يحضر", viewNotConnected: "هذه الواجهة لا تزال نموذجاً تجريبياً حالياً.",
    bookingSuccess: "تم الحجز بنجاح!", successSub: "تم تأكيد موعدك. سنرسل إليك تذكيراً عبر واتساب قبل زيارتك.", reference: "رقم الحجز", backToDashboard: "العودة إلى مساحة العمل", chooseDifferent: "اختيار موعد آخر", services: "الخدمات", locationTunis: "المرسى، تونس", rating: "4.9 · 128 تقييماً", days: ["ثلا","أرب","خمي","جمع","سبت","أحد","إثن"],
    barber: "قَصّة كلاسيكية", fade: "قَصّة متدرجة", beard: "تهذيب اللحية", combo: "قَصّة ولحية", barberDesc: "قَصّة بالمقص ولمسات نهائية أنيقة", fadeDesc: "تدرج دقيق وأسلوب يناسبك", beardDesc: "تحديد دقيق ومنشفة دافئة", comboDesc: "تجربة أتيليه 17 المتكاملة", shopSlogan: "أناقة، دقة، وأجواء مميزة.", barberShop: "صالون حلاقة",
    amira: "أميرة بن سالم", yassine: "ياسين الطرابلسي", nour: "نور الغربي", next: "التالي", viewBooking: "صفحة الحجز", clientsInMonth: "منذ الشهر الماضي", appointmentsLabel: "موعد", clientsLabel: "عميل", loading: "جار التحميل…", noAppointments: "لم يتم العثور على مواعيد.", addAppointment: "إضافة موعد", quickAdd: "تمت إضافة الموعد إلى الجدول.", chooseServiceFirst: "اختر خدمة للمتابعة.", chooseTimeFirst: "اختر التاريخ والوقت.", fillContact: "أدخل اسمك ورقم هاتفك.", chooseNotification: "حدد خيار التذكير.", saved: "تم حفظ الموعد في هذا النموذج التجريبي.", confirmedToast: "تم تأكيد موعدك!", notificationDemo: "لديك تذكيران جديدان.", apiUnavailable: "خدمة الحجز غير متاحة.", noServices: "لا توجد خدمات متاحة حالياً.", noSlots: "لا توجد مواعيد متاحة في هذا التاريخ.", loadingSlots: "جار البحث عن المواعيد المتاحة…", bookingFailed: "تعذر تأكيد الحجز.", connectApi: "تحقق من تشغيل واجهة API ومن وجود المؤسسة.",         appointmentInPast: "اختر تاريخاً قادماً.", submitBooking: "جار إرسال الحجز…", slotConflict: "تم حجز هذا الموعد للتو. اختر موعداً آخر.", noEmployees: "لا يوجد مختص متاح لهذه الخدمة.", invalidEmail: "تحقق من صيغة بريدك الإلكتروني.",
    newClients: "عملاء جدد", notificationsSent: "تذكيرات مُرسلة", notificationsFailed: "إخفاقات", topServices: "الخدمات الأكثر حجزاً", last7Days: "آخر 7 أيام", noData: "لا توجد بيانات لهذه الفترة.",
    customersSub: "ابحث عن عملائك واطّلع على سجلّهم.", customersSearchPlaceholder: "ابحث بالاسم أو الهاتف…", noCustomers: "لم يتم العثور على عملاء.", loadMore: "تحميل المزيد", backToList: "العودة إلى القائمة", customerSince: "عميل منذ", history: "سجل المواعيد",
    messagesSub: "تابع إشعارات واتساب واضبط التذكيرات.", notifSettingsTitle: "إعدادات الإشعارات", notifSettingsSub: "فعّل الرسائل وحدّد مواعيد التذكير.", whatsappEnabled: "إشعارات واتساب مفعّلة", confirmationEnabled: "إرسال التأكيد", cancellationEnabled: "إرسال الإلغاء", firstReminder: "التذكير الأول (دقيقة قبل)", secondReminder: "التذكير الثاني (دقيقة قبل)", disabled: "معطّل", reminderHint: "اتركه فارغاً لتعطيل التذكير.", save: "حفظ", saved2: "تم الحفظ.", notifLogTitle: "سجل الإشعارات", notifLogSub: "آخر الإشعارات المجدولة والمُرسلة.", event: "الحدث", channel: "القناة", scheduled: "مجدول", attempts: "المحاولات", errorCol: "خطأ", noNotifications: "لا توجد إشعارات حالياً.",
    settingsSub: "أدر ملف المؤسسة والاشتراك.", profileTitle: "ملف المؤسسة", slug: "المعرّف العام", establishmentName: "الاسم", timezone: "المنطقة الزمنية", descriptionLabel: "الوصف", addressLabel: "العنوان", defaultLang: "اللغة الافتراضية", minNotice: "أدنى مهلة (دقيقة)", maxDays: "الحجز المسبق (أيام)", cancelNotice: "مهلة الإلغاء (ساعة)", subscription: "الاشتراك", planLabel: "الباقة", noBillingAccess: "الوصول إلى الفوترة مخصّص للمالك.", implicitFree: "مجاني (افتراضي)", freePlan: "مجاني", perMonth: "شهر", perYear: "سنة", currentPlan: "الباقة الحالية", choose: "اختيار", usageThisPeriod: "استهلاك الفترة", employees: "الموظفون", notificationsWord: "الإشعارات", availablePlans: "الباقات المتاحة", planUpdated: "تم تحديث الاشتراك.", actions: "إجراءات", confirmAction: "تأكيد", cancelAction: "إلغاء", rejectAction: "رفض", completeAction: "إنهاء", noShowAction: "لم يحضر", cancelReasonPrompt: "سبب الإلغاء؟", rejectReasonPrompt: "سبب الرفض؟", reasonRequired: "السبب مطلوب.", statusUpdated: "تم تحديث الحالة."
  }
};

let services = [
  { id: "classic", name: "barber", description: "barberDesc", duration: 30, price: 35, icon: "scissors" },
  { id: "fade", name: "fade", description: "fadeDesc", duration: 40, price: 45, icon: "spark" },
  { id: "beard", name: "beard", description: "beardDesc", duration: 25, price: 25, icon: "scissors" },
  { id: "combo", name: "combo", description: "comboDesc", duration: 55, price: 55, icon: "spark" }
];
let team = [
  { id: "amira", name: "amira", initials: "AB", tone: "" },
  { id: "yassine", name: "yassine", initials: "YT", tone: "teal" },
  { id: "nour", name: "nour", initials: "NG", tone: "peach" }
];
const initialAppointments = [
  { id: "A17-2401", name: "Sami Khelifi", initials: "SK", tone: "", service: "Coupe classique", staff: "Amira Ben Salem", date: "28 oct.", time: "09:30", status: "confirmed", accent: "" },
  { id: "A17-2402", name: "Youssef Ben Ali", initials: "YB", tone: "teal", service: "Coupe + barbe", staff: "Yassine Trabelsi", date: "28 oct.", time: "10:30", status: "confirmed", accent: "teal" },
  { id: "A17-2403", name: "Mehdi Jaziri", initials: "MJ", tone: "peach", service: "Taille de barbe", staff: "Nour Gharbi", date: "28 oct.", time: "11:00", status: "pending", accent: "orange" },
  { id: "A17-2404", name: "Hatem Mansour", initials: "HM", tone: "lilac", service: "Coupe dégradée", staff: "Amira Ben Salem", date: "28 oct.", time: "13:30", status: "confirmed", accent: "" },
  { id: "A17-2405", name: "Walid Ben Yedder", initials: "WY", tone: "teal", service: "Coupe classique", staff: "Yassine Trabelsi", date: "28 oct.", time: "14:30", status: "confirmed", accent: "teal" },
  { id: "A17-2406", name: "Fares Gharbi", initials: "FG", tone: "peach", service: "Coupe + barbe", staff: "Nour Gharbi", date: "28 oct.", time: "16:00", status: "pending", accent: "orange" }
];

function dateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKeyInTimezone(timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDateKey(value, amount) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount, 12));
  return date.toISOString().slice(0, 10);
}

const bookingParams = new URLSearchParams(window.location.search);
function readProfessionalSession() {
  try {
    return JSON.parse(sessionStorage.getItem("booking-professional-session") || "null");
  } catch {
    sessionStorage.removeItem("booking-professional-session");
    return null;
  }
}
const state = {
  lang: "fr", view: "dashboard", mode: "professional", appointments: initialAppointments.slice(),
  booking: { step: 1, service: null, staff: "any", date: dateKey(), time: null, selectedSlot: null, name: "", phone: "", email: "", consent: false, success: false, loadingData: false, loadingSlots: false, submitting: false, error: "", slots: [] },
  establishment: null, currency: "TND", establishmentSlug: bookingParams.get("slug") || "atelier-17",
  professionalSession: readProfessionalSession(), professionalUser: null, establishmentId: bookingParams.get("establishmentId") || "", liveProfessional: false, appointmentsLoading: false, loginError: "", loginLoading: false,
  dashboard: null, dashboardReport: null, dashboardLoading: false, dashboardError: "",
  customers: { query: "", items: [], nextCursor: null, loading: false, loaded: false, error: "", selectedId: null, detail: null, bookings: [], bookingsNextCursor: null, detailLoading: false, detailError: "" },
  notifications: { items: [], total: 0, loading: false, loaded: false, error: "", settings: null, settingsError: "", settingsSaving: false, settingsMsg: "" },
  settings: { profile: null, loading: false, loaded: false, error: "", saving: false, savedMsg: "", subscription: null, plans: [], subError: "", planBusy: "" },
  calendar: { items: [], loading: false, loadedOffset: null, error: "" },
  filters: { query: "", status: "all" }, calendarOffset: 0, calendarMode: "week", modalOpen: false
};
let customerSearchTimer = null;
const t = key => translations[state.lang][key] || key;
const icon = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || ""}</svg>`;
const safe = value => String(value).replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
const statusLabel = status => ({ confirmed:t("confirmed"), pending:t("pending"), completed:t("done"), cancelled:t("cancellations"), rejected:t("rejected"), no_show:t("noShow") })[status] || t("confirmed");
const localizeService = value => {
  const service = services.find(item => [translations.fr[item.name], translations.ar[item.name]].includes(value));
  return service ? t(service.name) : value;
};
const localizeStaff = value => {
  const member = team.find(item => [translations.fr[item.name], translations.ar[item.name]].includes(value));
  return member ? t(member.name) : value;
};
const bookingDateLabel = value => {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(state.lang === "ar" ? "ar-TN" : "fr-TN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, day, 12));
};
const bookingTimeLabel = value => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat(state.lang === "ar" ? "ar-TN" : "fr-TN", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: state.establishment?.timezone || undefined
    }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleTimeString(state.lang === "ar" ? "ar-TN" : "fr-TN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
};
const localizeDate = value => state.lang==="ar" ? value.replace("oct.","أكتوبر").replace("nov.","نوفمبر") : value.replace("أكتوبر","oct.").replace("نوفمبر","nov.");
function persistProfessionalSession(tokens) {
  state.professionalSession={accessToken:tokens.accessToken,refreshToken:tokens.refreshToken};
  sessionStorage.setItem("booking-professional-session",JSON.stringify(state.professionalSession));
}
function clearProfessionalSession() {
  state.professionalSession=null;
  state.professionalUser=null;
  state.liveProfessional=false;
  state.establishmentId="";
  state.appointments=[];
  state.dashboard=null;
  state.dashboardReport=null;
  state.dashboardError="";
  state.customers={ query:"", items:[], nextCursor:null, loading:false, loaded:false, error:"", selectedId:null, detail:null, bookings:[], bookingsNextCursor:null, detailLoading:false, detailError:"" };
  state.notifications={ items:[], total:0, loading:false, loaded:false, error:"", settings:null, settingsError:"", settingsSaving:false, settingsMsg:"" };
  state.settings={ profile:null, loading:false, loaded:false, error:"", saving:false, savedMsg:"", subscription:null, plans:[], subError:"", planBusy:"" };
  state.calendar={ items:[], loading:false, loadedOffset:null, error:"" };
  state.calendarOffset=0;
  sessionStorage.removeItem("booking-professional-session");
}
function refreshProfessionalTokens(tokens) {
  persistProfessionalSession(tokens);
}
async function loadProfessionalProfile() {
  const session=state.professionalSession;
  if(!session?.accessToken) return null;
  const user=await window.BookingApi.getMe(
    session.accessToken,
    session.refreshToken,
    refreshProfessionalTokens
  );
  state.professionalUser=user;
  if(user.preferredLocale==="fr"||user.preferredLocale==="ar") state.lang=user.preferredLocale;
  const memberships=(user.memberships||[]).filter(item=>item.establishment?.status==="ACTIVE");
  const selected=memberships.find(item=>item.establishment.id===state.establishmentId)||memberships[0];
  if(!selected) {
    const error=new Error(t("noEstablishmentAccess"));
    error.code="NO_ESTABLISHMENT";
    throw error;
  }
  state.establishmentId=selected.establishment.id;
  state.establishmentSlug=selected.establishment.slug;
  state.establishment=await window.BookingApi.getEstablishment(state.establishmentSlug);
  state.liveProfessional=true;
  state.mode="professional";
  state.view="appointments";
  return user;
}
function mapApiBooking(booking) {
  const startsAt=new Date(booking.startsAt);
  const timeZone=state.establishment?.timezone||undefined;
  const status=({CONFIRMED:"confirmed",PENDING:"pending",COMPLETED:"completed",CANCELLED:"cancelled",REJECTED:"rejected",NO_SHOW:"no_show"})[booking.status]||"pending";
  const initials=(booking.customerNameSnapshot||booking.customer?.name||"").trim().split(/\s+/).slice(0,2).map(part=>part[0]||"").join("").toUpperCase();
  return {
    id:booking.publicReference||booking.id,
    bookingId:booking.id,
    name:booking.customerNameSnapshot||booking.customer?.name||"—",
    initials:initials||"?",
    tone:"lilac",
    service:booking.service?.name||"—",
    staff:booking.employee?.displayName||"—",
    date:new Intl.DateTimeFormat(state.lang==="ar"?"ar-TN":"fr-TN",{day:"numeric",month:"short",year:"numeric",timeZone}).format(startsAt),
    time:new Intl.DateTimeFormat(state.lang==="ar"?"ar-TN":"fr-TN",{hour:"2-digit",minute:"2-digit",timeZone}).format(startsAt),
    status,
    accent:""
  };
}
async function loadProfessionalBookings() {
  if(!state.liveProfessional||!state.professionalSession) return;
  state.appointmentsLoading=true;
  state.loginError="";
  render();
  try {
    const result=await window.BookingApi.getBookings(
      state.establishmentId,
      state.professionalSession.accessToken,
      state.professionalSession.refreshToken,
      refreshProfessionalTokens
    );
    state.appointments=(result.items||[]).map(mapApiBooking);
  } catch(error) {
    if(error.status===401) {
      clearProfessionalSession();
      state.mode="login";
      state.loginError=t("loginFailed");
    } else {
      state.loginError=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed");
    }
  } finally {
    state.appointmentsLoading=false;
    render();
  }
}
async function loadDashboard() {
  if(!state.liveProfessional||!state.professionalSession) return;
  state.dashboardLoading=true;
  state.dashboardError="";
  render();
  try {
    const session=state.professionalSession;
    const [summary,report]=await Promise.all([
      window.BookingApi.getDashboardSummary(state.establishmentId,session.accessToken,session.refreshToken,refreshProfessionalTokens),
      window.BookingApi.getBookingsReport(state.establishmentId,session.accessToken,session.refreshToken,refreshProfessionalTokens,{groupBy:"day"})
    ]);
    state.dashboard=summary;
    state.dashboardReport=report;
  } catch(error) {
    if(error.status===401) {
      clearProfessionalSession();
      state.mode="login";
      state.loginError=t("loginFailed");
    } else {
      state.dashboardError=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed");
    }
  } finally {
    state.dashboardLoading=false;
    render();
  }
}
function handleProfessionalAuthError(error) {
  if(error.status===401) {
    clearProfessionalSession();
    state.mode="login";
    state.loginError=t("loginFailed");
    return true;
  }
  return false;
}
async function loadCustomers({ reset = true } = {}) {
  if(!state.liveProfessional||!state.professionalSession) return;
  const c=state.customers;
  c.loading=true;
  c.error="";
  if(reset) { c.items=[]; c.nextCursor=null; }
  render();
  focusCustomerSearch();
  try {
    const session=state.professionalSession;
    const result=await window.BookingApi.getCustomers(
      state.establishmentId,session.accessToken,session.refreshToken,refreshProfessionalTokens,
      { q:c.query.trim()||undefined, cursor:reset?undefined:c.nextCursor||undefined, limit:25 }
    );
    c.items=reset?(result.items||[]):c.items.concat(result.items||[]);
    c.nextCursor=result.nextCursor||null;
    c.loaded=true;
  } catch(error) {
    if(!handleProfessionalAuthError(error)) c.error=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed");
  } finally {
    c.loading=false;
    render();
    focusCustomerSearch();
  }
}
async function loadCustomerDetail(customerId, { reset = true } = {}) {
  if(!state.liveProfessional||!state.professionalSession) return;
  const c=state.customers;
  c.selectedId=customerId;
  c.detailLoading=true;
  c.detailError="";
  if(reset) { c.detail=null; c.bookings=[]; c.bookingsNextCursor=null; }
  render();
  try {
    const session=state.professionalSession;
    const [detail,history]=await Promise.all([
      reset?window.BookingApi.getCustomer(state.establishmentId,customerId,session.accessToken,session.refreshToken,refreshProfessionalTokens):Promise.resolve(c.detail),
      window.BookingApi.getCustomerBookings(state.establishmentId,customerId,session.accessToken,session.refreshToken,refreshProfessionalTokens,{ cursor:reset?undefined:c.bookingsNextCursor||undefined, limit:20 })
    ]);
    c.detail=detail;
    c.bookings=reset?(history.items||[]):c.bookings.concat(history.items||[]);
    c.bookingsNextCursor=history.nextCursor||null;
  } catch(error) {
    if(!handleProfessionalAuthError(error)) c.detailError=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed");
  } finally {
    c.detailLoading=false;
    render();
  }
}
function focusCustomerSearch() {
  const el=document.querySelector("[data-customer-search]");
  if(el) { el.focus(); const n=el.value.length; try{el.setSelectionRange(n,n);}catch{} }
}
function session3() { const s=state.professionalSession; return [s.accessToken,s.refreshToken,refreshProfessionalTokens]; }
async function loadNotifications() {
  if(!state.liveProfessional||!state.professionalSession) return;
  const n=state.notifications;
  n.loading=true; n.error=""; n.settingsError="";
  render();
  try {
    const [list,settings]=await Promise.all([
      window.BookingApi.getNotifications(state.establishmentId,...session3(),{ limit:50 }),
      window.BookingApi.getNotificationSettings(state.establishmentId,...session3())
    ]);
    n.items=list.items||[]; n.total=list.total||0; n.settings=settings; n.loaded=true;
  } catch(error) {
    if(!handleProfessionalAuthError(error)) n.error=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed");
  } finally {
    n.loading=false; render();
  }
}
async function saveNotificationSettings(form) {
  if(!state.liveProfessional||state.notifications.settingsSaving) return;
  const n=state.notifications;
  const fd=new FormData(form);
  const num=v=>{ const s=String(fd.get(v)??"").trim(); return s===""?null:Number(s); };
  const body={
    whatsappEnabled: fd.get("whatsappEnabled")==="on",
    confirmationEnabled: fd.get("confirmationEnabled")==="on",
    cancellationEnabled: fd.get("cancellationEnabled")==="on",
    firstReminderMinutesBefore: num("firstReminderMinutesBefore"),
    secondReminderMinutesBefore: num("secondReminderMinutesBefore")
  };
  n.settingsSaving=true; n.settingsError=""; n.settingsMsg=""; render();
  try {
    n.settings=await window.BookingApi.updateNotificationSettings(state.establishmentId,...session3(),body);
    n.settingsMsg=t("saved2");
  } catch(error) {
    if(!handleProfessionalAuthError(error)) n.settingsError=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed");
  } finally {
    n.settingsSaving=false; render();
  }
}
async function loadSettings() {
  if(!state.liveProfessional||!state.professionalSession) return;
  const s=state.settings;
  s.loading=true; s.error=""; s.subError="";
  render();
  try {
    const [profile,sub,plans]=await Promise.all([
      window.BookingApi.getEstablishmentProfile(state.establishmentId,...session3()),
      window.BookingApi.getCurrentSubscription(state.establishmentId,...session3()).catch(e=>{ if(e.status===403){s.subError=t("noBillingAccess");return null;} throw e; }),
      window.BookingApi.getSubscriptionPlans(...session3()).catch(()=>({items:[]}))
    ]);
    s.profile=profile; s.subscription=sub; s.plans=(plans&&plans.items)||[]; s.loaded=true;
  } catch(error) {
    if(!handleProfessionalAuthError(error)) s.error=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed");
  } finally {
    s.loading=false; render();
  }
}
async function saveProfile(form) {
  if(!state.liveProfessional||state.settings.saving) return;
  const s=state.settings;
  const fd=new FormData(form);
  const str=k=>{ const v=fd.get(k); return v===null?undefined:String(v); };
  const int=k=>{ const v=String(fd.get(k)??"").trim(); return v===""?undefined:Number(v); };
  const body={ name:str("name"), description:str("description"), address:str("address"), timezone:str("timezone"), locale:str("locale"), minimumBookingNoticeMinutes:int("minimumBookingNoticeMinutes"), maximumBookingDays:int("maximumBookingDays"), cancellationNoticeHours:int("cancellationNoticeHours") };
  s.saving=true; s.error=""; s.savedMsg=""; render();
  try {
    s.profile=await window.BookingApi.updateEstablishmentProfile(state.establishmentId,...session3(),body);
    if(s.profile.locale==="fr"||s.profile.locale==="ar") state.lang=s.profile.locale;
    state.establishment={...(state.establishment||{}),...s.profile};
    s.savedMsg=t("saved2");
  } catch(error) {
    if(!handleProfessionalAuthError(error)) s.error=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed");
  } finally {
    s.saving=false; render();
  }
}
async function changePlan(planCode) {
  if(!state.liveProfessional||state.settings.planBusy) return;
  const s=state.settings;
  s.planBusy=planCode; s.subError=""; render();
  try {
    const hasSub=!!s.subscription?.subscription;
    if(hasSub) await window.BookingApi.changeSubscriptionPlan(state.establishmentId,...session3(),planCode);
    else await window.BookingApi.subscribePlan(state.establishmentId,...session3(),planCode);
    s.subscription=await window.BookingApi.getCurrentSubscription(state.establishmentId,...session3());
    showToast(t("planUpdated"));
  } catch(error) {
    if(!handleProfessionalAuthError(error)) { s.subError=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed"); showToast(s.subError); }
  } finally {
    s.planBusy=""; render();
  }
}
function calendarTz() { return state.establishment?.timezone || "Africa/Tunis"; }
function localYmd(date, tz) {
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
  const m=Object.fromEntries(p.map(x=>[x.type,x.value]));
  return `${m.year}-${m.month}-${m.day}`;
}
function weekInfo(offset) {
  const tz=calendarTz();
  const todayYmd=localYmd(new Date(),tz);
  const [y,m,d]=todayYmd.split("-").map(Number);
  const anchor=new Date(Date.UTC(y,m-1,d,12)+offset*7*86400000);
  const dow=anchor.getUTCDay();
  const mondayShift=(dow===0?-6:1-dow);
  const loc=state.lang==="ar"?"ar-TN":"fr-TN";
  const fmt=new Intl.DateTimeFormat(loc,{timeZone:"UTC",weekday:"short",day:"numeric"});
  const days=[];
  for(let i=0;i<7;i++){
    const dd=new Date(anchor.getTime()+(mondayShift+i)*86400000);
    days.push({ ymd:`${dd.getUTCFullYear()}-${String(dd.getUTCMonth()+1).padStart(2,"0")}-${String(dd.getUTCDate()).padStart(2,"0")}`, label:fmt.format(dd), isToday:false });
  }
  for(const day of days) day.isToday=day.ymd===todayYmd;
  return days;
}
async function loadCalendar() {
  if(!state.liveProfessional||!state.professionalSession) return;
  const c=state.calendar;
  const offset=state.calendarOffset;
  const days=weekInfo(offset);
  c.loading=true; c.error=""; render();
  try {
    const from=new Date(new Date(days[0].ymd+"T00:00:00Z").getTime()-24*3600*1000).toISOString();
    const to=new Date(new Date(days[6].ymd+"T00:00:00Z").getTime()+2*24*3600*1000).toISOString();
    const res=await window.BookingApi.getBookings(state.establishmentId,...session3(),{ from, to, limit:200 });
    c.items=res.items||[];
    c.loadedOffset=offset;
  } catch(error) {
    if(!handleProfessionalAuthError(error)) c.error=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed");
  } finally {
    c.loading=false; render();
  }
}
async function openProfessionalLogin() {
  state.loginError="";
  if(state.professionalSession?.accessToken) {
    try {
      await loadProfessionalProfile();
      await loadProfessionalBookings();
      return;
    } catch(error) {
      clearProfessionalSession();
      state.loginError=error.message||t("loginFailed");
    }
  }
  state.mode="login";
  render();
}
async function submitProfessionalLogin(form) {
  if(state.loginLoading) return;
  const formData=new FormData(form);
  const identifier=String(formData.get("identifier")||"").trim();
  const password=String(formData.get("password")||"");
  state.loginIdentifier=identifier;
  state.loginLoading=true;
  state.loginError="";
  render();
  try {
    const tokens=await window.BookingApi.login(identifier,password);
    persistProfessionalSession(tokens);
    await loadProfessionalProfile();
    await loadProfessionalBookings();
  } catch(error) {
    clearProfessionalSession();
    state.mode="login";
    state.loginError=error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.code==="NO_ESTABLISHMENT"?t("noEstablishmentAccess"):error.status===401?t("loginFailed"):error.message||t("loginFailed");
  } finally {
    state.loginLoading=false;
    render();
  }
}
async function logoutProfessional() {
  const session=state.professionalSession;
  try {
    if(session?.accessToken) await window.BookingApi.logout(session.accessToken,session.refreshToken,refreshProfessionalTokens);
  } catch(error) {
    showToast(error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed"));
  } finally {
    clearProfessionalSession();
    state.mode="login";
    state.loginError="";
    render();
  }
}

function render() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("rtl", state.lang === "ar");
  document.getElementById("app").innerHTML = state.mode === "booking" ? renderBooking() : state.mode === "login" ? renderLogin() : renderProfessional();
}

function renderLogin() {
  return `<div class="booking-mode"><header class="public-topbar"><div class="public-brand"><div class="brand-mark">${icon("calendar",18)}</div><strong>rendezvous.</strong></div><div class="public-actions"><button class="language-button" data-action="language">${state.lang==="fr"?"عربي":"FR"}</button><button class="quiet-button" data-action="back-prototype">${t("back")}</button></div></header><main class="public-body"><section class="booking-card login-card"><h1 class="booking-section-title">${t("signInTitle")}</h1><p class="booking-section-sub">${t("signInSub")}</p>${state.loginError?`<p class="booking-api-error" role="alert">${safe(state.loginError)}</p>`:""}<form id="professional-login-form"><div class="form-grid"><div class="field full"><label for="login-identifier">${t("identifier")}</label><input id="login-identifier" name="identifier" autocomplete="username" required value="${safe(state.loginIdentifier||"")}"></div><div class="field full"><label for="login-password">${t("password")}</label><input id="login-password" name="password" type="password" autocomplete="current-password" required></div></div><div class="booking-footer"><span></span><button class="primary-button" type="submit" ${state.loginLoading?"disabled":""}>${state.loginLoading?t("loading"):t("signIn")}</button></div></form></section></main></div>`;
}

function navItem(view, iconName, label, count = "") {
  return `<button class="nav-item ${state.view === view ? "active" : ""}" data-view="${view}">${icon(iconName)}<span>${label}</span>${count ? `<span class="nav-count">${count}</span>` : ""}</button>`;
}
function mobileNavItem(view, iconName, label) {
  return `<button class="mobile-nav-item ${state.view === view ? "active" : ""}" data-view="${view}">${icon(iconName)}<span>${label}</span></button>`;
}
function renderProfessional() {
  const isList = state.view === "appointments";
  const isCalendar = state.view === "calendar";
  const isCustomers = state.view === "customers" && state.liveProfessional;
  const isMessages = state.view === "messages" && state.liveProfessional;
  const isSettings = state.view === "settings" && state.liveProfessional;
  const memberLabel=state.professionalUser?.email||state.professionalUser?.phoneNormalized||t("amira");
  const memberInitials=memberLabel.split(/[@\s]/).slice(0,2).map(part=>part[0]||"").join("").toUpperCase();
  const establishmentLabel=state.establishment?.name||"Atelier 17";
  const heading = isCustomers ? t("customers") : isMessages ? t("messages") : isSettings ? t("settings") : isList ? t("appointmentListTitle") : isCalendar ? t("calendar") : t("greeting");
  const sub = isCustomers ? t("customersSub") : isMessages ? t("messagesSub") : isSettings ? t("settingsSub") : isList ? t("appointmentListSub") : isCalendar ? t("todayDate") : t("greetingSub");
  const showSummary = state.view === "dashboard";
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">${icon("calendar",21)}</div><div class="brand-name">rendez<span>vous</span>.</div></div>
      <div class="workspace-label">${t("dashboardCrumb")}</div>
      <nav class="nav-list" aria-label="${t("dashboardCrumb")}">
        ${navItem("dashboard","grid",t("dashboard"))}${navItem("calendar","calendar",t("calendar"))}${navItem("appointments","clipboard",t("appointments"),state.liveProfessional?String(state.appointments.length):"6")}${navItem("customers","users",t("customers"))}${navItem("messages","message",t("messages"),"2")}${navItem("reports","chart",t("reports"))}
      </nav>
      <div class="sidebar-bottom">
        <div class="workspace-label">${t("settings")}</div>
        <nav class="nav-list">${navItem("settings","settings",t("settings"))}</nav>
        ${state.liveProfessional?"":`<div class="plan-card"><div class="plan-top"><span>${t("plan")}</span><span class="plan-pill">PRO</span></div><p>124 / 200 ${t("remindersUsed").toLowerCase()}</p><div class="progress-track"><span></span></div><button class="quick-link" style="padding:10px 0 0">${t("upgrade")} ${icon("chevron",11)}</button></div>`}
        <div class="profile-mini"><div class="avatar">${safe(memberInitials||"AB")}</div><div class="profile-copy"><strong>${safe(memberLabel)}</strong><small>${safe(establishmentLabel)}</small></div>${icon("down",14)}</div>
      </div>
    </aside>
    <main class="main-panel">
      <header class="topbar">
        <div class="breadcrumb">${t("dashboardCrumb")} &nbsp; / &nbsp; <strong>${isCustomers ? t("customers") : isMessages ? t("messages") : isSettings ? t("settings") : isList ? t("appointments") : isCalendar ? t("calendar") : t("dashboard")}</strong></div>
        <div class="mobile-brand"><div class="brand-mark">${icon("calendar",17)}</div>rendezvous.</div>
        <div class="top-actions">
          <button class="language-button" data-action="language">${state.lang === "fr" ? "عربي" : "FR"}</button>
          <button class="icon-button" aria-label="${t("messages")}" data-action="notify">${icon("bell")}<span class="notification-dot"></span></button>
          <span class="top-divider"></span>
          <button class="primary-button" data-action="new-appointment">${icon("plus")}${t("newBooking")}</button>
          <button class="quiet-button" data-action="${state.liveProfessional?"professional-logout":"professional-login"}">${state.liveProfessional?t("signOut"):t("signIn")}</button>
        </div>
      </header>
      <div class="content">
        ${isCalendar ? renderCalendarHeading() : `<div class="page-heading"><div><div class="eyebrow">${t("todayDate")}</div><h1>${heading}</h1><p>${sub}</p></div><div class="heading-actions">${isList ? `<button class="quiet-button" data-action="export">${icon("external")}${t("export")}</button>` : ""}<button class="quiet-button" data-action="open-booking">${icon("external")}${t("viewBooking")}</button></div></div>`}
        ${showSummary ? renderDashboard() : isList ? renderAppointments() : isCalendar ? renderCalendar() : isCustomers ? renderCustomers() : isMessages ? renderMessages() : isSettings ? renderSettings() : renderPlaceholder()}
      </div>
      <nav class="mobile-bottom-nav" aria-label="${t("dashboardCrumb")}">${mobileNavItem("dashboard","grid",t("dashboard"))}${mobileNavItem("calendar","calendar",t("calendar"))}${mobileNavItem("appointments","clipboard",t("appointments"))}${mobileNavItem("customers","users",t("customers"))}${mobileNavItem("messages","message",t("messages"))}</nav>
    </main>
    ${state.modalOpen ? renderModal() : ""}
  </div>`;
}
function renderDashboard() {
  return state.liveProfessional ? renderLiveDashboard() : renderDashboardMock();
}
function renderDashboardMock() {
  const cards = [
    { title:t("appointmentsToday"), value:"12", note:`<span class="trend-up">↑ 18%</span> ${t("vsYesterday")}`, icon:"calendar", color:"" },
    { title:t("upcoming"), value:"08", note:`6 ${t("appointmentsLabel")} · 2 ${t("pending")}`, icon:"clock", color:"teal-bg" },
    { title:t("completed"), value:"04", note:`${t("clientsInMonth")}`, icon:"check", color:"orange-bg" },
    { title:t("occupancy"), value:"78%", note:`<span class="trend-up">↑ 6%</span> ${t("vsYesterday")}`, icon:"chart", color:"rose-bg" }
  ];
  return `<div class="metrics-grid">${cards.map(c => `<article class="metric-card"><div class="metric-head">${c.title}<span class="metric-icon ${c.color}">${icon(c.icon,15)}</span></div><div class="metric-value">${c.value}</div><div class="metric-foot">${c.note}</div></article>`).join("")}</div>
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-head"><div><h2 class="panel-title">${t("weeklyBookings")}</h2><p class="panel-subtitle">${t("weekDescription")}</p></div><button class="select-like">${t("thisWeek")} ${icon("down",12)}</button></div>
        <div class="week-summary"><div class="week-total">48<small>${t("appointmentsLabel")}</small></div><div class="chart-caption"><span><i class="legend-dot"></i>${t("appointmentsByDay")}</span><span><i class="legend-dot pale"></i>${t("completedLabel")}</span></div></div>
        ${renderChart()}
      </section>
      <section class="panel">
        <div class="panel-head"><div><h2 class="panel-title">${t("todaysSchedule")}</h2><p class="panel-subtitle">${t("scheduleSubtitle")}</p></div><button class="text-button" data-view="appointments">${t("seeAll")}</button></div>
        <div class="today-list">${state.appointments.slice(0,4).map(renderScheduleRow).join("")}</div>
        <div class="booking-header"><span class="panel-title">${t("newClient")}</span><span class="panel-subtitle">${t("minutesAgo")} 18</span></div>
        <div class="activity-card"><div class="activity-top"><div class="avatar lilac">MK</div><strong>Marwen Kammoun</strong><span class="activity-time">10:42</span></div><p>${t("booked")} <strong>${t("barber")}</strong> ${t("minutesAgo")} 18 · ${t("messages")} WhatsApp</p></div>
      </section>
    </div>`;
}
function renderLiveDashboard() {
  if (state.dashboardError) {
    return `<section class="panel"><p class="booking-api-error" role="alert">${safe(state.dashboardError)}</p><div class="list-actions" style="margin-top:14px"><button class="quiet-button" data-action="refresh-dashboard">${icon("down")}${t("refresh")}</button></div></section>`;
  }
  if (!state.dashboard) {
    // Not yet loaded (or loading): the summary always returns an object once fetched.
    return `<section class="panel"><div class="empty-state" role="status">${t("loading")}</div></section>`;
  }

  const d = state.dashboard;
  const occupancyValue = d.occupancy && typeof d.occupancy.rate === "number"
    ? `${Math.round(d.occupancy.rate * 100)}%`
    : "—";
  const cards = [
    { title:t("appointmentsToday"), value:String(d.today ?? 0), note:`${t("upcoming")}: ${d.upcoming ?? 0}`, icon:"calendar", color:"" },
    { title:t("completed"), value:String(d.completed ?? 0), note:`${t("cancellations")}: ${d.cancellations ?? 0} · ${t("noShow")}: ${d.noShows ?? 0}`, icon:"check", color:"teal-bg" },
    { title:t("newClients"), value:String(d.newCustomers ?? 0), note:`${t("notificationsSent")}: ${d.notifications?.sent ?? 0} · ${t("notificationsFailed")}: ${d.notifications?.failed ?? 0}`, icon:"users", color:"orange-bg" },
    { title:t("occupancy"), value:occupancyValue, note:`${t("appointmentsLabel")}: ${d.topServices?.reduce?.((sum,s)=>sum+(s.count||0),0) ?? 0}`, icon:"chart", color:"rose-bg" }
  ];

  const totalReport = (state.dashboardReport?.buckets || []).reduce((sum,b)=>sum+(b.count||0),0);
  const topServices = (d.topServices || []).filter(s=>s.count>0);

  return `<div class="metrics-grid">${cards.map(c => `<article class="metric-card"><div class="metric-head">${c.title}<span class="metric-icon ${c.color}">${icon(c.icon,15)}</span></div><div class="metric-value">${safe(c.value)}</div><div class="metric-foot">${safe(c.note)}</div></article>`).join("")}</div>
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-head"><div><h2 class="panel-title">${t("weeklyBookings")}</h2><p class="panel-subtitle">${t("last7Days")}</p></div><button class="quiet-button" data-action="refresh-dashboard" ${state.dashboardLoading?"disabled":""}>${icon("down")}${t("refresh")}</button></div>
        <div class="week-summary"><div class="week-total">${totalReport}<small>${t("appointmentsLabel")}</small></div><div class="chart-caption"><span><i class="legend-dot"></i>${t("appointmentsByDay")}</span></div></div>
        ${renderLiveChart(state.dashboardReport?.buckets || [])}
      </section>
      <section class="panel">
        <div class="panel-head"><div><h2 class="panel-title">${t("topServices")}</h2><p class="panel-subtitle">${t("scheduleSubtitle")}</p></div><button class="text-button" data-view="appointments">${t("seeAll")}</button></div>
        ${topServices.length ? `<div class="today-list">${topServices.map((s,i)=>`<div class="appointment-row"><div class="time-col">${i+1}</div><i class="row-accent"></i><div class="client-line"><strong>${safe(s.name || "—")}</strong><small>${s.count} ${t("appointmentsLabel")}</small></div></div>`).join("")}</div>` : `<div class="empty-state">${t("noData")}</div>`}
      </section>
    </div>`;
}
function renderLiveChart(buckets) {
  const recent = buckets.slice(-7);
  if (!recent.length) {
    return `<div class="empty-state">${t("noData")}</div>`;
  }
  const max = Math.max(1, ...recent.map(b=>b.count||0));
  const dayFormatter = new Intl.DateTimeFormat(state.lang === "ar" ? "ar-TN" : "fr-TN", { weekday: "short" });
  const bars = recent.map((b,i) => {
    const height = Math.round(((b.count||0) / max) * 100);
    return `<div class="chart-day"><i class="bar ${i===recent.length-1?"strong":""}" style="height:${Math.max(4,height)}%" title="${b.count||0}"></i></div>`;
  }).join("");
  const labels = recent.map(b => {
    const [y,m,dd] = b.key.split("-").map(Number);
    return `<span>${dayFormatter.format(new Date(Date.UTC(y, m-1, dd, 12)))}</span>`;
  }).join("");
  return `<div class="chart-wrap"><div class="chart-bars">${bars}</div><div class="chart-xlabels">${labels}</div></div>`;
}
function renderChart() {
  const values = [[34,49],[51,38],[42,62],[68,47],[54,72],[78,58],[47,34]];
  const labels = state.lang === "ar" ? ["ثلا","أرب","خمي","جمع","سبت","أحد","إثن"] : ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];
  return `<div class="chart-wrap"><div class="chart-labels"><span>16</span><span>12</span><span>8</span><span>4</span><span>0</span></div><div class="chart-grid">${Array.from({length:5},()=>"<span></span>").join("")}</div><div class="chart-bars">${values.map((v,i)=>`<div class="chart-day"><i class="bar" style="height:${v[0]}%"></i><i class="bar ${i===5?"strong":""}" style="height:${v[1]}%"></i></div>`).join("")}</div><div class="chart-xlabels">${labels.map(x=>`<span>${x}</span>`).join("")}</div></div>`;
}
function renderScheduleRow(a) {
  return `<div class="appointment-row"><div class="time-col">${a.time}</div><i class="row-accent ${a.accent}"></i><div class="client-line"><strong>${safe(a.name)}</strong><small>${safe(localizeService(a.service))} · ${safe(localizeStaff(a.staff).split(" ")[0])}</small></div><span class="status ${a.status}">${statusLabel(a.status)}</span></div>`;
}
function renderCalendarHeading() {
  const weeks = ["20 – 26 oct. 2026","27 oct. – 2 nov. 2026","3 – 9 nov. 2026"];
  let date;
  let toggle;
  if(state.liveProfessional) {
    const days=weekInfo(state.calendarOffset);
    date=`${days[0].label} – ${days[6].label}`;
    toggle="";
  } else {
    date=weeks[Math.max(0,Math.min(2,state.calendarOffset+1))];
    toggle=`<div class="view-toggle">${["day","week","month"].map(m=>`<button class="${state.calendarMode===m?"selected":""}" data-calendar-mode="${m}">${t(m)}</button>`).join("")}</div>`;
  }
  return `<div class="page-heading"><div><div class="eyebrow">${t("dashboardCrumb")}</div><h1>${t("calendar")}</h1><p>${t("scheduleSubtitle")}</p></div><div class="calendar-toolbar"><button class="quiet-button" data-action="prev-week" aria-label="${t("previousWeek")}">${icon("arrowLeft",14)}</button><strong>${date}</strong><button class="quiet-button" data-action="next-week" aria-label="${t("nextWeek")}">${icon("arrowRight",14)}</button>${toggle}</div></div>`;
}
function renderCalendar() {
  if(state.liveProfessional) return renderLiveCalendar();
  const dates = state.calendarOffset === 0 ? [26,27,28,29,30] : state.calendarOffset < 0 ? [19,20,21,22,23] : [2,3,4,5,6];
  const days = state.lang === "ar" ? ["أحد","إثن","ثلا","أرب","خمي"] : ["Lun","Mar","Mer","Jeu","Ven"];
  const events = [
    [{top:28,title:"Sami Khelifi",time:"09:30",color:""},{top:162,title:"Hatem Mansour",time:"13:30",color:"teal-event"}],
    [{top:95,title:"Youssef Ben Ali",time:"10:30",color:"teal-event"},{top:229,title:"Mehdi Jaziri",time:"14:00",color:"orange-event"}],
    [{top:28,title:"Nour Gharbi",time:"09:30",color:"orange-event"},{top:296,title:"Fares Gharbi",time:"15:30",color:""}],
    [{top:95,title:"Lina Saidi",time:"10:30",color:""},{top:229,title:"Yassine Trabelsi",time:"14:00",color:"teal-event"}],
    [{top:162,title:"Karim Mejri",time:"11:30",color:"orange-event"}]
  ];
  const visible = state.calendarMode === "day" ? [1] : state.calendarMode === "month" ? [0,1,2,3,4] : [0,1,2,3,4];
  return `<section class="calendar-panel panel"><div class="calendar-filters"><button class="filter-chip"><i class="legend-dot"></i>${t("allStaff")} ${icon("down",11)}</button><button class="filter-chip"><i class="legend-dot" style="background:#30b69e"></i>${t("confirmed")}</button><button class="filter-chip"><i class="legend-dot" style="background:#e8a047"></i>${t("pending")}</button></div><div class="calendar-wrap"><div class="calendar-grid"><div class="time-labels">${["09:00","10:00","11:00","12:00","13:00","14:00"].map(x=>`<div class="time-slot">${x}</div>`).join("")}</div>${visible.map(i=>`<div class="calendar-day"><div class="calendar-day-head ${dates[i]===28?"today":""}"><span>${days[i]}</span><strong>${dates[i]}</strong></div><div class="calendar-column">${events[i].map(e=>`<div class="calendar-event ${e.color}" style="top:${e.top}px;height:58px"><strong>${e.title}</strong><small>${e.time} · Coupe</small></div>`).join("")}</div></div>`).join("")}</div></div></section>`;
}
function renderLiveCalendar() {
  const c=state.calendar;
  const days=weekInfo(state.calendarOffset);
  const tz=calendarTz();
  const loc=state.lang==="ar"?"ar-TN":"fr-TN";
  const timeFmt=new Intl.DateTimeFormat(loc,{timeZone:tz,hour:"2-digit",minute:"2-digit"});
  const byDay={};
  for(const b of c.items){ const key=localYmd(new Date(b.startsAt),tz); (byDay[key]=byDay[key]||[]).push(b); }
  for(const k in byDay) byDay[k].sort((a,b)=>new Date(a.startsAt)-new Date(b.startsAt));
  const columns=days.map(day=>{
    const list=byDay[day.ymd]||[];
    const events=list.map(b=>{
      const st=apiStatusClass(b.status);
      return `<div style="padding:7px 9px;margin:6px 0;background:#f4f4f8;border-radius:8px;border-inline-start:3px solid #8b5cf6"><strong style="display:block;font-size:12px">${safe(timeFmt.format(new Date(b.startsAt)))}</strong><span style="font-size:12px">${safe(b.customerNameSnapshot||b.customer?.name||"—")}</span><br><small style="color:#6b7280">${safe(b.service?.name||"—")}${b.employee?.displayName?" · "+safe(b.employee.displayName):""}</small><div style="margin-top:4px"><span class="status ${st}">${statusLabel(st)}</span></div></div>`;
    }).join("")||`<div style="padding:12px;font-size:12px;color:#9ca3af">—</div>`;
    return `<div class="calendar-day" style="min-width:150px;flex:1"><div class="calendar-day-head ${day.isToday?"today":""}"><strong>${safe(day.label)}</strong></div><div style="padding:4px">${events}</div></div>`;
  }).join("");
  const body=c.loading&&!c.items.length?`<div class="empty-state" role="status">${t("loading")}</div>`:c.error?`<p class="booking-api-error" role="alert">${safe(c.error)}</p>`:`<div style="display:flex;gap:10px;overflow-x:auto">${columns}</div>`;
  return `<section class="calendar-panel panel"><div class="calendar-filters"><button class="quiet-button" data-action="refresh-calendar" ${c.loading?"disabled":""}>${icon("down")}${t("refresh")}</button></div><div class="calendar-wrap">${body}</div></section>`;
}
function renderAppointments() {
  const query = state.filters.query.toLowerCase();
  const filtered = state.appointments.filter(a => {
    const matchesText = `${a.name} ${a.service} ${a.staff} ${localizeService(a.service)} ${localizeStaff(a.staff)}`.toLowerCase().includes(query);
    return matchesText && (state.filters.status === "all" || a.status === state.filters.status);
  });
  return `<section class="panel">${state.loginError?`<p class="booking-api-error" role="alert">${safe(state.loginError)}</p>`:""}<div class="list-controls"><label class="search-field">${icon("search")}<input type="search" data-search placeholder="${t("searchPlaceholder")}" value="${safe(state.filters.query)}" aria-label="${t("searchPlaceholder")}"></label><div class="list-actions">${state.liveProfessional?`<button class="quiet-button" data-action="refresh-appointments" ${state.appointmentsLoading?"disabled":""}>${icon("down")}${t("refresh")}</button>`:""}<button class="quiet-button" data-action="cycle-filter">${icon("down")}${state.filters.status==="all"?t("filter"):statusLabel(state.filters.status)}</button></div></div>
    ${state.appointmentsLoading?`<div class="empty-state" role="status">${t("loading")}</div>`:filtered.length ? `<div style="overflow-x:auto"><table class="appointments-table"><thead><tr><th>${t("client")}</th><th>${t("service")}</th><th>${t("dateTime")}</th><th>${t("teamMember")}</th><th>${t("status")}</th><th>${state.liveProfessional?t("actions"):""}</th></tr></thead><tbody>${filtered.map(a=>`<tr><td><div class="person-cell"><div class="avatar ${a.tone}">${safe(a.initials)}</div><div><strong>${safe(a.name)}</strong><small>${safe(a.id)}</small></div></div></td><td>${safe(localizeService(a.service))}</td><td>${safe(localizeDate(a.date))} · ${safe(a.time)}</td><td>${safe(localizeStaff(a.staff))}</td><td><span class="status ${a.status}">${statusLabel(a.status)}</span></td>${state.liveProfessional?`<td>${appointmentActions(a)}</td>`:`<td><button class="table-action" data-action="cycle-status" data-id="${safe(a.id)}" aria-label="${t("action")}">${icon("more",15)}</button></td>`}</tr>`).join("")}</tbody></table></div>`:`<div class="empty-state">${t("noAppointments")}</div>`}
  </section>`;
}
function appointmentActions(a) {
  const id=safe(a.bookingId||"");
  if(!id) return `<span style="color:#9ca3af;font-size:12px">—</span>`;
  const btn=(status,label)=>`<button class="table-pill" data-booking-action="${status}" data-booking-id="${id}" style="font-size:11px;padding:3px 8px;margin:1px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer">${label}</button>`;
  if(a.status==="pending") return btn("CONFIRMED",t("confirmAction"))+btn("CANCELLED",t("cancelAction"))+btn("REJECTED",t("rejectAction"));
  if(a.status==="confirmed") return btn("COMPLETED",t("completeAction"))+btn("CANCELLED",t("cancelAction"))+btn("NO_SHOW",t("noShowAction"));
  return `<span style="color:#9ca3af;font-size:12px">—</span>`;
}
async function transitionAppointment(bookingId, status, reason) {
  if(!state.liveProfessional||!state.professionalSession) return;
  try {
    await window.BookingApi.transitionBooking(state.establishmentId,bookingId,status,reason,...session3());
    showToast(t("statusUpdated"));
    // invalidate dependent caches so they refetch when next opened
    state.calendar.loadedOffset=null;
    state.dashboard=null;
    await loadProfessionalBookings();
  } catch(error) {
    if(!handleProfessionalAuthError(error)) showToast(error.code==="NETWORK_ERROR"?t("apiUnavailable"):error.message||t("bookingFailed"));
  }
}
function apiStatusClass(status) {
  return ({CONFIRMED:"confirmed",PENDING:"pending",COMPLETED:"completed",CANCELLED:"cancelled",REJECTED:"rejected",NO_SHOW:"no_show"})[status]||"pending";
}
function isoDateLabel(value) {
  if(!value) return "—";
  try { return new Intl.DateTimeFormat(state.lang==="ar"?"ar-TN":"fr-TN",{day:"numeric",month:"short",year:"numeric"}).format(new Date(value)); }
  catch { return "—"; }
}
function customerInitials(name) {
  return (name||"").trim().split(/\s+/).slice(0,2).map(p=>p[0]||"").join("").toUpperCase()||"?";
}
function renderCustomers() {
  const c=state.customers;
  if(c.selectedId) return renderCustomerDetail();
  const rows=c.items.map(cust=>`<tr data-customer-id="${safe(cust.id)}" class="clickable-row" style="cursor:pointer"><td><div class="person-cell"><div class="avatar lilac">${safe(customerInitials(cust.name))}</div><div><strong>${safe(cust.name)}</strong><small>${safe(isoDateLabel(cust.createdAt))}</small></div></div></td><td>${safe(cust.phoneNormalized||"—")}</td><td>${safe(cust.email||"—")}</td><td>${icon("chevron",14)}</td></tr>`).join("");
  return `<section class="panel">${c.error?`<p class="booking-api-error" role="alert">${safe(c.error)}</p>`:""}
    <div class="list-controls"><label class="search-field">${icon("search")}<input type="search" data-customer-search placeholder="${t("customersSearchPlaceholder")}" value="${safe(c.query)}" aria-label="${t("customersSearchPlaceholder")}"></label><div class="list-actions"><button class="quiet-button" data-action="refresh-customers" ${c.loading?"disabled":""}>${icon("down")}${t("refresh")}</button></div></div>
    ${c.loading&&!c.items.length?`<div class="empty-state" role="status">${t("loading")}</div>`:c.items.length?`<div style="overflow-x:auto"><table class="appointments-table"><thead><tr><th>${t("client")}</th><th>${t("phone")}</th><th>${t("email")}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="empty-state">${t("noCustomers")}</div>`}
    ${c.nextCursor?`<div style="margin-top:14px;text-align:center"><button class="quiet-button" data-action="customers-load-more" ${c.loading?"disabled":""}>${c.loading?t("loading"):t("loadMore")}</button></div>`:""}
  </section>`;
}
function renderCustomerDetail() {
  const c=state.customers;
  const d=c.detail;
  const header=`<div class="panel-head"><div><button class="text-button" data-action="customers-back">${icon("arrowLeft",13)} ${t("backToList")}</button></div><button class="quiet-button" data-action="customers-back">${icon("x",14)}</button></div>`;
  if(c.detailLoading&&!d) return `<section class="panel">${header}<div class="empty-state" role="status">${t("loading")}</div></section>`;
  if(c.detailError&&!d) return `<section class="panel">${header}<p class="booking-api-error" role="alert">${safe(c.detailError)}</p></section>`;
  if(!d) return `<section class="panel">${header}<div class="empty-state">${t("noData")}</div></section>`;
  const historyRows=c.bookings.map(b=>{
    const when=(()=>{try{return new Intl.DateTimeFormat(state.lang==="ar"?"ar-TN":"fr-TN",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:state.establishment?.timezone||undefined}).format(new Date(b.startsAt));}catch{return "—";}})();
    const st=apiStatusClass(b.status);
    return `<div class="appointment-row"><div class="time-col">${safe(b.publicReference||"")}</div><i class="row-accent"></i><div class="client-line"><strong>${safe(b.serviceNameSnapshot||"—")}</strong><small>${safe(when)} · ${safe(b.employee?.displayName||"—")}</small></div><span class="status ${st}">${statusLabel(st)}</span></div>`;
  }).join("");
  return `<section class="panel">${header}
    <div class="customer-profile" style="display:flex;gap:14px;align-items:center;margin:8px 0 18px"><div class="avatar lilac" style="width:52px;height:52px;font-size:18px">${safe(customerInitials(d.name))}</div><div><h2 class="panel-title" style="margin:0">${safe(d.name)}</h2><p class="panel-subtitle" style="margin:2px 0 0">${safe(d.phoneNormalized||"—")}${d.email?" · "+safe(d.email):""}</p><p class="panel-subtitle" style="margin:2px 0 0">${t("customerSince")} ${safe(isoDateLabel(d.createdAt))}</p></div></div>
    <div class="panel-head"><h2 class="panel-title">${t("history")}</h2></div>
    ${c.bookings.length?`<div class="today-list">${historyRows}</div>`:(c.detailLoading?`<div class="empty-state" role="status">${t("loading")}</div>`:`<div class="empty-state">${t("noAppointments")}</div>`)}
    ${c.bookingsNextCursor?`<div style="margin-top:14px;text-align:center"><button class="quiet-button" data-action="customer-bookings-more" ${c.detailLoading?"disabled":""}>${c.detailLoading?t("loading"):t("loadMore")}</button></div>`:""}
  </section>`;
}
function isoDateTimeLabel(value) {
  if(!value) return "—";
  try { return new Intl.DateTimeFormat(state.lang==="ar"?"ar-TN":"fr-TN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:state.establishment?.timezone||undefined}).format(new Date(value)); }
  catch { return "—"; }
}
function notifStatusClass(s) {
  return ({SENT:"confirmed",DELIVERED:"confirmed",PENDING:"pending",PROCESSING:"pending",UNKNOWN:"pending",FAILED:"cancelled",CANCELLED:"cancelled"})[s]||"pending";
}
function notifStatusLabel(s) {
  const fr={PENDING:"En attente",PROCESSING:"En cours",SENT:"Envoyé",DELIVERED:"Livré",FAILED:"Échec",UNKNOWN:"Inconnu",CANCELLED:"Annulé"};
  const ar={PENDING:"قيد الانتظار",PROCESSING:"قيد المعالجة",SENT:"أُرسل",DELIVERED:"تم التسليم",FAILED:"فشل",UNKNOWN:"غير معروف",CANCELLED:"أُلغي"};
  return (state.lang==="ar"?ar:fr)[s]||s;
}
function notifEventLabel(e) {
  const fr={BOOKING_CONFIRMED:"Confirmation",BOOKING_REMINDER_DUE:"Rappel",BOOKING_CANCELLED:"Annulation",BOOKING_UPDATED:"Modification",BOOKING_COMPLETED:"Terminé",BOOKING_CREATED:"Création"};
  const ar={BOOKING_CONFIRMED:"تأكيد",BOOKING_REMINDER_DUE:"تذكير",BOOKING_CANCELLED:"إلغاء",BOOKING_UPDATED:"تعديل",BOOKING_COMPLETED:"اكتمال",BOOKING_CREATED:"إنشاء"};
  return (state.lang==="ar"?ar:fr)[e]||e;
}
function renderMessages() {
  const n=state.notifications;
  const s=n.settings;
  const settingsCard=s?`<section class="panel"><div class="panel-head"><div><h2 class="panel-title">${t("notifSettingsTitle")}</h2><p class="panel-subtitle">${t("notifSettingsSub")}</p></div></div>
    ${n.settingsError?`<p class="booking-api-error" role="alert">${safe(n.settingsError)}</p>`:""}${n.settingsMsg?`<p class="booking-api-success" style="color:#2f855a">${safe(n.settingsMsg)}</p>`:""}
    <form id="notification-settings-form"><div class="form-grid">
      <label class="field full" style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" name="whatsappEnabled" ${s.whatsappEnabled?"checked":""}> ${t("whatsappEnabled")}</label>
      <label class="field full" style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" name="confirmationEnabled" ${s.confirmationEnabled?"checked":""}> ${t("confirmationEnabled")}</label>
      <label class="field full" style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" name="cancellationEnabled" ${s.cancellationEnabled?"checked":""}> ${t("cancellationEnabled")}</label>
      <div class="field"><label>${t("firstReminder")}</label><input type="number" name="firstReminderMinutesBefore" min="1" max="20160" value="${s.firstReminderMinutesBefore??""}" placeholder="${t("disabled")}"></div>
      <div class="field"><label>${t("secondReminder")}</label><input type="number" name="secondReminderMinutesBefore" min="1" max="20160" value="${s.secondReminderMinutesBefore??""}" placeholder="${t("disabled")}"></div>
    </div><div class="booking-footer"><span class="panel-subtitle">${t("reminderHint")}</span><button class="primary-button" type="submit" ${n.settingsSaving?"disabled":""}>${n.settingsSaving?t("loading"):t("save")}</button></div></form></section>`:"";
  const rows=n.items.map(it=>`<tr><td>${safe(notifEventLabel(it.eventType))}</td><td>${safe(it.channel)}</td><td><span class="status ${notifStatusClass(it.status)}">${safe(notifStatusLabel(it.status))}</span></td><td>${safe(isoDateTimeLabel(it.scheduledAt))}</td><td>${it.attempts??0}</td><td>${it.errorCode?safe(it.errorCode):"—"}</td></tr>`).join("");
  const listCard=`<section class="panel"><div class="panel-head"><div><h2 class="panel-title">${t("notifLogTitle")}</h2><p class="panel-subtitle">${t("notifLogSub")}</p></div><button class="quiet-button" data-action="refresh-notifications" ${n.loading?"disabled":""}>${icon("down")}${t("refresh")}</button></div>
    ${n.error?`<p class="booking-api-error" role="alert">${safe(n.error)}</p>`:""}
    ${n.loading&&!n.items.length?`<div class="empty-state" role="status">${t("loading")}</div>`:n.items.length?`<div style="overflow-x:auto"><table class="appointments-table"><thead><tr><th>${t("event")}</th><th>${t("channel")}</th><th>${t("status")}</th><th>${t("scheduled")}</th><th>${t("attempts")}</th><th>${t("errorCol")}</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<div class="empty-state">${t("noNotifications")}</div>`}
  </section>`;
  if(n.loading&&!n.loaded) return `<section class="panel"><div class="empty-state" role="status">${t("loading")}</div></section>`;
  return settingsCard+listCard;
}
function renderSettings() {
  const s=state.settings;
  if(s.loading&&!s.loaded) return `<section class="panel"><div class="empty-state" role="status">${t("loading")}</div></section>`;
  if(s.error&&!s.profile) return `<section class="panel"><p class="booking-api-error" role="alert">${safe(s.error)}</p><div class="list-actions" style="margin-top:12px"><button class="quiet-button" data-action="refresh-settings">${icon("down")}${t("refresh")}</button></div></section>`;
  const p=s.profile||{};
  const profileCard=`<section class="panel"><div class="panel-head"><div><h2 class="panel-title">${t("profileTitle")}</h2><p class="panel-subtitle">${t("slug")}: ${safe(p.slug||"")} · ${safe(p.currency||"")}</p></div></div>
    ${s.error?`<p class="booking-api-error" role="alert">${safe(s.error)}</p>`:""}${s.savedMsg?`<p style="color:#2f855a">${safe(s.savedMsg)}</p>`:""}
    <form id="settings-profile-form"><div class="form-grid">
      <div class="field"><label>${t("establishmentName")}</label><input name="name" value="${safe(p.name||"")}" required></div>
      <div class="field"><label>${t("timezone")}</label><input name="timezone" value="${safe(p.timezone||"")}"></div>
      <div class="field full"><label>${t("descriptionLabel")}</label><input name="description" value="${safe(p.description||"")}"></div>
      <div class="field full"><label>${t("addressLabel")}</label><input name="address" value="${safe(p.address||"")}"></div>
      <div class="field"><label>${t("defaultLang")}</label><select name="locale"><option value="fr" ${p.locale==="fr"?"selected":""}>Français</option><option value="ar" ${p.locale==="ar"?"selected":""}>العربية</option></select></div>
      <div class="field"><label>${t("minNotice")}</label><input type="number" name="minimumBookingNoticeMinutes" min="0" value="${p.minimumBookingNoticeMinutes??""}"></div>
      <div class="field"><label>${t("maxDays")}</label><input type="number" name="maximumBookingDays" min="1" value="${p.maximumBookingDays??""}"></div>
      <div class="field"><label>${t("cancelNotice")}</label><input type="number" name="cancellationNoticeHours" min="0" value="${p.cancellationNoticeHours??""}"></div>
    </div><div class="booking-footer"><span></span><button class="primary-button" type="submit" ${s.saving?"disabled":""}>${s.saving?t("loading"):t("save")}</button></div></form></section>`;

  const sub=s.subscription;
  let subCard;
  if(s.subError && !sub) {
    subCard=`<section class="panel"><div class="panel-head"><h2 class="panel-title">${t("subscription")}</h2></div><p class="panel-subtitle">${safe(s.subError)}</p></section>`;
  } else if(sub) {
    const u=sub.usage||{};
    const lim=v=>v==null?"∞":v;
    const row=(label,used,limit)=>`<div class="appointment-row"><i class="row-accent"></i><div class="client-line"><strong>${label}</strong><small>${used} / ${lim(limit)}</small></div></div>`;
    const curCode=sub.plan?.code;
    const statusTxt=sub.subscription?sub.subscription.status:(sub.plan?.isImplicitFree?t("implicitFree"):"—");
    const planButtons=s.plans.map(pl=>{
      const current=pl.code===curCode;
      return `<div class="appointment-row"><i class="row-accent"></i><div class="client-line"><strong>${safe(pl.name)}</strong><small>${Number(pl.priceAmount)===0?t("freePlan"):`${safe(String(pl.priceAmount))} ${safe(pl.currency)} / ${pl.interval==="YEAR"?t("perYear"):t("perMonth")}`}</small></div>${current?`<span class="status confirmed">${t("currentPlan")}</span>`:`<button class="quiet-button" data-plan-code="${safe(pl.code)}" ${s.planBusy?"disabled":""}>${s.planBusy===pl.code?t("loading"):t("choose")}</button>`}</div>`;
    }).join("");
    subCard=`<section class="panel"><div class="panel-head"><div><h2 class="panel-title">${t("subscription")}</h2><p class="panel-subtitle">${t("planLabel")}: ${safe(sub.plan?.name||"—")} · ${safe(statusTxt)}</p></div><button class="quiet-button" data-action="refresh-settings">${icon("down")}${t("refresh")}</button></div>
      ${s.subError?`<p class="booking-api-error" role="alert">${safe(s.subError)}</p>`:""}
      <div class="panel-subtitle" style="margin-bottom:6px">${t("usageThisPeriod")}</div>
      <div class="today-list">${row(t("employees"),u.employees?.used??0,u.employees?.limit)}${row(t("appointments"),u.bookings?.used??0,u.bookings?.limit)}${row(t("notificationsWord"),u.notifications?.used??0,u.notifications?.limit)}</div>
      <div class="panel-head" style="margin-top:14px"><h2 class="panel-title">${t("availablePlans")}</h2></div>
      <div class="today-list">${planButtons}</div></section>`;
  } else {
    subCard="";
  }
  return profileCard+subCard;
}
function renderPlaceholder() {
  const title = ({ customers:t("customers"), messages:t("messages"), reports:t("reports"), settings:t("settings") })[state.view] || t("dashboard");
  return `<section class="panel" style="min-height:290px;display:grid;place-items:center;text-align:center"><div><div class="metric-icon" style="margin:0 auto 12px">${icon(state.view==="customers"?"users":state.view==="messages"?"message":state.view==="reports"?"chart":"settings")}</div><h2 class="panel-title">${title}</h2><p class="panel-subtitle">${t("loading")}</p></div></section>`;
}
function renderModal() {
  return `<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div class="modal-head"><h2 id="modal-title">${t("addAppointment")}</h2><button class="icon-button" data-action="close-modal" aria-label="Close">${icon("x",15)}</button></div><form id="quick-booking-form"><div class="form-grid"><div class="field"><label>${t("firstName")}</label><input name="name" required placeholder="Ex. Amine Ben Salah"></div><div class="field"><label>${t("phone")}</label><input name="phone" required type="tel" placeholder="+216 20 000 000"></div><div class="field full"><label>${t("service")}</label><select name="service"><option>Coupe classique</option><option>Coupe dégradée</option><option>Taille de barbe</option><option>Coupe + barbe</option></select></div><div class="field"><label>${t("date")}</label><input type="date" name="date" value="2026-10-28"></div><div class="field"><label>${t("time")}</label><input type="time" name="time" value="17:00"></div></div><div class="booking-footer"><button type="button" class="quiet-button" data-action="close-modal">${t("back")}</button><button class="primary-button" type="submit">${t("addAppointment")}</button></div></form></section></div>`;
}

function renderBooking() {
  const b = state.booking;
  const service = services.find(s=>s.id===b.service);
  const staff = team.find(x=>x.id===b.staff) || (b.confirmedStaffName ? {name:b.confirmedStaffName} : null);
  const publicNav = `<header class="public-topbar"><div class="public-brand"><div class="brand-mark">${icon("calendar",18)}</div><strong>rendezvous.</strong></div><div class="public-actions"><button class="language-button" data-action="language">${state.lang==="fr"?"عربي":"FR"}</button><button class="quiet-button" data-action="back-professional">${t("backOffice")}</button></div></header>`;
  const establishmentName = state.establishment?.name || "Atelier 17";
  const banner = `<section class="shop-banner"><div class="shop-copy"><div class="shop-kicker">${safe(state.establishment?.address || t("locationTunis"))}</div><h1>${safe(establishmentName)}</h1><p>${safe(state.establishment?.description || t("shopSlogan"))}</p></div></section>`;
  if (b.loadingData && !state.establishment) {
    return `<div class="booking-mode">${publicNav}<main class="public-body">${banner}<section class="booking-card"><p class="booking-section-sub" role="status">${t("loading")}</p></section></main></div>`;
  }
  if (b.success) {
    return `<div class="booking-mode">${publicNav}<main class="public-body">${banner}<div class="booking-layout"><section class="booking-card"><div class="confirmation"><div class="confirm-icon">${icon("check",26)}</div><h2>${t("bookingSuccess")}</h2><p>${t("successSub")}</p><div class="booking-ref">${b.reference||"A17-281026"}</div>${renderSummaryDetails(service,staff,b)}<div style="margin-top:22px">${b.staffMode?`<button class="primary-button" data-action="staff-done">${t("backToList")}</button>`:`<button class="primary-button" data-action="back-professional">${t("backToDashboard")}</button>`}</div></div></section><aside class="summary-card"><h2 class="panel-title">${t("summary")}</h2>${renderSummaryDetails(service,staff,b)}<div class="summary-note">${icon("shield")}${t("secureNote")}</div></aside></div></main></div>`;
  }
  return `<div class="booking-mode">${publicNav}<main class="public-body">${banner}<div class="booking-layout"><section class="booking-card">
    <div class="steps">${["chooseService","chooseDate","yourDetails"].map((label,i)=>`<div class="step ${b.step===i+1?"active":b.step>i+1?"done":""}"><span class="step-circle">${b.step>i+1?icon("check",12):i+1}</span><span>${t(label)}</span></div>${i<2?'<i class="step-line"></i>':""}`).join("")}</div>
    ${b.error ? `<p class="booking-api-error" role="alert">${safe(bookingErrorText())}</p>` : ""}
    ${b.step===1 ? renderServiceStep() : b.step===2 ? renderDateStep() : renderContactStep()}
    <div class="booking-footer">${b.step>1?`<button class="quiet-button" data-action="booking-back" ${b.submitting?"disabled":""}>${icon("arrowLeft",13)}${t("back")}</button>`:"<span></span>"}<button class="primary-button" data-action="${b.step===3?"booking-confirm":"booking-next"}" ${b.submitting || b.loadingData || (b.step===1 && !services.length) || (b.step===2 && (b.loadingSlots || !b.selectedSlot)) ? "disabled" : ""}>${b.submitting?t("submitBooking"):b.step===3?t("confirmBooking"):t("continue")}${icon("arrowRight",13)}</button></div>
  </section><aside class="summary-card"><h2 class="panel-title">${t("summary")}</h2><p class="panel-subtitle">${safe(establishmentName)} · ${safe(state.establishment?.address || t("locationTunis"))}</p><div class="summary-details">${renderSummaryDetails(service,staff,b)}</div><div class="summary-note">${icon("shield")}${t("cancellationNote")}</div><div class="summary-note">${icon("clock")}${t("secureNote")}</div></aside></div></main></div>`;
}
function renderServiceStep() {
  const b=state.booking;
  return `<div><h2 class="booking-section-title">${t("chooseService")}</h2><p class="booking-section-sub">${t("chooseServiceSub")}</p>${b.loadingData && !services.length ? `<p class="booking-section-sub" role="status">${t("loading")}</p>` : services.length ? `<div class="service-grid">${services.map(s=>`<button class="service-option ${b.service===s.id?"selected":""}" data-service="${safe(s.id)}"><span class="service-icon">${icon(s.icon)}</span><span class="service-copy"><strong>${safe(s.name)}</strong><small>${safe(s.description || "")} · ${s.duration} min</small></span><span class="service-price">${formatPrice(s.price)}</span></button>`).join("")}</div>` : `<div class="empty-state">${t("noServices")} ${t("connectApi")}</div>`}${b.service ? `<h3 class="booking-subheading">${t("teamTitle")}</h3>${b.loadingData ? `<p class="booking-section-sub" role="status">${t("loading")}</p>` : `<div class="staff-list"><button class="staff-option ${b.staff==="any"?"selected":""}" data-staff="any"><span class="avatar lilac">✦</span>${t("anyone")}</button>${team.length ? team.map(m=>`<button class="staff-option ${b.staff===m.id?"selected":""}" data-staff="${safe(m.id)}"><span class="avatar ${m.tone}">${safe(m.initials)}</span>${safe(m.name)}</button>`).join("") : `<span class="booking-section-sub">${t("noEmployees")}</span>`}</div>`}` : ""}</div>`;
}
function renderDateStep() {
  const b=state.booking;
  const dates=Array.from({length:7},(_,i)=>shiftDateKey(dateKey(),i));
  const weekday=value=>{const [year,month,day]=value.split("-").map(Number);return new Intl.DateTimeFormat(state.lang==="ar"?"ar-TN":"fr-TN",{weekday:"short"}).format(new Date(year,month-1,day,12));};
  return `<div><h2 class="booking-section-title">${t("chooseDate")}</h2><p class="booking-section-sub">${t("chooseTime")}</p><div class="date-strip">${dates.map(value=>`<button class="date-option ${b.date===value?"selected":""}" data-date="${value}"><span>${safe(weekday(value))}</span><strong>${Number(value.slice(-2))}</strong></button>`).join("")}</div><h3 class="booking-subheading">${t("chooseTime")}</h3>${b.loadingSlots?`<p class="booking-section-sub" role="status">${t("loadingSlots")}</p>`:b.slots.length?`<div class="time-grid">${b.slots.map(slot=>`<button class="time-option ${b.selectedSlot?.start===slot.start?"selected":""}" data-slot-start="${safe(slot.start)}" data-slot-employee="${safe(slot.employeeId)}">${safe(bookingTimeLabel(slot.start))}</button>`).join("")}</div>`:`<div class="empty-state">${b.error?safe(bookingErrorText()):t("noSlots")}</div>`}</div>`;
}
function renderContactStep() {
  const b=state.booking;
  return `<div><h2 class="booking-section-title">${t("yourDetails")}</h2><p class="booking-section-sub">${t("yourDetailsSub")}</p><div class="form-grid"><div class="field full"><label>${t("firstName")} *</label><input data-booking-field="name" value="${safe(b.name)}" autocomplete="name" placeholder="Ex. Amine Ben Salah" required ${b.submitting?"disabled":""}></div><div class="field full"><label>${t("phone")} *</label><input data-booking-field="phone" value="${safe(b.phone)}" type="tel" autocomplete="tel" placeholder="+216 20 000 000" required ${b.submitting?"disabled":""}></div><div class="field full"><label>${t("email")}</label><input data-booking-field="email" value="${safe(b.email)}" type="email" autocomplete="email" placeholder="amine@email.com" ${b.submitting?"disabled":""}></div></div><label class="consent-row"><input data-booking-consent type="checkbox" ${b.consent?"checked":""} ${b.submitting?"disabled":""}><span>${t("consent")}</span></label></div>`;
}
function renderSummaryDetails(service,staff,b) {
  return `<div class="summary-row"><span>${t("service")}</span><strong>${service?safe(service.name):"—"}</strong></div><div class="summary-row"><span>${t("duration")}</span><strong>${service?`${service.duration} min`:"—"}</strong></div><div class="summary-row"><span>${t("date")}</span><strong>${bookingDateLabel(b.date)}</strong></div><div class="summary-row"><span>${t("time")}</span><strong>${bookingTimeLabel(b.time)}</strong></div><div class="summary-row"><span>${t("specialist")}</span><strong>${staff?safe(staff.name):b.staff==="any"?t("anyone"):"—"}</strong></div><div class="summary-total"><span>${t("total")}</span><strong>${service?formatPrice(service.price):"—"}</strong></div>`;
}

function formatPrice(value) {
  const amount=Number(value);
  if(!Number.isFinite(amount)) return `${safe(value)} ${safe(state.currency)}`;
  try { return new Intl.NumberFormat(state.lang==="ar"?"ar-TN":"fr-TN",{style:"currency",currency:state.currency}).format(amount); }
  catch { return `${amount} ${safe(state.currency)}`; }
}

function bookingErrorText() {
  const b=state.booking;
  if(b.errorKind==="network") return t("apiUnavailable");
  if(b.errorKind==="slot-conflict") return t("slotConflict");
  return b.error;
}

function showBookingError(error) {
  const message=error?.code==="NETWORK_ERROR"?t("apiUnavailable"):error?.message || t("bookingFailed");
  state.booking.error=message;
  state.booking.errorKind=error?.code==="NETWORK_ERROR"?"network":"";
  showToast(message);
  render();
}

async function loadBookingData() {
  const b=state.booking;
  b.loadingData=true;
  b.error="";
  b.errorKind="";
  services=[];
  team=[];
  render();
  try {
    const [establishment,serviceResult]=await Promise.all([
      window.BookingApi.getEstablishment(state.establishmentSlug),
      window.BookingApi.getServices(state.establishmentSlug)
    ]);
    if(state.booking!==b) return;
    state.establishment=establishment;
    b.date=dateKeyInTimezone(establishment.timezone);
    state.currency=serviceResult.currency || establishment.currency || "TND";
    services=(serviceResult.services || []).map(service=>({
      id:service.id,
      name:service.name,
      description:service.description || "",
      duration:service.durationMinutes,
      price:service.price,
      icon:/barbe|beard|barber/i.test(service.name)?"scissors":"spark"
    }));
    b.loadingData=false;
    b.error=services.length?"":t("noServices");
    render();
  } catch(error) {
    if(state.booking!==b) return;
    b.loadingData=false;
    b.error=error.message || t("apiUnavailable");
    b.errorKind=error?.code==="NETWORK_ERROR"?"network":"";
    render();
  }
}

async function loadEmployeesForService(serviceId) {
  const b=state.booking;
  const requestId=(b.employeeRequestId||0)+1;
  b.employeeRequestId=requestId;
  b.loadingData=true;
  b.error="";
  b.errorKind="";
  b.staff="any";
  team=[];
  render();
  try {
    const employees=await window.BookingApi.getEmployees(state.establishmentSlug,serviceId);
    if(state.booking!==b||b.employeeRequestId!==requestId) return;
    team=employees.map((employee,index)=>({
      id:employee.id,
      name:employee.displayName,
      initials:employee.displayName.split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase(),
      tone:["","teal","peach","lilac"][index%4]
    }));
    if(b.staff!=="any"&&!team.some(employee=>employee.id===b.staff)) b.staff="any";
  } catch(error) {
    if(state.booking!==b||b.employeeRequestId!==requestId) return;
    b.error=error.message || t("apiUnavailable");
    b.errorKind=error?.code==="NETWORK_ERROR"?"network":"";
  } finally {
    if(state.booking===b&&b.employeeRequestId===requestId) {
      b.loadingData=false;
      render();
    }
  }
}

async function loadAvailability() {
  const b=state.booking;
  if(!b.service||!b.date) return;
  const requestId=(b.availabilityRequestId||0)+1;
  b.availabilityRequestId=requestId;
  b.loadingSlots=true;
  b.error="";
  b.errorKind="";
  b.slots=[];
  b.time=null;
  b.selectedSlot=null;
  render();
  try {
    const result=await window.BookingApi.getAvailability(
      state.establishmentSlug,b.service,b.date,b.staff==="any"?undefined:b.staff
    );
    if(state.booking!==b||b.availabilityRequestId!==requestId) return;
    b.slots=result.slots || [];
  } catch(error) {
    if(state.booking!==b||b.availabilityRequestId!==requestId) return;
    b.error=error.message || t("apiUnavailable");
    b.errorKind=error?.code==="NETWORK_ERROR"?"network":"";
  } finally {
    if(state.booking===b&&b.availabilityRequestId===requestId) {
      b.loadingSlots=false;
      render();
    }
  }
}

async function createBooking() {
  const b=state.booking;
  if(b.submitting) return;
  if(!b.selectedSlot||!b.time){showToast(t("chooseTimeFirst"));return;}
  if(b.name.trim().length<2||b.phone.trim().length<6){showToast(t("fillContact"));return;}
  if(b.email.trim()&&!document.querySelector('[data-booking-field="email"]').checkValidity()){showToast(t("invalidEmail"));return;}
  if(b.date<dateKeyInTimezone(state.establishment?.timezone||"UTC")){showToast(t("appointmentInPast"));return;}
  b.submitting=true;
  b.error="";
  b.idempotencyKey ||= (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  render();
  try {
    const response=await window.BookingApi.createBooking(state.establishmentSlug,{
      serviceId:b.service,
      employeeId:b.staff==="any"?b.selectedSlot.employeeId:b.staff,
      startsAt:b.selectedSlot.start,
      customerName:b.name.trim(),
      customerPhone:b.phone.trim(),
      customerEmail:b.email.trim() || undefined,
      consentToReminders:Boolean(b.consent)
    },b.idempotencyKey);
    const booking=response.booking;
    b.reference=booking.publicReference;
    b.time=booking.startsAt;
    b.confirmedStaffName=booking.employee?.displayName || team.find(employee=>employee.id===booking.employee?.id)?.name || "";
    b.success=true;
    b.idempotencyKey=null;
    state.appointments.unshift({
      id:booking.publicReference,
      name:b.name.trim(),
      initials:b.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join("").toUpperCase(),
      tone:"lilac",
      service:services.find(item=>item.id===b.service)?.name || "",
      staff:booking.employee?.displayName || "",
      date:bookingDateLabel(b.date),
      time:bookingTimeLabel(booking.startsAt),
      status:"confirmed",
      accent:""
    });
    render();
    showToast(t("confirmedToast"));
  } catch(error) {
    if(error.status===409) {
      b.time=null;
      b.selectedSlot=null;
      b.idempotencyKey=null;
      b.submitting=false;
      await loadAvailability();
      if(state.booking===b) {
        b.error=t("slotConflict");
        b.errorKind="slot-conflict";
        render();
        showToast(bookingErrorText());
      }
      return;
    }
    b.submitting=false;
    showBookingError(error);
  } finally {
    b.submitting=false;
  }
}

function showToast(message) {
  const region=document.getElementById("toast-region");
  const item=document.createElement("div");
  item.className="toast"; item.textContent=message; region.appendChild(item);
  setTimeout(()=>item.remove(),3200);
}
function handleClick(event) {
  const target=event.target.closest("button,[data-action],[data-customer-id],.modal-backdrop");
  if (!target) return;
  if (target.dataset.view) {
    const nextView=target.dataset.view;
    const connected=["appointments","dashboard","customers","messages","settings","calendar"];
    if(state.liveProfessional&&!connected.includes(nextView)) { showToast(t("viewNotConnected"));return; }
    state.view=nextView;
    render();
    if(state.liveProfessional&&nextView==="dashboard"&&!state.dashboard&&!state.dashboardLoading) loadDashboard();
    if(state.liveProfessional&&nextView==="customers"&&!state.customers.loaded&&!state.customers.loading) loadCustomers();
    if(state.liveProfessional&&nextView==="messages"&&!state.notifications.loaded&&!state.notifications.loading) loadNotifications();
    if(state.liveProfessional&&nextView==="settings"&&!state.settings.loaded&&!state.settings.loading) loadSettings();
    if(state.liveProfessional&&nextView==="calendar"&&state.calendar.loadedOffset!==state.calendarOffset&&!state.calendar.loading) loadCalendar();
    return;
  }
  if (target.dataset.customerId) { loadCustomerDetail(target.dataset.customerId); return; }
  if (target.dataset.planCode) { changePlan(target.dataset.planCode); return; }
  if (target.dataset.bookingAction) {
    const next=target.dataset.bookingAction;
    const id=target.dataset.bookingId;
    let reason;
    if(next==="CANCELLED"||next==="REJECTED") {
      reason=window.prompt(next==="CANCELLED"?t("cancelReasonPrompt"):t("rejectReasonPrompt"));
      if(reason===null) return;
      if(!reason.trim()) { showToast(t("reasonRequired")); return; }
    }
    transitionAppointment(id,next,reason);
    return;
  }
  if (target.dataset.service) {
    const changed=state.booking.service!==target.dataset.service;
    state.booking.service=target.dataset.service;
    state.booking.idempotencyKey=null;
    state.booking.selectedSlot=null;
    state.booking.time=null;
    if(changed) loadEmployeesForService(target.dataset.service);
    else render();
    return;
  }
  if (target.dataset.staff) {
    state.booking.staff=target.dataset.staff;
    state.booking.idempotencyKey=null;
    state.booking.selectedSlot=null;
    state.booking.time=null;
    if(state.booking.step===2) loadAvailability();
    else render();
    return;
  }
  if (target.dataset.date) {
    state.booking.date=target.dataset.date;
    state.booking.idempotencyKey=null;
    loadAvailability();
    return;
  }
  if (target.dataset.slotStart) {
    const slot=state.booking.slots.find(item=>item.start===target.dataset.slotStart&&item.employeeId===target.dataset.slotEmployee);
    state.booking.selectedSlot=slot || null;
    state.booking.time=slot?.start || null;
    state.booking.idempotencyKey=null;
    render();
    return;
  }
  if (target.dataset.calendarMode) { state.calendarMode=target.dataset.calendarMode; render(); return; }
  const action=target.dataset.action;
  if (action==="language") { state.lang=state.lang==="fr"?"ar":"fr"; render(); }
  else if(action==="professional-login") openProfessionalLogin();
  else if(action==="professional-logout") logoutProfessional();
  else if(action==="back-prototype") { state.mode="professional";render(); }
  else if(action==="refresh-appointments") loadProfessionalBookings();
  else if(action==="refresh-dashboard") loadDashboard();
  else if(action==="refresh-customers") loadCustomers({reset:true});
  else if(action==="customers-back") { state.customers.selectedId=null; state.customers.detail=null; state.customers.bookings=[]; state.customers.bookingsNextCursor=null; state.customers.detailError=""; render(); }
  else if(action==="customers-load-more") loadCustomers({reset:false});
  else if(action==="customer-bookings-more") { if(state.customers.selectedId) loadCustomerDetail(state.customers.selectedId,{reset:false}); }
  else if(action==="refresh-notifications") loadNotifications();
  else if(action==="refresh-settings") loadSettings();
  else if(action==="refresh-calendar") loadCalendar();
  else if (action==="open-booking") {
    state.mode="booking";
    state.booking={step:1,service:null,staff:"any",date:dateKey(),time:null,selectedSlot:null,name:"",phone:"",email:"",consent:false,success:false,loadingData:true,loadingSlots:false,submitting:false,error:"",slots:[],employeeRequestId:0,availabilityRequestId:0,idempotencyKey:null};
    render();
    loadBookingData();
  }
  else if (action==="back-professional") openProfessionalLogin();
  else if (action==="new-appointment") {
    if(state.liveProfessional) { state.mode="booking";state.booking={step:1,service:null,staff:"any",date:dateKey(),time:null,selectedSlot:null,name:"",phone:"",email:"",consent:false,success:false,loadingData:true,loadingSlots:false,submitting:false,error:"",slots:[],employeeRequestId:0,availabilityRequestId:0,idempotencyKey:null,staffMode:true};render();loadBookingData(); }
    else { state.modalOpen=true;render(); }
  }
  else if (action==="staff-done") {
    state.mode="professional"; state.view="appointments";
    state.calendar.loadedOffset=null; state.dashboard=null; state.customers.loaded=false;
    render(); loadProfessionalBookings();
  }
  else if (action==="close-modal" && (target.classList.contains("modal-backdrop") || target.closest(".modal")===null || target.tagName==="BUTTON")) { state.modalOpen=false;render(); }
  else if (action==="booking-next") {
    if (!state.booking.service) { showToast(t("chooseServiceFirst")); return; }
    if (state.booking.step === 2 && (!state.booking.date || !state.booking.selectedSlot)) { showToast(t("chooseTimeFirst")); return; }
    state.booking.step=Math.min(3,state.booking.step+1);
    if(state.booking.step===2) loadAvailability();
    else render();
  }
  else if (action==="booking-back") { state.booking.step=Math.max(1,state.booking.step-1);render(); }
  else if (action==="booking-confirm") createBooking();
  else if (action==="prev-week") { state.calendarOffset=state.liveProfessional?state.calendarOffset-1:Math.max(-1,state.calendarOffset-1);render(); if(state.liveProfessional) loadCalendar(); }
  else if (action==="next-week") { state.calendarOffset=state.liveProfessional?state.calendarOffset+1:Math.min(1,state.calendarOffset+1);render(); if(state.liveProfessional) loadCalendar(); }
  else if (action==="cycle-filter") { state.filters.status=({all:"confirmed",confirmed:"pending",pending:"all"})[state.filters.status];render(); }
  else if (action==="cycle-status") {
    const item=state.appointments.find(a=>a.id===target.dataset.id);
    if(item) { item.status=({confirmed:"completed",completed:"cancelled",cancelled:"confirmed",pending:"confirmed"})[item.status];render();showToast(t("saved")); }
  }
  else if (action==="notify") showToast(t("notificationDemo"));
  else if (action==="export") showToast(t("saved"));
}
function handleInput(event) {
  if(event.target.matches("[data-search]")) {
    const start=event.target.selectionStart;
    state.filters.query=event.target.value;
    const panel=event.target.closest(".panel");
    const scroll=window.scrollY;
    const replacement=document.createElement("div");
    replacement.innerHTML=renderAppointments();
    panel.replaceWith(replacement.firstElementChild);
    const input=document.querySelector("[data-search]");
    input.focus(); input.setSelectionRange(start,start); window.scrollTo(0,scroll);
  }
  if(event.target.matches("[data-customer-search]")) {
    const start=event.target.selectionStart;
    state.customers.query=event.target.value;
    const panel=event.target.closest(".panel");
    if(panel) {
      const scroll=window.scrollY;
      const replacement=document.createElement("div");
      replacement.innerHTML=renderCustomers();
      panel.replaceWith(replacement.firstElementChild);
      const input=document.querySelector("[data-customer-search]");
      if(input){ input.focus(); input.setSelectionRange(start,start); }
      window.scrollTo(0,scroll);
    }
    clearTimeout(customerSearchTimer);
    customerSearchTimer=setTimeout(()=>loadCustomers({reset:true}),320);
  }
  if(event.target.dataset.bookingField) {
    const field=event.target.dataset.bookingField;
    if(state.booking[field]!==event.target.value) state.booking.idempotencyKey=null;
    state.booking[field]=event.target.value;
  }
}
function handleChange(event) {
  if(event.target.matches("[data-booking-consent]")) {
    state.booking.idempotencyKey=null;
    state.booking.consent=event.target.checked;
  }
}
function renderQuickBooking(form) {
  const data=new FormData(form);
  const name=String(data.get("name")||"").trim();
  const first=name.split(/\s+/)[0]||"";
  const initials=name.split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"NC";
  const time=String(data.get("time")||"17:00");
  const service=String(data.get("service")||"Coupe classique");
  const item={id:`A17-${Date.now().toString().slice(-4)}`,name,initials,tone:"lilac",service,staff:"Amira Ben Salem",date:"28 oct.",time,status:"confirmed",accent:""};
  state.appointments.unshift(item);state.modalOpen=false;state.view="appointments";render();showToast(t("quickAdd"));
}
document.addEventListener("click",event=>{handleClick(event);});
document.addEventListener("input",handleInput);
document.addEventListener("change",handleChange);
document.addEventListener("submit",event=>{
  if(event.target.id==="quick-booking-form"){event.preventDefault();renderQuickBooking(event.target);}
  if(event.target.id==="professional-login-form"){event.preventDefault();submitProfessionalLogin(event.target);}
  if(event.target.id==="notification-settings-form"){event.preventDefault();saveNotificationSettings(event.target);}
  if(event.target.id==="settings-profile-form"){event.preventDefault();saveProfile(event.target);}
});
if(bookingParams.get("mode")==="booking"||bookingParams.get("booking")==="1") {
  state.mode="booking";
  state.booking.loadingData=true;
  render();
  loadBookingData();
} else if(bookingParams.get("professional")==="1") {
  state.mode="login";
  render();
  openProfessionalLogin();
} else {
  render();
}
