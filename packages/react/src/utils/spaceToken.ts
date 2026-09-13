import type { SpaceScale } from "../theme/types";
import { spaceScaleToPxKey } from "./spaceScale";

/** 8pt grid spacing token for margin, gap overrides, CSS modules, etc. (`1x` = 8px). */
export type SpaceToken = SpaceScale;

/**
 * Map a spacing scale token to a theme CSS variable reference. The variable
 * *name* is px-based (`--cube-space-12px`) so it's a valid CSS ident with no
 * escaping required — `.` isn't legal in an unescaped custom-property name,
 * which silently drops the whole declaration if forgotten. The token's
 * *value* is still rem (see theme.json), so spacing keeps scaling with the
 * user's OS/browser text-size setting.
 */
export function spaceTokenToCssVar(token: SpaceToken): string {
  const pxKey = spaceScaleToPxKey(token);
  return `var(--cube-space-${pxKey ?? token}px)`;
}
