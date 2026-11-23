import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";
async function locale() {
  return (await cookies()).get("olaser-language")?.value === "pl" ? "pl" : "en";
}
export async function generateMetadata(): Promise<Metadata> {
  const language = await locale();
  return {
    title:
      language === "en"
        ? "O’Laser Studio — from idea to production"
        : "O’Laser Studio — od pomysłu do produkcji",
    description:
      language === "en"
        ? "O’Laser’s private content production studio."
        : "Prywatne studio produkcji treści O’Laser.",
    robots: { index: false, follow: false },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = await locale();
  return (
    <html lang={language}>
      <body>
        <LanguageProvider initialLocale={language}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
