import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

export type AppLocale = 'fr' | 'ar';

const LOCALE_STORAGE_KEY = 'app-locale-v1';

const translations = {
  fr: {
    'brand.tagline': 'Réservez. Organisez. Ne ratez plus.',
    'brand.bookings': 'Mes réservations',
    'brand.viewBookings': 'Voir mes rendez-vous',
    'home.eyebrow': 'VOTRE ESPACE BOOK&WHATS',
    'home.greeting': 'Bonjour 👋',
    'home.subtitle': 'Votre prochain rendez-vous, en quelques gestes.',
    'home.ready': 'Tout est prêt chez {name}.',
    'home.heroBadge': 'RÉSERVATION EN LIGNE',
    'home.heroTitle': 'Votre temps est précieux.',
    'home.heroCopy': 'Trouvez le bon service et réservez votre créneau en quelques gestes.',
    'home.book': 'Réserver un rendez-vous',
    'home.quick': 'Accès rapide',
    'home.chooseService': 'Choisir un service',
    'home.myBookings': 'Mes rendez-vous',
    'home.viewBookings': 'Voir mes réservations',
    'home.whatsapp': 'Rappels WhatsApp',
    'home.withConsent': 'Avec votre accord',
    'home.privacy': 'Données protégées',
    'home.secureBooking': 'Réservation sécurisée',
    'home.nextBooking': 'PROCHAIN RENDEZ-VOUS',
    'home.popularServices': 'Services populaires',
    'home.seeAll': 'Voir tout',
    'home.configure': 'Configurez votre établissement',
    'home.configureHint': 'Ajoutez EXPO_PUBLIC_ESTABLISHMENT_SLUG dans mobile/.env pour afficher vos services.',
    'home.loadServices': 'Chargement des services…',
    'home.noServices': 'Aucun service n’est disponible pour le moment.',
    'home.serviceDuration': '{minutes} min',
    'home.priceOnRequest': 'Prix sur demande',
    'booking.new': 'NOUVELLE RÉSERVATION',
    'booking.serviceTitle': 'Choisissez un service',
    'booking.slotTitle': 'Choisissez votre créneau',
    'booking.detailsTitle': 'Vos coordonnées',
    'booking.serviceHint': 'Quelle prestation souhaitez-vous ?',
    'booking.slotHint': 'Sélectionnez un jour et une heure.',
    'booking.detailsHint': 'Pour confirmer votre rendez-vous.',
    'booking.home': 'Accueil',
    'booking.back': 'Retour',
    'booking.changeService': 'Changer de service',
    'booking.configureHint': 'Ajoutez EXPO_PUBLIC_ESTABLISHMENT_SLUG dans mobile/.env pour afficher vos services.',
    'booking.loadServices': 'Chargement des services…',
    'booking.noServices': 'Aucun service à réserver pour le moment.',
    'booking.professional': 'Professionnel',
    'booking.noPreference': 'Sans préférence',
    'booking.chooseDay': 'Choisissez un jour',
    'booking.availableTimes': 'Heures disponibles',
    'booking.searchSlots': 'Recherche des créneaux…',
    'booking.noSlots': 'Aucun créneau disponible ce jour. Essayez une autre date.',
    'booking.continue': 'Continuer',
    'booking.fullName': 'Nom complet *',
    'booking.fullNamePlaceholder': 'Ex. Ahmed Ben Ali',
    'booking.phone': 'Téléphone *',
    'booking.phonePlaceholder': '+216 00 000 000',
    'booking.email': 'E-mail',
    'booking.optional': '(facultatif)',
    'booking.emailPlaceholder': 'vous@exemple.com',
    'booking.consent': 'J’accepte de recevoir des rappels de rendez-vous par WhatsApp. (facultatif)',
    'booking.sending': 'Envoi en cours…',
    'booking.confirm': 'Confirmer la réservation',
    'booking.confirmed': 'Réservation enregistrée !',
    'booking.sentTo': 'Votre demande a bien été envoyée à {name}.',
    'booking.reference': 'RÉFÉRENCE',
    'booking.homeButton': 'Retour à l’accueil',
    'booking.rescheduleTitle': 'Demander un changement de rendez-vous',
    'booking.rescheduleSubmit': 'Envoyer la demande',
    'booking.rescheduleSending': 'Envoi en cours…',
    'booking.reschedulePending': 'Votre demande a été envoyée. Le rendez-vous actuel reste confirmé jusqu’à la réponse de l’établissement.',
    'booking.cancelReschedule': 'Annuler',
    'booking.step': 'ÉTAPE {current} SUR 3',
    'appointments.eyebrow': 'VOTRE ESPACE',
    'appointments.title': 'Mes réservations',
    'appointments.subtitle': 'Retrouvez vos reçus enregistrés en toute sécurité sur cet appareil.',
    'appointments.loading': 'Chargement de vos reçus…',
    'appointments.upcoming': 'À venir',
    'appointments.history': 'Historique',
    'appointments.past': 'RENDEZ-VOUS PASSÉ',
    'appointments.future': 'RENDEZ-VOUS À VENIR',
    'appointments.pastStatus': 'Passé',
    'appointments.confirmed': 'Confirmé',
    'appointments.reference': 'RÉFÉRENCE',
    'appointments.localNotice': 'Les 5 derniers reçus sont conservés sur cet appareil. Ils ne sont pas synchronisés avec le serveur.',
    'appointments.emptyTitle': 'Aucune réservation enregistrée',
    'appointments.emptyHint': 'Vos reçus apparaîtront ici après confirmation d’un rendez-vous.',
    'appointments.bookNow': 'Réserver maintenant',
    'profile.eyebrow': 'VOTRE ESPACE',
    'profile.title': 'Profil',
    'profile.subtitle': 'Vos informations et préférences.',
    'profile.welcome': 'Bienvenue sur Booking+',
    'profile.welcomeHint': 'Réservez simplement auprès de vos professionnels préférés.',
    'profile.establishment': 'Établissement',
    'profile.language': 'Langue',
    'profile.whatsapp': 'Rappels WhatsApp',
    'profile.whatsappValue': 'Selon votre consentement',
    'profile.privacy': 'Données personnelles',
    'profile.privacyValue': 'Gérées en sécurité',
    'profile.francais': 'Français',
    'profile.arabic': 'العربية',
    'profile.chooseLanguage': 'Langue de l’application',
    'tabs.home': 'Accueil',
    'tabs.bookings': 'Réservations',
    'tabs.profile': 'Profil',
    'status.loading': 'Chargement…',
    'status.unavailable': 'Indisponible',
    'status.notConfigured': 'Non configuré',
    'error.name': 'Saisissez votre nom (2 caractères minimum).',
    'error.phone': 'Saisissez un numéro de téléphone valide.',
    'error.slot': 'Ce créneau n’est plus disponible. Choisissez-en un autre.',
    'error.establishment': 'Impossible de charger cet établissement.',
    'error.professionals': 'Impossible de charger les professionnels.',
    'error.availability': 'Les créneaux sont indisponibles.',
    'error.booking': 'La réservation est impossible pour le moment.',
    'error.rescheduleToken': 'Le jeton de gestion de cette réservation est indisponible.',
    'error.reschedule': 'Impossible d’envoyer la demande de changement.',
    'error.invalidReceipt': 'Le reçu local est illisible. Il sera supprimé.',
    'error.invalidReceipts': 'Certains reçus locaux étaient illisibles et ont été supprimés.',
    'error.readReceipts': 'Impossible de lire les reçus enregistrés.',
    'error.saveReceipt': 'Impossible d’enregistrer le reçu sur cet appareil.',
  },
  ar: {
    'brand.tagline': 'احجز ونظّم مواعيدك بسهولة',
    'brand.bookings': 'حجوزاتي',
    'brand.viewBookings': 'عرض مواعيدي',
    'home.eyebrow': 'مساحتك في بوك آند واتس',
    'home.greeting': 'مرحبًا 👋',
    'home.subtitle': 'موعدك القادم على بُعد خطوات.',
    'home.ready': 'كل شيء جاهز لدى {name}.',
    'home.heroBadge': 'الحجز عبر الإنترنت',
    'home.heroTitle': 'وقتك ثمين.',
    'home.heroCopy': 'اختر الخدمة المناسبة واحجز موعدك بخطوات بسيطة.',
    'home.book': 'احجز موعدًا',
    'home.quick': 'وصول سريع',
    'home.chooseService': 'اختر خدمة',
    'home.myBookings': 'مواعيدي',
    'home.viewBookings': 'عرض الحجوزات',
    'home.whatsapp': 'تذكيرات واتساب',
    'home.withConsent': 'بموافقتك',
    'home.privacy': 'بيانات محمية',
    'home.secureBooking': 'حجز آمن',
    'home.nextBooking': 'موعدك القادم',
    'home.popularServices': 'الخدمات الشائعة',
    'home.seeAll': 'عرض الكل',
    'home.configure': 'أكمل إعداد المنشأة',
    'home.configureHint': 'أضف EXPO_PUBLIC_ESTABLISHMENT_SLUG في mobile/.env لعرض الخدمات.',
    'home.loadServices': 'جارٍ تحميل الخدمات…',
    'home.noServices': 'لا توجد خدمات متاحة حاليًا.',
    'home.serviceDuration': '{minutes} دقيقة',
    'home.priceOnRequest': 'السعر عند الطلب',
    'booking.new': 'حجز جديد',
    'booking.serviceTitle': 'اختر خدمة',
    'booking.slotTitle': 'اختر موعدك',
    'booking.detailsTitle': 'بياناتك',
    'booking.serviceHint': 'ما الخدمة التي ترغب بها؟',
    'booking.slotHint': 'اختر اليوم والوقت المناسبين.',
    'booking.detailsHint': 'أدخل بياناتك لتأكيد الموعد.',
    'booking.home': 'الرئيسية',
    'booking.back': 'رجوع',
    'booking.changeService': 'تغيير الخدمة',
    'booking.configureHint': 'أضف EXPO_PUBLIC_ESTABLISHMENT_SLUG في mobile/.env لعرض الخدمات.',
    'booking.loadServices': 'جارٍ تحميل الخدمات…',
    'booking.noServices': 'لا توجد خدمات متاحة للحجز حاليًا.',
    'booking.professional': 'المختص',
    'booking.noPreference': 'بدون تفضيل',
    'booking.chooseDay': 'اختر يومًا',
    'booking.availableTimes': 'الأوقات المتاحة',
    'booking.searchSlots': 'جارٍ البحث عن المواعيد…',
    'booking.noSlots': 'لا توجد مواعيد متاحة في هذا اليوم. جرّب يومًا آخر.',
    'booking.continue': 'متابعة',
    'booking.fullName': 'الاسم الكامل *',
    'booking.fullNamePlaceholder': 'مثال: أحمد بن علي',
    'booking.phone': 'رقم الهاتف *',
    'booking.phonePlaceholder': '+216 00 000 000',
    'booking.email': 'البريد الإلكتروني',
    'booking.optional': '(اختياري)',
    'booking.emailPlaceholder': 'name@example.com',
    'booking.consent': 'أوافق على تلقي تذكيرات المواعيد عبر واتساب. (اختياري)',
    'booking.sending': 'جارٍ الإرسال…',
    'booking.confirm': 'تأكيد الحجز',
    'booking.confirmed': 'تم تسجيل الحجز!',
    'booking.sentTo': 'تم إرسال طلبك إلى {name}.',
    'booking.reference': 'رقم الحجز',
    'booking.homeButton': 'العودة إلى الرئيسية',
    'booking.rescheduleTitle': 'طلب تغيير الموعد',
    'booking.rescheduleSubmit': 'إرسال الطلب',
    'booking.rescheduleSending': 'جارٍ الإرسال…',
    'booking.reschedulePending': 'تم إرسال طلبك. يبقى الموعد الحالي مؤكّدًا إلى أن تردّ المنشأة.',
    'booking.cancelReschedule': 'إلغاء',
    'booking.step': 'الخطوة {current} من 3',
    'appointments.eyebrow': 'مساحتك',
    'appointments.title': 'حجوزاتي',
    'appointments.subtitle': 'إيصالات حجوزاتك محفوظة بأمان على هذا الجهاز.',
    'appointments.loading': 'جارٍ تحميل الإيصالات…',
    'appointments.upcoming': 'المواعيد القادمة',
    'appointments.history': 'السجل',
    'appointments.past': 'موعد سابق',
    'appointments.future': 'موعد قادم',
    'appointments.pastStatus': 'منتهٍ',
    'appointments.confirmed': 'مؤكد',
    'appointments.reference': 'رقم الحجز',
    'appointments.localNotice': 'تُحفظ آخر 5 إيصالات على هذا الجهاز ولا تتم مزامنتها مع الخادم.',
    'appointments.emptyTitle': 'لا توجد حجوزات محفوظة',
    'appointments.emptyHint': 'ستظهر إيصالاتك هنا بعد تأكيد الموعد.',
    'appointments.bookNow': 'احجز الآن',
    'profile.eyebrow': 'مساحتك',
    'profile.title': 'الملف الشخصي',
    'profile.subtitle': 'معلوماتك وتفضيلاتك.',
    'profile.welcome': 'مرحبًا بك في Booking+',
    'profile.welcomeHint': 'احجز بسهولة لدى مقدمي الخدمات المفضلين لديك.',
    'profile.establishment': 'المنشأة',
    'profile.language': 'اللغة',
    'profile.whatsapp': 'تذكيرات واتساب',
    'profile.whatsappValue': 'حسب موافقتك',
    'profile.privacy': 'البيانات الشخصية',
    'profile.privacyValue': 'تُدار بأمان',
    'profile.francais': 'Français',
    'profile.arabic': 'العربية',
    'profile.chooseLanguage': 'لغة التطبيق',
    'tabs.home': 'الرئيسية',
    'tabs.bookings': 'حجوزاتي',
    'tabs.profile': 'حسابي',
    'status.loading': 'جارٍ التحميل…',
    'status.unavailable': 'غير متاح',
    'status.notConfigured': 'غير مُعدّ',
    'error.name': 'أدخل اسمك (حرفان على الأقل).',
    'error.phone': 'أدخل رقم هاتف صحيحًا.',
    'error.slot': 'لم يعد هذا الموعد متاحًا. اختر موعدًا آخر.',
    'error.establishment': 'تعذّر تحميل بيانات المنشأة.',
    'error.professionals': 'تعذّر تحميل المختصين.',
    'error.availability': 'المواعيد غير متاحة حاليًا.',
    'error.booking': 'تعذّر إتمام الحجز الآن.',
    'error.rescheduleToken': 'رمز إدارة هذا الحجز غير متاح.',
    'error.reschedule': 'تعذّر إرسال طلب تغيير الموعد.',
    'error.invalidReceipt': 'تعذّرت قراءة الإيصال المحلي. سيتم حذفه.',
    'error.invalidReceipts': 'تعذّرت قراءة بعض الإيصالات المحلية وتم حذفها.',
    'error.readReceipts': 'تعذّرت قراءة الإيصالات المحفوظة.',
    'error.saveReceipt': 'تعذّر حفظ الإيصال على هذا الجهاز.',
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;

interface LocaleContextValue {
  locale: AppLocale;
  isRtl: boolean;
  toggleLocale: () => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocale] = useState<AppLocale>('fr');
  const userSelectedLocale = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  }, [locale]);

  useEffect(() => {
    const storedLocale = Platform.OS === 'web'
      ? window.localStorage.getItem(LOCALE_STORAGE_KEY)
      : SecureStore.getItemAsync(LOCALE_STORAGE_KEY);
    Promise.resolve(storedLocale)
      .then((stored) => {
        if (!userSelectedLocale.current && (stored === 'fr' || stored === 'ar')) setLocale(stored);
      })
      .catch((cause: unknown) => {
        console.error('Unable to load the saved app language.', cause);
      });
  }, []);

  const toggleLocale = useCallback(() => {
    userSelectedLocale.current = true;
    const next = locale === 'fr' ? 'ar' : 'fr';
    setLocale(next);
    const saveLocale = Platform.OS === 'web'
      ? Promise.resolve().then(() => window.localStorage.setItem(LOCALE_STORAGE_KEY, next))
      : SecureStore.setItemAsync(LOCALE_STORAGE_KEY, next);
    saveLocale.catch((cause: unknown) => {
        console.error('Unable to save the selected app language.', cause);
      });
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, values: Record<string, string | number> = {}) => {
      let value: string = translations[locale][key];
      for (const [name, replacement] of Object.entries(values)) {
        value = value.split(`{${name}}`).join(String(replacement));
      }
      return value;
    },
    [locale],
  );

  const contextValue = useMemo(
    () => ({ locale, isRtl: locale === 'ar', toggleLocale, t }),
    [locale, toggleLocale, t],
  );

  return <LocaleContext.Provider value={contextValue}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within LocaleProvider.');
  return context;
}
