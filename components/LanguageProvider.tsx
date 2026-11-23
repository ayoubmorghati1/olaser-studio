"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { translate, type Locale } from "@/lib/translations";
const LanguageContext = createContext<{
  locale: Locale;
  t: (s: string) => string;
  setLocale: (l: Locale) => void;
}>({ locale: "en", t: (s) => translate(s, "en"), setLocale: () => {} });
export function LanguageProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, update] = useState(initialLocale);
  const value = useMemo(
    () => ({
      locale,
      t: (s: string) => translate(s, locale),
      setLocale: (next: Locale) => {
        update(next);
        document.cookie = `olaser-language=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
        document.documentElement.lang = next;
        document.title =
          next === "en"
            ? "O’Laser Studio — from idea to production"
            : "O’Laser Studio — od pomysłu do produkcji";
      },
    }),
    [locale],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
export const useLanguage = () => useContext(LanguageContext);
export function LanguageSwitch() {
  const { locale, setLocale } = useLanguage();
  return (
    <div
      className="language-switch"
      role="group"
      aria-label={locale === "en" ? "Interface language" : "Język interfejsu"}
    >
      <button
        type="button"
        lang="en"
        aria-label="English"
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        type="button"
        lang="pl"
        aria-label="Polski"
        aria-pressed={locale === "pl"}
        onClick={() => setLocale("pl")}
      >
        PL
      </button>
    </div>
  );
}
