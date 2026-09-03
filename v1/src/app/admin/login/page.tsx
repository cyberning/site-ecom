"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@/lib/validators";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("admin");

  // Anti open-redirect : n'accepter que des chemins internes du dashboard admin.
  // Bloque les URLs absolues (https://…), protocole-relative (//evil.com) et
  // les schémas type javascript: — ainsi que le bypass par backslash (/\evil.com).
  const rawCallback = searchParams.get("callbackUrl") || "/admin";
  const callbackUrl =
    rawCallback.startsWith("/admin") &&
    !rawCallback.startsWith("//") &&
    !rawCallback.includes(":") &&
    !rawCallback.includes("\\")
      ? rawCallback
      : "/admin";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(t(parsed.error.errors[0].message));
      setLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("login.invalidCredentials"));
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t("login.unexpectedError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          id="login-error"
          role="alert"
          className="rounded-[var(--radius-sm)] bg-red-500/10 p-3 text-sm text-red-500"
        >
          {error}
        </div>
      )}

      <Input
        id="email"
        name="email"
        type="email"
        label={t("login.email")}
        required
        autoComplete="email"
        autoFocus
        placeholder="admin@ecom-dz.com"
        aria-describedby={error ? "login-error" : undefined}
      />

      <div>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          label={t("login.password")}
          required
          autoComplete="current-password"
          placeholder="••••••"
          aria-describedby={error ? "login-error" : undefined}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] transition-all duration-300 hover:text-[var(--accent)]"
          aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
          aria-pressed={showPassword}
        >
          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showPassword ? t("login.hide") : t("login.show")}
        </button>
      </div>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? t("login.signingIn") : t("login.signIn")}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  const t = useTranslations("admin");
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-neumorphic)]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t("login.title")}</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">{t("login.subtitle")}</p>
        </div>

        <Suspense
          fallback={
            <div className="text-center text-[var(--text-secondary)]">{t("login.loading")}</div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
