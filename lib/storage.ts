import { openDB } from "idb";
import {
  projectSchema,
  contextSchema,
  type Project,
  type BrandContext,
} from "./schema";
const db = () =>
  openDB("olaser-studio", 1, {
    upgrade(db) {
      db.createObjectStore("projects", { keyPath: "id" });
      db.createObjectStore("settings");
    },
  });
export async function loadProjects(): Promise<Project[]> {
  const d = await db();
  const rows = await d.getAll("projects");
  return rows
    .map((p) => projectSchema.parse(p))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function saveProject(p: Project) {
  const d = await db();
  await d.put("projects", projectSchema.parse(p));
}
export async function removeProject(id: string) {
  const d = await db();
  await d.delete("projects", id);
}
export async function loadContext(): Promise<BrandContext | null> {
  const d = await db();
  const c = await d.get("settings", "context");
  return c ? contextSchema.parse(c) : null;
}
export async function saveContext(c: BrandContext) {
  const d = await db();
  await d.put("settings", contextSchema.parse(c), "context");
}
