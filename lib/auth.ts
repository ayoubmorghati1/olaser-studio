import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
const MAX_AGE = 60 * 60 * 24 * 7;
export const cookieName = "olaser-session";
export function configured() {
  return Boolean(
    process.env.STUDIO_PASSWORD &&
    process.env.SESSION_SECRET &&
    process.env.SESSION_SECRET.length >= 32,
  );
}
function secret() {
  return process.env.SESSION_SECRET ?? "";
}
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function issueSession() {
  if (!configured()) throw new Error("Missing auth configuration");
  const body = `${Math.floor(Date.now() / 1000) + MAX_AGE}.${randomBytes(16).toString("hex")}`;
  return `${body}.${createHmac("sha256", secret() + process.env.STUDIO_PASSWORD)
    .update(body)
    .digest("hex")}`;
}
export function validSession(token?: string) {
  if (!configured() || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  const time = Number(exp);
  if (
    !Number.isFinite(time) ||
    time < Date.now() / 1000 ||
    time > Date.now() / 1000 + MAX_AGE + 60
  )
    return false;
  return safeEqual(
    sig,
    createHmac("sha256", secret() + process.env.STUDIO_PASSWORD)
      .update(`${exp}.${nonce}`)
      .digest("hex"),
  );
}
export const sessionAge = MAX_AGE;
