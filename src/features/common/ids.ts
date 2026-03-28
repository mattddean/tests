export function createId() {
  return crypto.randomUUID();
}

export function slugify(input: string) {
  const normalized = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "untitled-test";
}

export function createSlug(input: string) {
  return `${slugify(input)}-${createId().slice(0, 8)}`;
}
