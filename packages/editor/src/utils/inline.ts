import type { PillIntensity, PillShade } from "@sragatiping/cuboid";

/** The pill's colour families and emphasis steps: Cuboid's own, so a pill in a document is a Cuboid pill. */
export const PILL_SHADES: PillShade[] = ["gray", "blue", "indigo", "purple", "mag", "red", "orange", "yellow", "lime", "green", "teal"];
export const PILL_INTENSITIES: PillIntensity[] = ["extraLight", "light", "bold", "extraBold"];
export const PILL_INTENSITY_LABELS: Record<PillIntensity, string> = { extraLight: "Extra light", light: "Light", bold: "Bold", extraBold: "Extra bold" };

export const isPillShade = (value: unknown): value is PillShade => PILL_SHADES.includes(value as PillShade);
export const isPillIntensity = (value: unknown): value is PillIntensity => PILL_INTENSITIES.includes(value as PillIntensity);

export const todayIso = (now = new Date()) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `2026-11-12` → `Nov 12, 2026`, in the reader's locale. The date is read as a calendar day, so no time zone can move it. An invalid one is shown as it was written. */
export function formatDate(iso: string, locale?: string): string {
  const match = ISO_DATE.exec(iso);
  if (!match) return iso;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return iso;
  return date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}
