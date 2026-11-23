import { cookies } from "next/headers";
import { cookieName, validSession } from "@/lib/auth";
import { parseCalendar } from "@/lib/calendar";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!validSession((await cookies()).get(cookieName)?.value))
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const response = await fetch(
      "https://docs.google.com/spreadsheets/d/1V_ofi4F-b-HL68uy5ELDy_q9jgzSywhO/export?format=csv",
      { cache: "no-store", signal: AbortSignal.timeout(15000) },
    );
    if (!response.ok) throw Error("Calendar source unavailable");
    const csv = await response.text();
    if (csv.length > 2000000) throw Error("Calendar too large");
    return Response.json(
      { ideas: parseCalendar(csv), retrievedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      {
        error:
          "Could not refresh the calendar. The saved snapshot is still available.",
      },
      { status: 502 },
    );
  }
}
