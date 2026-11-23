import type { BrandContext } from "./schema";
export const calendarUrl =
  "https://docs.google.com/spreadsheets/d/1V_ofi4F-b-HL68uy5ELDy_q9jgzSywhO/edit";
export const canvaUrl =
  "https://www.canva.com/design/DAHE8OS4rRA/F5qSkrv7DVahqq2Hq-dFSg/view";
export const defaultContext: BrandContext = {
  version: 1,
  brand: `# O’Laser\nMarka depilacji laserowej w Warszawie. Korzystaj z istniejącego kalendarza; nie twórz nowej strategii. Teksty publikacji po polsku. CTA zachowuj z briefu.\nAntagonista: powracający humor o rutynie golenia. Żart dotyczy czynności i przedmiotu, nigdy ciała ani bohaterki. Kasia podejmuje własne decyzje; nikt jej nie ratuje.`,
  design: `# Kierunek wizualny\nMinimalny, redakcyjny, premium. Paleta z dostarczonego PRD: burgund #430102, złoto #C1914F, krem #EADFC2. Dokładne wartości HEX nie zostały niezależnie potwierdzone w źródłowym pliku. Canva: CANVA PACK -OLASER, 42 strony, 1080 × 1350.\nAmoret Sans wymieniony w PRD, plik fontu niedostępny. W studiu: lokalny Montserrat. Nie kopiuj demonstracyjnego adresu ani niezweryfikowanych obietnic z szablonów Canva.`,
  characters: `# Postacie\nKalendarz potwierdza: Marta — wyjaśnia; Filip — męski głos klienta i reakcje; Kasia — kobiecy głos klientki i skecze Antagonista.\nBrakuje zatwierdzonych zdjęć, głosów, garderoby i szczegółów wyglądu. Oznacz wymagane referencje. Nie wymyślaj kanonicznego wyglądu. Bohaterowie AI wymagają jawnego oznaczenia; prawdziwe zabiegi i doświadczenia klientów muszą być autentyczne.`,
  claims: `# Twierdzenia i akceptacja\nBrak zatwierdzonego regulaminu, gwarancji, cennika i claims.md. Zapisy kalendarza nie są zgodą na twierdzenia medyczne lub prawne. Nie obiecuj bezbolesności, gwarantowanych wyników ani stałej liczby zabiegów.\nEdukacja: światło pochłania pigment włosa; zwykle potrzebna jest seria zabiegów; wyniki i kwalifikacja są indywidualne. Tekst musi zostać zatwierdzony przez osobę odpowiedzialną za zabiegi przed publikacją.\nŹródła: https://www.aad.org/public/everyday-care/skin-care-basics/hair/remove-unwanted-hair oraz https://www.aad.org/public/cosmetic/hair-removal/laser-hair-removal-faqs`,
  production: `# Produkcja\nScenariusz i napisy po polsku. Prompty obrazu i ruchu po angielsku. Każde ujęcie: jedna czytelna czynność, kadr, światło, referencje i ciągłość. Osobno czas generacji i czas w montażu. Ustawienia są sugestią do sprawdzenia w wybranym modelu. Można użyć prawdziwego nagrania, planszy lub zdjęcia zamiast AI.\nKaruzele: 4:5, 1080 × 1350. Obraz generuj bez tekstu i logo; tekst składa studio. Krótkie nagłówki, jedna myśl na slajd. Żadnych fikcyjnych opinii ani zdjęć wyników.`,
  sources: `# Źródła\nKalendarz: ${calendarUrl}\nOdczyt przez Google Drive: 20.11.2026; oryginał to plik XLSX, 111 wpisów.\nCanva: ${canvaUrl}\nOdczyt metadanych i tekstu stron 1–6: 20.11.2026.\nNie odnaleziono olaser-creative-direction-report.md ani olaser-decisions-register.md w lokalnym folderze.\nPrzygotowane pakiety są autorskimi szkicami, nie zatwierdzonymi materiałami marki.`,
};
export const contextLabels: Record<
  keyof Omit<BrandContext, "version" | "resources">,
  string
> = {
  brand: "Marka i ton",
  design: "Design",
  characters: "Postacie",
  claims: "Twierdzenia i akceptacja",
  production: "Instrukcje produkcji",
  sources: "Źródła i braki",
};

export const englishContext: BrandContext = {
  version: 1,
  brand: `# O’Laser\nA laser hair removal brand in Warsaw. Use the existing calendar; do not create a new strategy. Published content follows the brief's content-language setting (Polish by default). Preserve the CTA from the brief.\nAntagonista: recurring comedy about the shaving routine. The joke concerns the task and object, never the character’s body. Kasia makes her own decisions; nobody rescues her.`,
  design: `# Visual direction\nMinimal, editorial and premium. Palette supplied in the PRD: burgundy #430102, gold #C1914F, cream #EADFC2. Exact HEX values have not been independently verified against the original design elements. Canva: CANVA PACK -OLASER, 42 pages, 1080 × 1350.\nAmoret Sans is named in the PRD, but its font file is unavailable. The studio uses bundled Montserrat. Do not copy the placeholder address or unverified treatment promises from Canva templates.`,
  characters: `# Characters\nThe calendar confirms: Marta explains; Filip supplies the male client voice and reactions; Kasia supplies the female client voice and leads Antagonista sketches.\nApproved images, voices, wardrobe and appearance details are missing. List the required references. Do not invent a canonical appearance. Disclose AI characters; real treatments and client experiences must be authentic.`,
  claims: `# Claims and approval\nApproved terms, guarantees, prices and claims.md are unavailable. Calendar wording is not approval for medical or legal claims. Do not promise pain-free treatment, guaranteed outcomes or a universal number of sessions.\nEducation: pigment in the hair absorbs light; a series of treatments is usually needed; results and suitability vary individually. The person responsible for treatment must approve the wording before publication.\nSources: https://www.aad.org/public/everyday-care/skin-care-basics/hair/remove-unwanted-hair and https://www.aad.org/public/cosmetic/hair-removal/laser-hair-removal-faqs`,
  production: `# Production\nWrite dialogue, captions and subtitles in the brief's content language (Polish by default). Image and motion prompts are always in English. Each shot needs one clear action, framing, lighting, references and continuity. Keep generation duration separate from edit duration. Model settings are suggestions to verify. Real footage, a title card or a still can replace AI generation.\nCarousels: 4:5, 1080 × 1350. Generate images without text or logos; the studio typesets the copy. Short headlines, one thought per slide. No fabricated reviews or treatment-result images.`,
  sources: `# Sources\nCalendar: ${calendarUrl}\nRead through Google Drive on 20 November 2026; the original is an XLSX file containing 111 entries.\nCanva: ${canvaUrl}\nMetadata and text on pages 1–6 inspected on 20 November 2026.\nNeither olaser-creative-direction-report.md nor olaser-decisions-register.md was found in the local workspace.\nPrepared packages are authored drafts, not brand-approved materials.`,
};
export function localizeContext(
  context: BrandContext,
  locale: "en" | "pl",
): BrandContext {
  const result = { ...context };
  for (const key of Object.keys(
    contextLabels,
  ) as (keyof typeof contextLabels)[]) {
    if (
      context[key] === defaultContext[key] ||
      context[key] === englishContext[key]
    )
      result[key] = locale === "en" ? englishContext[key] : defaultContext[key];
  }
  return result;
}
