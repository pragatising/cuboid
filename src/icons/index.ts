import manifest from "./manifest.json";

export * from "./material";

export { MATERIAL_ICON_STYLE, MATERIAL_ICON_WEIGHT } from "./material/config";

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
