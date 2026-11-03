/** The file extension for an image address: from a data URL's type, or the path of a URL. `png` when it cannot be told. */
export function imageFileExtension(src: string): string {
  const data = /^data:image\/([a-z0-9.+-]+)[;,]/i.exec(src);
  if (data) return data[1].replace("jpeg", "jpg").replace("svg+xml", "svg");
  const path = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(src.split("?")[0] ?? "");
  return path ? path[1].toLowerCase() : "png";
}

/** A file read into a data URL: the address a picture has when nothing uploads it. */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read the file")));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

function saveLink(href: string, filename: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
}

/**
 * Save the picture. `download` is ignored for a file from another origin, so the bytes are fetched and saved as a blob; where that is refused
 * (no CORS, offline) the picture is opened so it can still be saved by hand.
 */
export async function downloadImage(src: string, filename: string): Promise<void> {
  if (src.startsWith("data:")) return saveLink(src, filename);
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error(String(response.status));
    const url = URL.createObjectURL(await response.blob());
    saveLink(url, filename);
    URL.revokeObjectURL(url);
  } catch {
    window.open(src, "_blank", "noopener,noreferrer");
  }
}
