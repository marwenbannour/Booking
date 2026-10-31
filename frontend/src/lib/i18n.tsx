"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "fr" | "ar";
const KEY = "booking.lang";

type Dict = Record<string, string>;

const FR: Dict = {
  "nav.dashboard": "Tableau de bord",
  "nav.bookings": "Rendez-vous",
  "nav.calendar": "Calendrier",
  "nav.customers": "Clients",
  "nav.services": "Services",
  "nav.employees": "Employés",
  "nav.subscriptions": "Abonnements",
  "nav.notifications": "Notifications",
  "nav.settings": "Paramètres",
  "common.logout": "Déconnexion",
  "common.workspace": "Espace pro",
  "common.loading": "Chargement…",
  "common.back": "Retour",
  "common.continue": "Continuer",
  "common.search": "Rechercher",
  "common.none": "Aucun résultat",
  "common.copy": "Copier",
  "common.copied": "Copié ✓",
  "common.theme.dark": "☾ Sombre",
  "common.theme.light": "☀︎ Clair",
  "share.title": "Lien de réservation",
  "share.hint": "Partagez ce lien avec vos clients pour réserver en ligne.",
  "share.open": "Ouvrir",
  "book.kicker": "Réservation en ligne",
  "book.step.service": "Service",
  "book.step.slot": "Créneau",
  "book.step.details": "Vos coordonnées",
  "book.step.confirm": "Confirmation",
  "book.chooseService": "Choisissez un service",
  "book.staffAndSlot": "Employé & créneau",
  "book.employee": "Employé",
  "book.anyEmployee": "Sans préférence",
  "book.date": "Date",
  "book.slot": "Créneau",
  "book.noSlots": "Aucun créneau disponible ce jour.",
  "book.details": "Vos coordonnées",
  "book.name": "Nom complet",
  "book.phone": "Téléphone",
  "book.email": "Email (optionnel)",
  "book.consent": "J'accepte de recevoir les rappels de rendez-vous par WhatsApp.",
  "book.confirm": "Confirmer la réservation",
  "book.booking": "Réservation…",
  "book.confirmed": "Réservation confirmée",
  "book.confirmedHint": "Un rappel WhatsApp vous sera envoyé avant le rendez-vous.",
  "book.summary": "Récapitulatif",
  "book.duration": "Durée",
  "book.price": "Prix",
};

const AR: Dict = {
  "nav.dashboard": "لوحة التحكم",
  "nav.bookings": "المواعيد",
  "nav.calendar": "التقويم",
  "nav.customers": "العملاء",
  "nav.services": "الخدمات",
  "nav.employees": "الموظفون",
  "nav.subscriptions": "الاشتراكات",
  "nav.notifications": "الإشعارات",
  "nav.settings": "الإعدادات",
  "common.logout": "تسجيل الخروج",
  "common.workspace": "مساحة العمل",
  "common.loading": "جارٍ التحميل…",
  "common.back": "رجوع",
  "common.continue": "متابعة",
  "common.search": "بحث",
  "common.none": "لا توجد نتائج",
  "common.copy": "نسخ",
  "common.copied": "تم النسخ ✓",
  "common.theme.dark": "☾ داكن",
  "common.theme.light": "☀︎ فاتح",
  "share.title": "رابط الحجز",
  "share.hint": "شارك هذا الرابط مع عملائك للحجز عبر الإنترنت.",
  "share.open": "فتح",
  "book.kicker": "الحجز عبر الإنترنت",
  "book.step.service": "الخدمة",
  "book.step.slot": "الموعد",
  "book.step.details": "بياناتك",
  "book.step.confirm": "التأكيد",
  "book.chooseService": "اختر خدمة",
  "book.staffAndSlot": "الموظف والموعد",
  "book.employee": "الموظف",
  "book.anyEmployee": "بدون تفضيل",
  "book.date": "التاريخ",
  "book.slot": "الموعد",
  "book.noSlots": "لا توجد مواعيد متاحة في هذا اليوم.",
  "book.details": "بياناتك",
  "book.name": "الاسم الكامل",
  "book.phone": "الهاتف",
  "book.email": "البريد الإلكتروني (اختياري)",
  "book.consent": "أوافق على تلقّي تذكيرات المواعيد عبر واتساب.",
  "book.confirm": "تأكيد الحجز",
  "book.booking": "جارٍ الحجز…",
  "book.confirmed": "تم تأكيد الحجز",
  "book.confirmedHint": "سيتم إرسال تذكير عبر واتساب قبل الموعد.",
  "book.summary": "الملخّص",
  "book.duration": "المدة",
  "book.price": "السعر",
};

const DICTS: Record<Lang, Dict> = { fr: FR, ar: AR };

interface I18nState {
  lang: Lang;
  dir: "ltr" | "rtl";
  t: (key: string) => string;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nState | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    let stored: Lang | null = null;
    try {
      stored = localStorage.getItem(KEY) as Lang | null;
    } catch {
      /* ignore */
    }
    if (stored === "fr" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback((key: string) => DICTS[lang][key] ?? DICTS.fr[key] ?? key, [lang]);

  const value: I18nState = { lang, dir: lang === "ar" ? "rtl" : "ltr", t, setLang };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans un <I18nProvider>");
  return ctx;
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button className="btn-quiet" onClick={() => setLang(lang === "fr" ? "ar" : "fr")}>
      {lang === "fr" ? "العربية" : "Français"}
    </button>
  );
}
