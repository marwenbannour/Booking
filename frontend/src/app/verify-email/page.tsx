"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { LanguageToggle, useI18n } from "@/lib/i18n";

export default function VerifyEmailPage() {
  const { t } = useI18n();
  const [messageKey, setMessageKey] = useState("auth.verifyInProgress");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setError("auth.verifyIncomplete");
      return;
    }
    void api
      .verifyEmail(token)
      .then(() => setMessageKey("auth.emailVerified"))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "auth.verifyFailed"),
      );
  }, []);

  return (
    <div className="center-screen">
      <div className="auth-pane stack">
        <div className="row" style={{ justifyContent: "flex-end" }}><LanguageToggle /></div>
        <h1 className="t-h2">{t("auth.verifyTitle")}</h1>
        {error ? <p className="api-error">{error.startsWith("auth.") ? t(error) : error}</p> : <p>{t(messageKey)}</p>}
        <Link href="/login">{t("auth.backToLogin")}</Link>
      </div>
    </div>
  );
}
