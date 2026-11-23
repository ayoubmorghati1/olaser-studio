import { NextRequest, NextResponse } from "next/server";
import { cookieName, validSession } from "./lib/auth";
export function proxy(req: NextRequest) {
  if (validSession(req.cookies.get(cookieName)?.value))
    return NextResponse.next();
  return NextResponse.redirect(new URL("/login", req.url));
}
export const config = {
  matcher: [
    "/((?!api/session|login|_next/static|_next/image|favicon.ico|fonts/).*)",
  ],
};
