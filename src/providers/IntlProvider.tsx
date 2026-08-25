"use client";

import { NextIntlClientProvider } from "next-intl";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

/**
 * Client-side i18n provider.
 * Loads messages dynamically based on the current locale (from NEXT_LOCALE cookie / request.ts).
 * Falls back to rendering children without translations while messages load.
 */
export default function IntlProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const [messages, setMessages] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    import(`@/messages/${locale}.json`).then((mod) => {
      setMessages(mod.default);
    });
  }, [locale]);

  if (!messages || Object.keys(messages).length === 0) {
    return <>{children}</>;
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
