import { defaultContext, localizeContext } from "./context";
import { exampleEnglish } from "./example-translations";
import type { Project, Shot, Slide } from "./schema";
export function newProject(
  kind: Project["kind"],
  context = defaultContext,
  locale: "en" | "pl" = "pl",
): Project {
  const now = new Date().toISOString();
  return {
    version: 1,
    id: crypto.randomUUID(),
    kind,
    title:
      kind === "reel"
        ? locale === "en"
          ? "New reel"
          : "Nowy reel"
        : locale === "en"
          ? "New carousel"
          : "Nowa karuzela",
    createdAt: now,
    updatedAt: now,
    brief: {
      idea: "",
      sourceText: "",
      series: "",
      character: "",
      audience: locale === "en" ? "Women and men" : "Kobiety i mężczyźni",
      cta: "",
      target: kind === "reel" ? 25 : 6,
      outputLanguage: "pl",
    },
    context: structuredClone(context),
    package: null,
    assets: (context.resources ?? [])
      .filter((r) => r.reviewed && r.image)
      .map((r) => ({
        id: r.id,
        name: r.name,
        type: r.image!.startsWith("data:image/png")
          ? ("image/png" as const)
          : r.image!.startsWith("data:image/webp")
            ? ("image/webp" as const)
            : ("image/jpeg" as const),
        data: r.image!,
      })),
    importDraft: "",
    revisionDraft: "",
  };
}
export function example(
  kind: Project["kind"],
  context = defaultContext,
  locale: "en" | "pl" = "pl",
): Project {
  const p = newProject(kind, context);
  if (kind === "reel") {
    p.title = "Wtorek, 6:50. Plan był prosty.";
    p.brief = {
      idea: "Odc. 1 — Wtorek, 6:50. Plan był prosty.",
      sourceText:
        "Kalendarz, wpis #3 · 13.01.2027 · Kasia · Antagonista (Kasia/Filip)\nSeries pilot, Kasia’s: the 06:50 razor, the antagonist that will return every week; flat past-tense report, the joke is the routine, never her.",
      series: "Antagonista",
      character: "Kasia",
      audience: "Kobiety",
      cta: "Napisz PACHY",
      target: 25,
    };
    const scenes = [
      [
        "Plan był prosty.",
        "Zbliżenie zegara 6:50. Kasia odkłada telefon.",
        "Wtorek. 6:50. Plan był prosty.",
        "Statyczny detal zegara, potem półzbliżenie.",
      ],
      [
        "Znajomy przeciwnik.",
        "Kasia patrzy na maszynkę leżącą obok umywalki.",
        "Wyjść o siódmej.",
        "Detal maszynki; spojrzenie w dół.",
      ],
      [
        "Jeszcze chwila.",
        "Odkłada ręcznik, sięga po maszynkę i spogląda na zegar.",
        "Potem przypomniała mi się ta jedna rzecz.",
        "Średni plan, jeden spokojny ruch.",
      ],
      [
        "Poranny rachunek.",
        "Ten sam zegar. Kasia odkłada maszynkę i bierze telefon.",
        "I znowu liczyłam minuty.",
        "Powtórzenie kadru zegara.",
      ],
      [
        "Własna decyzja.",
        "Kasia wychodzi z kadru. Na kremowej planszy pojawia się CTA.",
        "Postanowiłam sprawdzić inne rozwiązanie.",
        "Półzbliżenie, następnie plansza dodana w montażu.",
      ],
    ];
    const shots: Shot[] = scenes.map((s, i) => ({
      id: `shot-${i + 1}`,
      title: s[0],
      action: s[1],
      framing: s[3],
      environment: "Jedna zatwierdzona łazienka, miękkie światło poranka.",
      continuity:
        "Ta sama Kasia, garderoba, maszynka i układ łazienki. Wygląd wyłącznie według zatwierdzonych referencji.",
      references: [
        "Zatwierdzona referencja Kasi",
        "Referencja łazienki i maszynki",
      ],
      imagePrompt: `Use the approved Kasia and bathroom references. Shot ${i + 1}: ${["Close-up of a clock, with Kasia setting her phone down nearby.", "Kasia glances down at a razor beside the basin.", "Kasia reaches for the razor after putting down a towel.", "The same clock composition; Kasia picks up her phone.", "Kasia leaves the bathroom frame."][i]} Soft natural morning light, restrained editorial realism, vertical 9:16. Match wardrobe and props. No text or logos.`,
      motionPrompt: `Preserve the approved character identity and scene continuity. ${["A hand gently sets the phone down. Camera stays still.", "She briefly glances down at the razor, with subtle recognition. Static camera.", "She reaches for the razor, then pauses. One simple action, static camera.", "She puts the razor down and picks up her phone. Restrained movement.", "She calmly walks out of frame. Hold the empty composition briefly."][i]} No speech; voiceover is added in editing.`,
      generationSeconds: 5,
      editSeconds: 5,
      dialogue: s[2],
      sound: i === 0 ? "Delikatny dźwięk zegara." : "Cichy ambience łazienki.",
      subtitle: s[2],
      edit:
        i === 4
          ? "Ostatnie 2 sekundy: kremowa plansza z CTA."
          : "Twarde cięcie na końcu zdania.",
      checks: [
        "Zgodność postaci z referencją",
        "Poprawne dłonie i rekwizyty",
        "Żart o rutynie, nie o ciele",
      ],
    }));
    p.package = {
      version: 1,
      kind: "reel",
      title: p.title,
      hook: "Wtorek. 6:50. Plan był prosty.",
      objective:
        "Pokazać powtarzalny koszt porannej rutyny i zaprosić do rozmowy bez obietnic efektu.",
      shots,
      assembly:
        "5 ujęć po 5 s. Twarde cięcia, rytm spokojnego raportu. Napisy i zegar 6:50 składaj w edytorze, nie w generatorze.",
      music:
        "Opcjonalnie oszczędny, lekko komediowy podkład z licencją. Głos na pierwszym planie.",
      endCard: "O’LASER · Napisz PACHY",
      caption:
        "Plan był prosty. Poranna rutyna miała inny pomysł.\nChcesz porozmawiać o depilacji laserowej? Napisz PACHY.\nKasia jest postacią wygenerowaną przez AI. Scena ilustracyjna.",
      cta: "Napisz PACHY",
      notes:
        "Szkic redakcyjny na podstawie rzeczywistego briefu. Nie jest gotowym wideo. Czas i ustawienia sprawdź w wybranym modelu.",
      missingAssets: [
        "Zatwierdzona referencja Kasi",
        "Referencja łazienki, garderoby i maszynki",
        "Zatwierdzony głos Kasi lub lektor",
        "Licencjonowany podkład, jeśli używany",
      ],
      reviewNotes: ["Akceptacja scenariusza i oznaczenia AI przez Rafała."],
    };
  } else {
    p.title = "Jak to działa — w 6 slajdach";
    p.brief = {
      idea: p.title,
      sourceText:
        "Kalendarz, wpis #2 · 13.01.2027 · Marta · Carousel\nFollicle, wavelength, why ten sessions, the hair cycle. CTA: Zapisz.",
      series: "Carousel",
      character: "Marta",
      audience: "Kobiety i mężczyźni",
      cta: "Zapisz",
      target: 6,
    };
    const content = [
      [
        "Jak działa\ndepilacja laserowa?",
        "6 slajdów, które porządkują podstawy.",
      ],
      [
        "Wszystko zaczyna\nsię od światła.",
        "Pigment we włosie pochłania energię światła lasera.",
      ],
      [
        "Celem jest\nmieszek włosowy.",
        "Energia światła zamienia się w ciepło, które oddziałuje na mieszek.",
      ],
      [
        "Dlaczego\nseria zabiegów?",
        "Włosy rosną w różnych fazach. Dlatego zwykle potrzebnych jest kilka zabiegów.",
      ],
      [
        "Twój plan\njest indywidualny.",
        "Liczba i odstępy między zabiegami zależą od kwalifikacji i reakcji na leczenie.",
      ],
      [
        "Zapisz. Wróć.\nZapytaj.",
        "Masz pytania? Omów kwalifikację i plan zabiegów podczas konsultacji.",
      ],
    ];
    const slides: Slide[] = content.map((s, i) => ({
      id: `slide-${i + 1}`,
      layout: i === 0 ? "cover" : i === 5 ? "cta" : "text",
      headline: s[0],
      body: s[1],
      imagePrompt:
        i === 2
          ? "Minimal editorial macro illustration of a hair follicle and a beam of light, warm cream and muted burgundy palette, no labels, no text, no logos. Conceptual educational illustration, not a treatment result."
          : "",
      references: [],
      alt: `Slajd ${i + 1}: ${s[0].replaceAll("\n", " ")} ${s[1]}`,
      cropX: 50,
      cropY: 50,
      zoom: 1,
    }));
    p.package = {
      version: 1,
      kind: "carousel",
      title: p.title,
      slides,
      caption:
        "Jak działa depilacja laserowa? Zapisz te podstawy na później.\nMateriał ogólnoedukacyjny. Kwalifikacja i plan zabiegów są indywidualne.",
      cta: "Zapisz",
      notes:
        "Szkic do akceptacji osoby odpowiedzialnej za zabiegi. Źródła: American Academy of Dermatology — remove-unwanted-hair oraz laser-hair-removal-faqs. Kalendarz wspomina dziesięć sesji; brak zatwierdzonego protokołu, dlatego nie podajemy tej liczby jako uniwersalnego faktu.",
      missingAssets: [],
      reviewNotes: [
        "Wymagana akceptacja medyczna tekstów przed publikacją.",
        "Potwierdź finalne zasady wizualne z marką.",
      ],
    };
  }
  if (locale === "en") {
    const convert = (value: unknown): unknown =>
      typeof value === "string"
        ? (exampleEnglish[value] ?? value)
        : Array.isArray(value)
          ? value.map(convert)
          : value && typeof value === "object"
            ? Object.fromEntries(
                Object.entries(value).map(([k, v]) => [
                  k,
                  k === "sourceText" || k === "context" ? v : convert(v),
                ]),
              )
            : value;
    const translated = convert(p) as Project;
    translated.context = localizeContext(p.context, "en");
    translated.brief.outputLanguage = "en";
    if (translated.package?.kind === "carousel")
      translated.package.slides.forEach((slide, i) => {
        slide.alt = `Slide ${i + 1}: ${slide.headline.replaceAll("\n", " ")} ${slide.body}`;
      });
    return translated;
  }
  return p;
}
