import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieName, validSession } from "@/lib/auth";
import Studio from "@/components/Studio";
export default async function Page() {
  const jar = await cookies();
  if (!validSession(jar.get(cookieName)?.value)) redirect("/login");
  return <Studio />;
}
