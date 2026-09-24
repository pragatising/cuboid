import { copyFile, readdir, mkdir } from "node:fs/promises";

/**
 * Copies every file from source into destination (creating destination if
 * needed). Matches Primer's utilities/copyFromDir.ts — used by build
 * scripts that stage output into a published package directory.
 */
export async function copyFromDir(source: string, destination: string): Promise<string[]> {
  const src = source.replace(/\/$/, "");
  const dest = destination.replace(/\/$/, "");

  await mkdir(dest, { recursive: true });

  const files = await readdir(src);
  await Promise.all(files.map((file) => copyFile(`${src}/${file}`, `${dest}/${file}`)));

  return files;
}
