"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n, LanguageToggle } from "@/lib/i18n";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Users,
  Scissors,
  UserCog,
  CreditCard,
  Bell,
  Settings,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/dashboard", key: "nav.dashboard", Icon: LayoutDashboard },
  { href: "/calendar", key: "nav.calendar", Icon: CalendarDays },
  { href: "/bookings", key: "nav.bookings", Icon: CalendarCheck },
  { href: "/customers", key: "nav.customers", Icon: Users },
  { href: "/services", key: "nav.services", Icon: Scissors },
  { href: "/employees", key: "nav.employees", Icon: UserCog },
  { href: "/subscriptions", key: "nav.subscriptions", Icon: CreditCard },
  { href: "/notifications", key: "nav.notifications", Icon: Bell },
  { href: "/settings", key: "nav.settings", Icon: Settings },
  { href: "/account", key: "Mon compte", Icon: UserRound },
];

export function AppShell({ title, subtitle, actions, children }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    me,
    establishmentId,
    establishmentName,
    selectEstablishment,
    signOut,
  } = useAuth();
  const { t } = useI18n();

  const initials = (establishmentName ?? "Booking")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">B&amp;W</span>
          <span className="brand-name">
            Book<span>&amp;Whats</span>
          </span>
        </div>
        <p className="workspace-label">{establishmentName ?? t("common.workspace")}</p>
        <nav className="nav-list">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? "active" : ""}`}
            >
              <item.Icon size={17} strokeWidth={1.8} />
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-mini">
            <span className="avatar">{initials}</span>
            <div className="profile-copy">
              <strong>{me?.email ?? "Utilisateur"}</strong>
              <small>{me?.memberships?.[0]?.role ?? "—"}</small>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div className="topbar-brand">
            <span className="brand-mark">B&amp;W</span>
            <span>Book<span style={{ color: "var(--teal)" }}>&amp;Whats</span></span>
          </div>
          <div className="breadcrumb">
            {t("common.workspace")} · <strong>{title}</strong>
          </div>
          <div className="top-actions">
            {(me?.memberships.length ?? 0) > 1 && (
              <select
                aria-label="Établissement actif"
                value={establishmentId ?? ""}
                onChange={(event) => selectEstablishment(event.target.value)}
              >
                {me?.memberships.map((membership) => (
                  <option
                    key={membership.establishment.id}
                    value={membership.establishment.id}
                  >
                    {membership.establishment.name}
                  </option>
                ))}
              </select>
            )}
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="quiet" onClick={handleSignOut}>
              {t("common.logout")}
            </Button>
          </div>
        </header>

        <main className="content">
          <div className="page-heading">
            <div>
              <h1 className="t-h1">{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {actions && <div className="heading-actions">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
