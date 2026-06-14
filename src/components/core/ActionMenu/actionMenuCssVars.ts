import type { ActionMenuFunctionalColors, ThemeTokens } from "../../../theme/types";

export function actionMenuCssVars(tokens: ThemeTokens): Record<string, string> {
  const { actionMenu } = tokens.colors.functional;
  const sizes = tokens.sizes.actionMenu;
  const caption = tokens.typography.text.caption;
  const body = tokens.typography.text.bodyMedium;

  const out: Record<string, string> = {
    "--cube-typography-fontFamily-base": tokens.typography.fontFamily.base,
    "--cube-typography-text-body-medium-fontSize": body.fontSize,
    "--cube-typography-text-body-medium-fontWeight": String(body.fontWeight),
    "--cube-typography-text-body-medium-lineHeight": String(body.lineHeight),
    "--cube-typography-text-caption-fontSize": caption.fontSize,
    "--cube-typography-text-caption-fontWeight": String(caption.fontWeight),
    "--cube-typography-text-caption-lineHeight": String(caption.lineHeight),
    "--cube-color-focus": tokens.colors.global.focus,
  };

  appendItemColors(out, actionMenu);
  appendItemSizes(out, sizes.item);
  appendListSizes(out, sizes.list);
  appendSectionColorsAndSizes(out, actionMenu, sizes.section);
  appendHeaderSizes(out, sizes.header);
  appendFooterSizes(out, sizes.footer);

  return out;
}

function appendItemColors(out: Record<string, string>, actionMenu: ActionMenuFunctionalColors) {
  const { bgColor, fgColor } = actionMenu.item;
  for (const state of ["rest", "hover", "pressed", "disabled"] as const) {
    out[`--cube-actionMenu-item-bg-${state}`] = bgColor[state];
  }
  for (const state of ["rest", "pressed"] as const) {
    out[`--cube-actionMenu-item-bg-selected-${state}`] = bgColor.selected[state];
  }
  for (const state of ["rest", "pressed", "disabled", "selected", "subtext"] as const) {
    out[`--cube-actionMenu-item-fg-${state}`] = fgColor[state];
  }
}

function appendItemSizes(
  out: Record<string, string>,
  item: ThemeTokens["sizes"]["actionMenu"]["item"]
) {
  out["--cube-actionMenu-item-min-height"] = item.minHeight;
  out["--cube-actionMenu-item-padding-inline"] = item.paddingInline;
  out["--cube-actionMenu-item-padding-block"] = item.paddingBlock;
  out["--cube-actionMenu-item-border-radius"] = item.borderRadius;
  out["--cube-actionMenu-item-slot-gap"] = item.slotGap;
  out["--cube-actionMenu-item-subtext-gap"] = item.subtextGap;
  out["--cube-actionMenu-item-icon-size"] = item.iconSize;
  out["--cube-actionMenu-item-subtext-icon-size"] = item.subtextIconSize;
}

function appendListSizes(
  out: Record<string, string>,
  list: ThemeTokens["sizes"]["actionMenu"]["list"]
) {
  out["--cube-actionMenu-list-padding-inline"] = list.paddingInline;
  out["--cube-actionMenu-list-padding-block"] = list.paddingBlock;
  out["--cube-actionMenu-list-item-gap"] = list.itemGap;
  out["--cube-actionMenu-list-section-gap"] = list.sectionGap;
}

function appendSectionColorsAndSizes(
  out: Record<string, string>,
  actionMenu: ActionMenuFunctionalColors,
  section: ThemeTokens["sizes"]["actionMenu"]["section"]
) {
  out["--cube-actionMenu-section-fg"] = actionMenu.section.fgColor;
  out["--cube-actionMenu-section-padding-inline"] = section.paddingInline;
  out["--cube-actionMenu-section-padding-block"] = section.paddingBlock;
  out["--cube-actionMenu-divider-fg"] = actionMenu.divider.fgColor;
}

function appendHeaderSizes(
  out: Record<string, string>,
  header: ThemeTokens["sizes"]["actionMenu"]["header"]
) {
  out["--cube-actionMenu-header-padding-inline"] = header.paddingInline;
  out["--cube-actionMenu-header-padding-block-start"] = header.paddingBlockStart;
  out["--cube-actionMenu-header-padding-block-end"] = header.paddingBlockEnd;
}

function appendFooterSizes(
  out: Record<string, string>,
  footer: ThemeTokens["sizes"]["actionMenu"]["footer"]
) {
  out["--cube-actionMenu-footer-padding"] = footer.padding;
}
