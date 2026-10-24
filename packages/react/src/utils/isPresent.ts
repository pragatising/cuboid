import type React from "react";

/** Whether a node would render anything: not `undefined`, `null`, a boolean or an empty string (`0` is present). */
export function isPresent(node: React.ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== true && node !== "";
}
