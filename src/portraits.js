/* Pilot portraits — data URLs inlined at build via art modules when present */
const modules = import.meta.glob("./art/*.js", { eager: true, import: "default" });
export const PORTRAITS = {};
for (const [path, value] of Object.entries(modules)) {
  const id = path.split("/").pop().replace(/\.js$/, "");
  if (typeof value === "string" && value.startsWith("data:image")) PORTRAITS[id] = value;
}
export function portraitOf(id) {
  return PORTRAITS[id] || null;
}
