import type React from "react";
import type { Tokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";

/**
 * The element-scoped variables the ActionMenu CSS reads, set from the resolved `actionMenu` tokens plus the label and
 * subtext fonts and the focus ring: `tokens.actionMenu.item.bgColor.rest` becomes `--action-menu-item-bg-color-rest`,
 * `tokens.actionMenu.sizes.list.paddingInline` becomes `--action-menu-sizes-list-padding-inline`. They are set on the list,
 * on each item (so a row works outside a list) and on the header and footer, which Popover renders outside a list.
 */
export function actionMenuVars(tokens: Pick<Tokens, "actionMenu" | "text" | "focusRing">): React.CSSProperties {
  return cssVars("actionMenu", {
    ...tokens.actionMenu,
    labelFont: tokens.text.size.md,
    subtextFont: tokens.text.size.sm,
    focusColor: tokens.focusRing.color,
    focusWidth: tokens.focusRing.width,
  });
}
