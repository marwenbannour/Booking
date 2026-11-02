"use client";

import Link from "next/link";
import { Check, Minus, ChevronDown, Tag } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PublicShell } from "@/components/marketing/PublicShell";
import { getMarketing } from "@/components/marketing/content";

export default function PricingPage() {
  const { lang } = useI18n();
  const c = getMarketing(lang).pricing;

  return (
    <PublicShell>
      <div className="mk-band">
        <div className="mk-wrap">
          <div className="mk-section-head">
            <span className="mk-eyebrow">
              <Tag size={15} /> {c.eyebrow}
            </span>
            <h2>{c.h2}</h2>
            <p>{c.p}</p>
          </div>

          <div className="mk-price-grid">
            {c.plans.map((plan) => (
              <article key={plan.name} className={`mk-plan ${plan.popular ? "pop" : ""}`}>
                {plan.popular && <span className="mk-plan-badge">{c.popular}</span>}
                <div className="mk-plan-name">{plan.name}</div>
                <p className="mk-plan-desc">{plan.desc}</p>
                <div className="mk-cost">
                  <b>{plan.price}</b>
                  <span>{c.perMonth}</span>
                </div>
                <ul>
                  {plan.features.map((f) => (
                    <li key={f.label} className={f.off ? "off" : ""}>
                      {f.off ? <Minus size={18} /> : <Check size={18} />} {f.label}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`${plan.popular ? "btn-primary" : "btn-quiet"} mk-block`}
                >
                  {plan.popular ? c.choose : c.start}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mk-wrap mk-band mk-tight" style={{ paddingTop: 0 }}>
        <div className="mk-faq">
          <div className="mk-section-head" style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26 }}>{c.faqH}</h2>
          </div>
          {c.faq.map((item) => (
            <details className="mk-qa" key={item.q}>
              <summary>
                <span>{item.q}</span>
                <span className="mk-chev">
                  <ChevronDown size={20} />
                </span>
              </summary>
              <div className="mk-ans">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
