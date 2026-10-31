"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  dashboard: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10",
  calendar: "M8 2v4M16 2v4M3 10h18M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z",
  customers: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M22 21v-2a4 4 0 00-3-3.87",
  subscriptions: "M3 10h18M7 15h4M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z",
};

export function MobileNav() {
  const pathname = usePathname();
  const { establishmentSlug } = useAuth();
  const { t } = useI18n();

  const items = [
    { href: "/dashboard", key: "nav.dashboard", icon: ICONS.dashboard },
    { href: "/calendar", key: "nav.calendar", icon: ICONS.calendar },
    { href: "/customers", key: "nav.customers", icon: ICONS.customers },
    { href: "/subscriptions", key: "nav.subscriptions", icon: ICONS.subscriptions },
  ];

  const bookHref = establishmentSlug ? `/book/${establishmentSlug}` : "/bookings";

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation mobile">
      {items.slice(0, 2).map((it) => (
        <Link key={it.href} href={it.href} className={`mobile-nav-item ${pathname === it.href ? "active" : ""}`}>
          <Icon d={it.icon} />
          {t(it.key)}
        </Link>
      ))}

      <Link href={bookHref} className="mobile-nav-fab" aria-label={t("share.open")}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>

      {items.slice(2).map((it) => (
        <Link key={it.href} href={it.href} className={`mobile-nav-item ${pathname === it.href ? "active" : ""}`}>
          <Icon d={it.icon} />
          {t(it.key)}
        </Link>
      ))}
    </nav>
  );
}
