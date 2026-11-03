import React from "react";
import { Overlay } from "./Overlay";
import type { OverlayProps } from "./Overlay";

export type MenuProps = Omit<OverlayProps, "autoFocus"> & {
  /** Tighter rows. @default false */
  dense?: boolean;
};

export type MenuItemProps = React.ComponentPropsWithRef<"button"> & {
  /** The row is the current choice. */
  selected?: boolean;
};

function MenuItem({ selected, children, ...props }: MenuItemProps) {
  return (
    <button type="button" role="menuitem" aria-checked={selected} {...props}>
      {children}
    </button>
  );
}

function MenuRoot({ dense = false, children, ...props }: MenuProps) {
  return (
    <Overlay {...props} autoFocus={false}>
      <div data-dense={dense}>{children}</div>
    </Overlay>
  );
}

/** A list of actions in an overlay. */
export const Menu = Object.assign(MenuRoot, { Item: MenuItem });
