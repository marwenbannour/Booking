"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n, LanguageToggle } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { MobileNav } from "./MobileNav";

const NAV = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/calendar", key: "nav.calendar" },
  { href: "/bookings", key: "nav.bookings" },
  { href: "/customers", key: "nav.customers" },
  { href: "/services", key: "nav.services" },
  { href: "/employees", key: "nav.employees" },
  { href: "/subscriptions", key: "nav.subscriptions" },
];

export function AppShell({ title, subtitle, actions, children }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { me, establishmentName, signOut } = useAuth();
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
          <span className="brand-mark">HB</span>
          <span className="brand-name">
            Hair<span>Book</span>
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
            <span className="brand-mark">HB</span>
            <span>Hair<span style={{ color: "var(--brand)" }}>Book</span></span>
          </div>
          <div className="breadcrumb">
            {t("common.workspace")} · <strong>{title}</strong>
          </div>
          <div className="top-actions">
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
