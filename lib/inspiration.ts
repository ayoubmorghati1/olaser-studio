import type { Inspiration } from "./schema";
function dataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(Error("Could not read file"));
    r.readAsDataURL(file);
  });
}
function frame(source: CanvasImageSource, w: number, h: number) {
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 960 / Math.max(w, h));
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}
export async function readInspiration(file: File): Promise<Inspiration> {
  if (
    ![
      "image/png",
      "image/jpeg",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ].includes(file.type)
  )
    throw Error("Use PNG, JPG, WebP, MP4, MOV or WebM.");
  if (file.size > 10 * 1024 * 1024)
    throw Error("Inspiration must be under 10 MB.");
  const base = {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type as Inspiration["type"],
    data: await dataUrl(file),
    frames: [] as string[],
    borrow: [],
    notes: "",
    analysis: "",
    approved: false,
  };
  if (file.type.startsWith("image/")) {
    const img = await createImageBitmap(file);
    try {
      if (img.width * img.height > 40000000)
        throw Error("Image exceeds 40 MP.");
      return { ...base, frames: [frame(img, img.width, img.height)] };
    } finally {
      img.close();
    }
  }
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "auto";
  video.src = url;
  const event = (name: string) =>
    new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup();
        reject(
          Error("Could not decode video. Try an MP4 or upload screenshots."),
        );
      }, 12000);
      const done = () => {
        cleanup();
        resolve();
      };
      const error = () => {
        cleanup();
        reject(Error("Video format could not be decoded."));
      };
      const cleanup = () => {
        clearTimeout(timer);
        video.removeEventListener(name, done);
        video.removeEventListener("error", error);
      };
      video.addEventListener(name, done, { once: true });
      video.addEventListener("error", error, { once: true });
    });
  try {
    await event("loadeddata");
    if (!Number.isFinite(video.duration) || video.duration > 180)
      throw Error("Use a video of 180 seconds or less.");
    for (let n = 0; n < 6; n++) {
      const time = Math.max(
        0.01,
        Math.min(video.duration - 0.01, (video.duration * (n + 0.5)) / 6),
      );
      const ready = event("seeked");
      video.currentTime = time;
      await ready;
      base.frames.push(frame(video, video.videoWidth, video.videoHeight));
    }
    return { ...base, duration: video.duration };
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}
