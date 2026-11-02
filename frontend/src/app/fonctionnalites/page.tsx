"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  MessageCircle,
  BarChart3,
  Check,
  Scissors,
  Palette,
  Sparkles,
  CheckCheck,
  Clock,
  Users,
  Globe,
  Building2,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PublicShell } from "@/components/marketing/PublicShell";
import { getMarketing } from "@/components/marketing/content";

const SPLIT_ICONS = [CalendarDays, MessageCircle, BarChart3];
const MORE_ICONS = [Users, Clock, Globe, Building2, CreditCard, ShieldCheck];

export default function FeaturesPage() {
  const { lang } = useI18n();
  const c = getMarketing(lang).features;

  return (
    <PublicShell>
      <div className="mk-band mk-alt mk-tight">
        <div className="mk-wrap mk-section-head">
          <span className="mk-eyebrow">{c.eyebrow}</span>
          <h2>{c.h2}</h2>
          <p>{c.p}</p>
        </div>
      </div>

      <div className="mk-wrap mk-band">
        {c.splits.map((s, i) => {
          const Icon = SPLIT_ICONS[i];
          return (
            <div key={s.title} className={`mk-split ${i % 2 === 1 ? "rev" : ""}`}>
              <div className="mk-split-txt">
                <span className="mk-eyebrow">
                  <Icon size={15} /> {s.eyebrow}
                </span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <ul className="mk-f-list">
                  {s.points.map((pt) => (
                    <li key={pt}>
                      <Check size={16} /> {pt}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mk-split-visual">{i === 0 ? <VisualServices /> : i === 1 ? <VisualWhatsapp /> : <VisualDashboard />}</div>
            </div>
          );
        })}
      </div>

      <div className="mk-band mk-alt">
        <div className="mk-wrap">
          <div className="mk-section-head">
            <h2>{c.moreH}</h2>
          </div>
          <div className="mk-grid-3">
            {c.more.map((m, i) => {
              const Icon = MORE_ICONS[i];
              return (
                <article key={m.title} className="mk-card">
                  <div className="mk-f-ic">
                    <Icon size={24} />
                  </div>
                  <h3>{m.title}</h3>
                  <p>{m.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

function VisualServices() {
  const rows: [ReactNode, string, string, string][] = [
    [<Scissors size={17} key="a" />, "Coupe + Brushing", "45 min", "40 DT"],
    [<Palette size={17} key="b" />, "Coloration", "90 min", "80 DT"],
    [<Sparkles size={17} key="c" />, "Soin du visage", "60 min", "70 DT"],
  ];
  return (
    <div className="mk-card mk-pad-sm">
      <div className="mk-mock">
        <div className="mk-mock-top"><i /><i /><i /></div>
        <div className="mk-mock-screen">
          {rows.map(([ic, n, d, p]) => (
            <div className="mk-mini-row" key={n}>
              <span className="mk-mini-av">{ic}</span>
              <div><b>{n}</b><small>{d}</small></div>
              <span className="mk-price">{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VisualWhatsapp() {
  return (
    <div className="mk-card mk-pad-sm">
      <div className="mk-mock">
        <div className="mk-mock-top"><i /><i /><i /></div>
        <div className="mk-mock-screen" style={{ gap: 10 }}>
          <div className="mk-wa-note">
            <span className="ic"><MessageCircle size={17} /></span>
            <p><b>Rappel 24h</b> — Bonjour {"{nom}"}, rappel de votre RDV demain à {"{heure}"}. Merci de confirmer.</p>
          </div>
          <div className="mk-mini-row">
            <span className="mk-mini-av green"><CheckCheck size={17} /></span>
            <div><b>Confirmation</b><small>Programmé · à la réservation</small></div>
            <span className="mk-pill ok">Actif</span>
          </div>
          <div className="mk-mini-row">
            <span className="mk-mini-av green"><Clock size={17} /></span>
            <div><b>Rappel 2h avant</b><small>Programmé</small></div>
            <span className="mk-pill ok">Actif</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualDashboard() {
  const bars = [40, 65, 50, 80, 70, 95, 60];
  return (
    <div className="mk-card" style={{ padding: 22 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div className="mk-mini-stat">
          <small>Rendez-vous</small>
          <div className="v">128</div>
          <small className="up">+12% ce mois</small>
        </div>
        <div className="mk-mini-stat">
          <small>Chiffre d'affaires</small>
          <div className="v">4 580 DT</div>
          <small className="up">+8% ce mois</small>
        </div>
      </div>
      <div className="mk-bars">
        {bars.map((h, i) => (
          <div key={i} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}
