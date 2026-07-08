import manifest from "./manifest.json";

export * from "./material";

export { MATERIAL_ICON_STYLE, MATERIAL_ICON_WEIGHT } from "./material/config";

/**
 * Wrap any Material Symbols Rounded (w400) glyph for use inside `Icon` /
 * `IconButton` — the same helper cuboid uses internally for its own curated
 * icon set (`iconManifest`). Only ~226 icons are pre-exported as named
 * components; for anything else, import the glyph directly from
 * `@material-symbols-svg/react/rounded/<icon-name>` (already a cuboid
 * dependency — no extra install needed) and wrap it with this.
 *
 * @example
 * import { AccountBalance } from "@material-symbols-svg/react/rounded/account-balance";
 * import { Icon, createMaterialIcon } from "@sragatiping/cuboid";
 * const AccountBalanceIcon = createMaterialIcon(AccountBalance);
 * <Icon size="sm"><AccountBalanceIcon /></Icon>
 */
export { createMaterialIcon } from "./material/createMaterialIcon";
export type { MaterialSymbolsComponent } from "@material-symbols-svg/react/rounded/w400";

export { manifest as iconManifest };

export type IconName = keyof typeof manifest;

export type IconManifestEntry = {
  source: "material-rounded" | "custom";
  export: string;
  category: string;
  style?: "rounded";
  weight?: number;
  path?: string;
};
