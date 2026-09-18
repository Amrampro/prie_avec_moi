export function slugify(input) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // accents
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generate a unique slug by checking existing records.
 * @param {(slug:string)=>Promise<boolean>} existsFn
 * @param {string} base
 */
export async function uniqueSlug(existsFn, base) {
  const clean = slugify(base);
  if (!clean) return null;

  let slug = clean;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await existsFn(slug);
    if (!exists) return slug;
    slug = `${clean}-${i}`;
    i += 1;
  }
}
