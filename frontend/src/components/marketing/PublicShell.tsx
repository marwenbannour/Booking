"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Instagram, Facebook, Linkedin } from "lucide-react";
import { useI18n, LanguageToggle } from "@/lib/i18n";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { getMarketing } from "./content";

function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link href="/" className="mk-brand" aria-label="Booking+">
      <span className="brand-mark">B+</span>
      {!small && (
        <span className="mk-brand-name">
          Booking<span>+</span>
          <small>WhatsApp Reminders</small>
        </span>
      )}
    </Link>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const pathname = usePathname();
  const c = getMarketing(lang);
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: c.nav.home },
    { href: "/fonctionnalites", label: c.nav.features },
    { href: "/tarifs", label: c.nav.pricing },
    { href: "/contact", label: c.nav.contact },
  ];

  return (
    <div className="mk-root">
      <header className="mk-header">
        <div className="mk-nav">
          <Brand />
          <nav className={`mk-links ${open ? "open" : ""}`}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={pathname === l.href ? "active" : ""}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mk-nav-right">
            <ThemeToggle />
            <LanguageToggle />
            <Link href="/login" className="btn-quiet mk-hide-sm">
              {c.cta.login}
            </Link>
            <Link href="/register" className="btn-primary mk-hide-sm">
              {c.cta.signup}
            </Link>
            <button
              type="button"
              className="btn-quiet mk-burger"
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mk-main">{children}</main>

      <footer className="mk-footer">
        <div className="mk-footer-inner">
          <div className="mk-foot-grid">
            <div>
              <Brand />
              <p className="mk-foot-tag">{c.footer.tagline}</p>
            </div>
            <div className="mk-foot-col">
              <h4>{c.footer.product}</h4>
              <Link href="/fonctionnalites">{c.nav.features}</Link>
              <Link href="/tarifs">{c.nav.pricing}</Link>
              <Link href="/login">{c.cta.login}</Link>
            </div>
            <div className="mk-foot-col">
              <h4>{c.footer.company}</h4>
              <Link href="/contact">{c.nav.contact}</Link>
              <Link href="/contact">{c.footer.faq}</Link>
              <Link href="/register">{c.cta.signup}</Link>
            </div>
            <div className="mk-foot-col">
              <h4>{c.footer.legal}</h4>
              <Link href="/contact">{c.footer.terms}</Link>
              <Link href="/contact">{c.footer.privacy}</Link>
            </div>
          </div>
          <div className="mk-foot-bottom">
            <span>© 2026 Booking+. {c.footer.rights}</span>
            <div className="mk-foot-social">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <Instagram size={17} />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <Facebook size={17} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <Linkedin size={17} />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { Brand };
