"use client";

import { useState, type FormEvent } from "react";
import {
  LifeBuoy,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Send,
  ChevronDown,
  User,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { PublicShell } from "@/components/marketing/PublicShell";
import { getMarketing } from "@/components/marketing/content";

export default function ContactPage() {
  const { lang } = useI18n();
  const c = getMarketing(lang).contact;
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.currentTarget.reset();
    setSent(true);
    window.setTimeout(() => setSent(false), 4000);
  }

  return (
    <PublicShell>
      <div className="mk-band mk-alt mk-tight">
        <div className="mk-wrap mk-section-head">
          <span className="mk-eyebrow">
            <LifeBuoy size={15} /> {c.eyebrow}
          </span>
          <h2>{c.h2}</h2>
          <p>{c.p}</p>
        </div>
      </div>

      <div className="mk-wrap mk-band">
        <div className="mk-contact-grid">
          <div>
            <h3 className="mk-contact-h">{c.reach}</h3>
            <div className="mk-ct-item">
              <div className="mk-f-ic sm"><Mail size={20} /></div>
              <div><b>{c.email}</b><p>contact@bookingplus.tn</p></div>
            </div>
            <div className="mk-ct-item">
              <div className="mk-f-ic sm green"><MessageCircle size={20} /></div>
              <div><b>{c.whatsapp}</b><p>+216 50 123 456</p></div>
            </div>
            <div className="mk-ct-item">
              <div className="mk-f-ic sm"><MapPin size={20} /></div>
              <div><b>{c.address}</b><p>{c.addressValue}</p></div>
            </div>
            <div className="mk-ct-item">
              <div className="mk-f-ic sm"><Clock size={20} /></div>
              <div><b>{c.hours}</b><p>{c.hoursValue}</p></div>
            </div>
          </div>

          <div className="mk-card" style={{ padding: 24 }}>
            <h3 className="mk-contact-h" style={{ fontSize: 19 }}>{c.formTitle}</h3>
            {sent && <p className="mk-form-ok">{c.sent}</p>}
            <form onSubmit={onSubmit} className="mk-form">
              <div className="field">
                <label>{c.name}</label>
                <div className="mk-inp">
                  <User size={18} />
                  <input required placeholder={c.name} />
                </div>
              </div>
              <div className="field">
                <label>Email</label>
                <div className="mk-inp">
                  <Mail size={18} />
                  <input type="email" required placeholder="vous@exemple.com" />
                </div>
              </div>
              <div className="field">
                <label>{c.message}</label>
                <textarea required rows={4} placeholder={`${c.message}…`} />
              </div>
              <button type="submit" className="btn-primary mk-block">
                <Send size={17} /> {c.send}
              </button>
            </form>
          </div>
        </div>

        <div className="mk-faq" style={{ marginTop: 64 }}>
          <div className="mk-section-head" style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26 }}>{c.faqH}</h2>
          </div>
          {c.faq.map((item, i) => (
            <details className="mk-qa" key={item.q} open={i === 0}>
              <summary>
                <span>{item.q}</span>
                <span className="mk-chev"><ChevronDown size={20} /></span>
              </summary>
              <div className="mk-ans">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
