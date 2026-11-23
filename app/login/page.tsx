"use client";
import { useLanguage, LanguageSwitch } from "@/components/LanguageProvider";
import { useState } from "react";
import { LockKeyhole, LoaderCircle } from "lucide-react";
export default function Login() {
  const { t, locale } = useLanguage();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="login">
      <div className="login-language">
        <LanguageSwitch />
      </div>
      <div className="login-art">
        <span className="wordmark">
          O’LASER<span>STUDIO</span>
        </span>
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="login-copy">
          <span className="eyebrow">
            {t("TWOJA STRATEGIA. GOTOWA DO PRODUKCJI.")}
          </span>
          <h1>
            {" "}
            {t("Dobry pomysł.")} <br /> {t("Jeszcze lepsza")} <br />
            <em>{t("realizacja.")}</em>
          </h1>
          <p>
            {" "}
            {t("Jedno miejsce na scenariusz, ujęcia, slajdy")} <br />
            {t("i wszystkie szczegóły pomiędzy.")}{" "}
          </p>
        </div>
        <span className="login-footer">CONTENT, WITH INTENTION.</span>
      </div>
      <div className="login-form">
        <div>
          <span className="icon-box">
            <LockKeyhole size={22} />
          </span>
          <span className="eyebrow">{t("PRYWATNA PRZESTRZEŃ O’LASER")}</span>
          <h2>{t("Witaj w studiu.")}</h2>
          <p>{t("Wpisz wspólne hasło, aby otworzyć warsztat.")}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError("");
              try {
                const res = await fetch("/api/session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    password: new FormData(e.currentTarget).get("password"),
                  }),
                });
                if (!res.ok) {
                  const data = await res.json();
                  throw new Error(data.error);
                }
                window.location.href = "/";
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : t("Nie udało się połączyć."),
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              {" "}
              {t("Hasło dostępu")}{" "}
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={300}
                placeholder={t("Twoje hasło")}
              />
            </label>
            {error && (
              <p className="error" role="alert">
                {t(error)}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={17} /> : null}
              {t("Otwórz studio")}{" "}
            </button>
          </form>
          <small>
            {" "}
            {t("Projekty zapisują się na Twoim urządzeniu.")} <br />{" "}
            {t("Eksportuj kopię, aby przenieść je do innej przeglądarki.")}{" "}
          </small>
        </div>
      </div>
    </main>
  );
}
