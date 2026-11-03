import React from "react";
import { FILE_TYPE_SOURCES, FILE_TYPE_MODE } from "./fileTypes";
import type { FileType } from "./fileTypes";
import classes from "./FileTypeIcon.module.css";

export type FileTypeIconProps = Omit<React.ComponentPropsWithoutRef<"span">, "children"> & {
  /** What it stands for: a kind of file in code mode, a component, an instance or its examples in design mode. */
  type: FileType;
  /** The side of its square, in px. @default 20 */
  size?: number;
  /** When set, the icon is exposed as an image with this name; otherwise it is decorative. */
  label?: string;
};

/**
 * The icon of a kind of file or node (Figma FileType, 5004:29558). A square tile, as the Figma draws it; `size` scales it whole. The
 * artwork is the Figma's, so its colours do not follow the theme.
 */
export function FileTypeIcon({ type, size = 20, label, className, style, ...props }: FileTypeIconProps) {
  return (
    <span
      {...props}
      className={[classes.FileTypeIcon, className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, ...style }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-component="FileTypeIcon"
      data-type={type}
      data-mode={FILE_TYPE_MODE[type]}
    >
      {/* The React mark is the tile's own colour at half strength, set in a tile of its own (Figma 5008:53061). */}
      <img src={FILE_TYPE_SOURCES[type]} alt="" className={type === "react" ? classes.React : classes.Art} draggable={false} />
    </span>
  );
}
