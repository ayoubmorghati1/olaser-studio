import type { NextRequest } from "next/server";
import { handleCreative } from "@/lib/creative-api";
export const maxDuration = 120;
export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return handleCreative(req);
}
export function POST(req: NextRequest) {
  return handleCreative(req);
}
