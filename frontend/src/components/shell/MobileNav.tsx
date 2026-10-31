"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, Settings, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export function MobileNav() {
  const pathname = usePathname();
  const { establishmentSlug } = useAuth();
  const { t } = useI18n();

  const left = [
    { href: "/dashboard", key: "nav.dashboard", Icon: LayoutDashboard },
    { href: "/calendar", key: "nav.calendar", Icon: CalendarDays },
  ];
  const right = [
    { href: "/customers", key: "nav.customers", Icon: Users },
    { href: "/settings", key: "nav.settings", Icon: Settings },
  ];
  const bookHref = establishmentSlug ? `/book/${establishmentSlug}` : "/bookings";

  return (
    <nav className="mobile-bottom-nav" aria-label="Navigation mobile">
      {left.map((it) => (
        <Link key={it.href} href={it.href} className={`mobile-nav-item ${pathname === it.href ? "active" : ""}`}>
          <it.Icon size={20} strokeWidth={1.9} />
          {t(it.key)}
        </Link>
      ))}

      <Link href={bookHref} className="mobile-nav-fab" aria-label={t("share.open")}>
        <Plus size={22} strokeWidth={2.4} />
      </Link>

      {right.map((it) => (
        <Link key={it.href} href={it.href} className={`mobile-nav-item ${pathname === it.href ? "active" : ""}`}>
          <it.Icon size={20} strokeWidth={1.9} />
          {t(it.key)}
        </Link>
      ))}
    </nav>
  );
}
