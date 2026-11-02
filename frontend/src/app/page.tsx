"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Sparkles,
  Rocket,
  LogIn,
  CheckCircle2,
  CalendarDays,
  MessageCircle,
  BarChart3,
  Check,
  Scissors,
  Palette,
  Zap,
  ArrowRight,
  Stethoscope,
  Flower2,
  Dumbbell,
  Smile,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PublicShell } from "@/components/marketing/PublicShell";
import { getMarketing } from "@/components/marketing/content";

const ADV_ICONS = [CalendarDays, MessageCircle, BarChart3];

export default function HomePage() {
  const { lang } = useI18n();
  const c = getMarketing(lang).home;

  return (
    <PublicShell>
      {/* hero */}
      <section className="mk-band mk-hero">
        <span className="mk-blob a" />
        <span className="mk-blob b" />
        <div className="mk-wrap mk-hero-grid">
          <div>
            <span className="mk-badge">
              <Sparkles size={14} /> {c.badge}
            </span>
            <h1 className="mk-h1">
              {c.h1a} <span className="mk-hl">{c.h1b}</span>
            </h1>
            <p className="mk-lede">{c.lede}</p>
            <div className="mk-cta-row">
              <Link href="/register" className="btn-primary mk-btn-lg">
                <Rocket size={18} /> {c.cta1}
              </Link>
              <Link href="/login" className="btn-quiet mk-btn-lg">
                <LogIn size={18} /> {c.cta2}
              </Link>
            </div>
            <div className="mk-trust">
              {c.trust.map((tx) => (
                <span key={tx}>
                  <CheckCircle2 size={15} /> {tx}
                </span>
              ))}
            </div>
          </div>
          <div className="mk-hero-visual">
            <div className="mk-mock">
              <div className="mk-mock-top">
                <i /> <i /> <i />
              </div>
              <div className="mk-mock-screen">
                <MockRow icon={<Scissors size={17} />} name="Sofia Martin" sub="Coupe + Brushing · 10:00" ok />
                <MockRow icon={<Palette size={17} />} name="Karim Jebali" sub="Coloration · 11:30" ok />
                <MockRow icon={<Sparkles size={17} />} name="Nour Slim" sub="Soin du visage · 14:00" />
                <MockRow icon={<Zap size={17} />} name="Yassine Ammar" sub="Épilation laser · 16:00" ok />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* logos */}
      <div className="mk-wrap mk-band mk-tight" style={{ paddingTop: 0 }}>
        <p className="mk-logos-label">{c.logosLabel}</p>
        <div className="mk-logos">
          <span><Scissors size={18} /> Beauty Studio</span>
          <span><Stethoscope size={18} /> Clinique Nour</span>
          <span><Flower2 size={18} /> Spa Jasmin</span>
          <span><Dumbbell size={18} /> FitZone</span>
          <span><Smile size={18} /> Dental Care</span>
        </div>
      </div>

      {/* avantages */}
      <div className="mk-band mk-alt">
        <div className="mk-wrap">
          <div className="mk-section-head">
            <span className="mk-eyebrow">{c.advEyebrow}</span>
            <h2>{c.advH2}</h2>
            <p>{c.advP}</p>
          </div>
          <div className="mk-grid-3">
            {c.adv.map((a, i) => {
              const Icon = ADV_ICONS[i];
              return (
                <article key={a.title} className="mk-card">
                  <div className={`mk-f-ic ${i === 1 ? "green" : ""}`}>
                    <Icon size={24} />
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.text}</p>
                  <ul className="mk-f-list">
                    {a.points.map((pt) => (
                      <li key={pt}>
                        <Check size={16} /> {pt}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
          <div className="mk-stat-row">
            {c.stats.map((s) => (
              <div key={s.label} className="mk-stat">
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mk-wrap mk-band">
        <div className="mk-cta-band">
          <span className="mk-blob a" />
          <h2>{c.ctaH2}</h2>
          <p>{c.ctaP}</p>
          <div className="mk-cta-row mk-center">
            <Link href="/register" className="btn-primary mk-btn-lg">
              <Rocket size={18} /> {c.ctaBtn1}
            </Link>
            <Link href="/tarifs" className="btn-quiet mk-btn-lg mk-on-dark">
              {c.ctaBtn2} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}

function MockRow({
  icon,
  name,
  sub,
  ok,
}: {
  icon: ReactNode;
  name: string;
  sub: string;
  ok?: boolean;
}) {
  return (
    <div className="mk-mini-row">
      <span className="mk-mini-av">{icon}</span>
      <div>
        <b>{name}</b>
        <small>{sub}</small>
      </div>
      <span className={`mk-pill ${ok ? "ok" : "wait"}`}>{ok ? "Confirmé" : "En attente"}</span>
    </div>
  );
}
