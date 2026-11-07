import { readdir, readFile } from "fs/promises";
import path from "path";

const STYLE_REF_DIR = path.join(process.cwd(), "public", "style-refs");

/** Load bundled style-reference images (comic line/flat-colour refs). */
export async function loadStyleRefFiles(): Promise<
  { name: string; bytes: Buffer; type: string }[]
> {
  try {
    const names = (await readdir(STYLE_REF_DIR))
      .filter((n) => /\.(jpe?g|png|webp)$/i.test(n))
      .sort()
      .slice(0, 4);
    const files = await Promise.all(
      names.map(async (name) => {
        const bytes = await readFile(path.join(STYLE_REF_DIR, name));
        const lower = name.toLowerCase();
        const type = lower.endsWith(".png")
          ? "image/png"
          : lower.endsWith(".webp")
            ? "image/webp"
            : "image/jpeg";
        return { name, bytes, type };
      }),
    );
    return files;
  } catch {
    return [];
  }
}
