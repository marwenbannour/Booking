"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { ready, me } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !me) router.replace("/login");
  }, [ready, me, router]);

  if (!ready) {
    return (
      <div className="center-screen">
        <div className="spin" aria-label="Chargement" />
      </div>
    );
  }
  if (!me) return null;

  return <>{children}</>;
}
