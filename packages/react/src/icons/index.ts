import manifest from "@sragatiping/cuboid-primitives/icons/manifest.json";

export type { IconAxes, IconLibrary } from "./IconLibrary";
export type { IconName } from "@sragatiping/cuboid-primitives/icons/names";
export { ICON_NAMES, isIconName } from "@sragatiping/cuboid-primitives/icons/names";
export { materialSymbolsIconLibrary } from "./material/materialSymbolsIconLibrary";

export { manifest as iconManifest };

/**
 * One `manifest.json` entry — maps a Figma design-tool icon name onto the
 * canonical `IconName` cuboid actually renders (plus whether it's the filled
 * variant). Figma names are a design-tool concern; `IconName` (from Material's
 * own manifest) is the runtime source of truth — see `IconLibrary.ts`.
 */
export type IconManifestEntry = {
  name: import("@sragatiping/cuboid-primitives/icons/names").IconName;
  category: string;
  filled: boolean;
};
