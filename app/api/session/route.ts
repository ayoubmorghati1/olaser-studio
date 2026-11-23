import { NextRequest, NextResponse } from "next/server";
import {
  configured,
  cookieName,
  issueSession,
  safeEqual,
  sessionAge,
} from "@/lib/auth";
function sameOrigin(req: NextRequest) {
  try {
    const origin = new URL(req.headers.get("origin") ?? "");
    return (
      origin.host === req.headers.get("host") &&
      (origin.protocol === "https:" || process.env.NODE_ENV !== "production")
    );
  } catch {
    return false;
  }
}
export async function POST(req: NextRequest) {
  if (!sameOrigin(req))
    return NextResponse.json(
      { error: "Niedozwolone źródło żądania." },
      { status: 403 },
    );
  if (!configured())
    return NextResponse.json(
      {
        error: "Studio wymaga konfiguracji hasła i sekretu sesji na serwerze.",
      },
      { status: 503 },
    );
  if (Number(req.headers.get("content-length")) > 4096)
    return new NextResponse(null, { status: 413 });
  let password: unknown;
  try {
    password = (await req.json()).password;
  } catch {
    return NextResponse.json(
      { error: "Niepoprawne żądanie." },
      { status: 400 },
    );
  }
  if (
    typeof password !== "string" ||
    password.length > 300 ||
    !safeEqual(password, process.env.STUDIO_PASSWORD!)
  ) {
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json(
      { error: "Nieprawidłowe hasło." },
      { status: 401 },
    );
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, issueSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: sessionAge,
  });
  return response;
}
export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return new NextResponse(null, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
