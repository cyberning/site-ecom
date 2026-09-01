"use client";

import { useEffect, useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSession } from "@/hooks/useSession";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";

type Feedback = { type: "success" | "error"; message: string } | null;

export default function AdminAccountPage() {
  const t = useTranslations("admin");
  const { user, isLoading, update } = useSession();

  // ---- Email ----
  const [email, setEmail] = useState("");

  // Synchronise le champ email une fois la session chargée
  useEffect(() => {
    if (!isLoading && user?.email) setEmail(user.email);
  }, [isLoading, user?.email]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);

  // ---- Mot de passe ----
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailFeedback(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailFeedback({ type: "error", message: t("accountPage.emailRequired") });
      return;
    }

    try {
      setEmailLoading(true);
      const res = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailFeedback({
          type: "error",
          message: data.error || t("accountPage.emailError"),
        });
        return;
      }

      // Mise à jour de l'état local avec la nouvelle valeur
      setEmail(data.email ?? trimmed);
      // Rafraîchit la session JWT côté client pour refléter le nouvel email
      await update({ email: data.email ?? trimmed });
      setEmailFeedback({ type: "success", message: t("accountPage.emailUpdated") });
    } catch {
      setEmailFeedback({ type: "error", message: t("accountPage.networkError") });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    // Validation côté client
    if (newPassword.length < 6) {
      setPasswordFeedback({
        type: "error",
        message: t("accountPage.passwordTooShort"),
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: t("accountPage.passwordsMismatch"),
      });
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordFeedback({
          type: "error",
          message: data.error || t("accountPage.passwordError"),
        });
        return;
      }

      setPasswordFeedback({ type: "success", message: t("accountPage.passwordUpdated") });
      // Réinitialiser les champs après succès
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordFeedback({ type: "error", message: t("accountPage.networkError") });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Spinner size="lg" />
        <p className="text-sm text-[var(--text-secondary)]">{t("accountPage.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ---- Header ---- */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t("accountPage.title")}</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("accountPage.subtitle")}</p>
      </div>

      {/* ---- Changer l'email ---- */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]/10">
            <Mail className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {t("accountPage.emailSection")}
          </h3>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-4" noValidate>
          <Input
            id="account-email"
            label={t("accountPage.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("accountPage.emailPlaceholder")}
            autoComplete="email"
          />

          {emailFeedback && <Alert type={emailFeedback.type} message={emailFeedback.message} />}

          <div className="flex justify-end">
            <Button type="submit" disabled={emailLoading}>
              {emailLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> {t("accountPage.saving")}
                </span>
              ) : (
                t("accountPage.save")
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* ---- Changer le mot de passe ---- */}
      <Card className="p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]/10">
            <Lock className="h-5 w-5 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {t("accountPage.passwordSection")}
          </h3>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
          <Input
            id="account-current-password"
            label={t("accountPage.currentPassword")}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
          <Input
            id="account-new-password"
            label={t("accountPage.newPassword")}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Input
            id="account-confirm-password"
            label={t("accountPage.confirmPassword")}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />

          {passwordFeedback && (
            <Alert type={passwordFeedback.type} message={passwordFeedback.message} />
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> {t("accountPage.changing")}
                </span>
              ) : (
                t("accountPage.changePassword")
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
