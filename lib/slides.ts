import type { Asset, Slide } from "./schema";
export const palette = {
  burgundy: "#430102",
  gold: "#C1914F",
  cream: "#EADFC2",
};
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const result: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (ctx.measureText(word).width > width) {
        if (line) {
          result.push(line);
          line = "";
        }
        let part = "";
        for (const c of word) {
          if (ctx.measureText(part + c).width > width) {
            result.push(part);
            part = c;
          } else part += c;
        }
        line = part;
        continue;
      }
      if (line && ctx.measureText(line + " " + word).width > width) {
        result.push(line);
        line = word;
      } else line = line ? line + " " + word : word;
    }
    result.push(line);
  }
  return result;
}
export async function drawSlide(
  canvas: HTMLCanvasElement,
  slide: Slide,
  index: number,
  total: number,
  asset?: Asset,
  language: "en" | "pl" = "pl",
): Promise<boolean> {
  const glyphs = "O’LASER Zażółć gęślą jaźń 0123456789";
  await Promise.all([
    document.fonts.load("400 36px Montserrat", glyphs),
    document.fonts.load("500 48px Montserrat", glyphs),
    document.fonts.load("600 88px Montserrat", glyphs),
  ]);
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Przeglądarka nie obsługuje eksportu obrazu.");
  const dark = slide.layout === "cover" || slide.layout === "cta";
  ctx.fillStyle = dark ? palette.burgundy : palette.cream;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = dark ? palette.cream : palette.burgundy;
  ctx.font = "500 31px Montserrat";
  ctx.fillText("O’LASER", 80, 100);
  ctx.font = "500 18px Montserrat";
  ctx.fillText("HAIR REMOVAL", 80, 131);
  ctx.textAlign = "right";
  ctx.fillText(
    `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    1000,
    100,
  );
  ctx.textAlign = "left";
  ctx.strokeStyle = palette.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 170);
  ctx.lineTo(1000, 170);
  ctx.stroke();
  let imageMissing = false;
  if (slide.layout === "image") {
    if (asset) {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Nie udało się odczytać obrazu."));
        image.src = asset.data;
      });
      const x = 80,
        y = 210,
        w = 920,
        h = 480;
      const scale = Math.max(w / image.width, h / image.height) * slide.zoom;
      const dw = image.width * scale,
        dh = image.height * scale;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.drawImage(
        image,
        x - ((dw - w) * slide.cropX) / 100,
        y - ((dh - h) * slide.cropY) / 100,
        dw,
        dh,
      );
      ctx.restore();
    } else {
      imageMissing = true;
      ctx.fillStyle = "#d8c9a9";
      ctx.fillRect(80, 210, 920, 480);
      ctx.fillStyle = palette.burgundy;
      ctx.font = "500 30px Montserrat";
      ctx.fillText(
        language === "en"
          ? "Add an approved image"
          : "Dodaj zatwierdzony obraz",
        130,
        460,
      );
    }
  } else if (dark) {
    ctx.save();
    ctx.strokeStyle = "#c1914f55";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(970, 475, 340, 430, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(970, 475, 270, 360, -0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const start = slide.layout === "image" ? 760 : dark ? 420 : 350;
  const fontSize = slide.layout === "image" ? 64 : dark ? 88 : 80;
  const lineHeight = fontSize * 1.18;
  ctx.font = `600 ${fontSize}px Montserrat`;
  ctx.fillStyle = dark ? palette.cream : palette.burgundy;
  const headline = wrap(ctx, slide.headline, 920);
  let y = start;
  for (const line of headline) {
    ctx.fillText(line, 80, y);
    y += lineHeight;
  }
  y += 45;
  ctx.font = "400 36px Montserrat";
  const body = wrap(ctx, slide.body, 880);
  for (const line of body) {
    ctx.fillText(line, 80, y);
    y += 53;
  }
  ctx.font = "500 19px Montserrat";
  ctx.fillStyle = dark ? palette.cream : palette.burgundy;
  ctx.fillText(
    language === "en"
      ? "O’LASER  /  KNOWLEDGE IN A NEW LIGHT"
      : "O’LASER  /  WIEDZA W DOBRYM ŚWIETLE",
    80,
    1260,
  );
  ctx.strokeStyle = palette.gold;
  ctx.beginPath();
  ctx.moveTo(80, 1210);
  ctx.lineTo(1000, 1210);
  ctx.stroke();
  return y > 1160 || imageMissing;
}
export async function slideBlob(
  slide: Slide,
  index: number,
  total: number,
  asset?: Asset,
  language: "en" | "pl" = "pl",
) {
  const canvas = document.createElement("canvas");
  if (await drawSlide(canvas, slide, index, total, asset, language))
    throw new Error(
      "Tekst nie mieści się na slajdzie lub brakuje obrazu. Popraw slajd przed eksportem.",
    );
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Eksport obrazu nie powiódł się.")),
      "image/png",
    ),
  );
}
