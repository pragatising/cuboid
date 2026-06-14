import React from "react";
import type { MaterialSymbolsComponent } from "@material-symbols-svg/react/rounded/w400";

/**
 * Wrap a Material Symbols **Rounded** glyph for use inside {@link Icon} or {@link IconButton}.
 * Parent controls size via tokens; glyph uses `currentColor`.
 */
export function createMaterialIcon(IconComponent: MaterialSymbolsComponent): React.FC {
  const MaterialIcon = () => (
    <IconComponent
      aria-hidden
      focusable={false}
      width="100%"
      height="100%"
      color="currentColor"
    />
  );

  MaterialIcon.displayName =
    (IconComponent as React.FC & { displayName?: string }).displayName ??
    IconComponent.displayName ??
    "MaterialIcon";

  return MaterialIcon;
}
