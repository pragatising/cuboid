#!/usr/bin/env node
/**
 * Generate a CSS variables file from src/theme/output/theme.json.
 *
 * This is the CSS bridge that lets component styles (CSS Modules) consume tokens
 * without injecting per-instance inline CSS variables.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const INPUT = path.join(ROOT, "src/theme/output/theme.json");
const OUTPUT = path.join(ROOT, "src/theme/output/theme.css");

const PREFIX = "--cube";

/** Theme keys like extraSmall → CSS segments like extra-small */
function cssSegment(key) {
  return String(key).replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`);
}

function emitNestedStringVars(obj, pathParts, prefix, set) {
  if (typeof obj === "string") {
    const name = [prefix, ...pathParts.map(cssSegment)].filter(Boolean).join("-");
    set(name, obj);
    return;
  }
  if (!obj || typeof obj !== "object") return;
  for (const [key, value] of Object.entries(obj)) {
    emitNestedStringVars(value, [...pathParts, key], prefix, set);
  }
}

function controlStopCssSegment(stop) {
  return cssSegment(stop);
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Missing input: ${INPUT}`);
    process.exit(1);
  }

  const t = JSON.parse(fs.readFileSync(INPUT, "utf8"));

  const vars = new Map();
  const set = (name, value) => {
    if (typeof value === "string") {
      vars.set(`${PREFIX}-${name}`, value);
      return;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      vars.set(`${PREFIX}-${name}`, String(value));
    }
  };

  // Sizes
  set("sizes-borderRadius-md", t.sizes?.borderRadius?.md);
  set("sizes-borderRadius-full", t.sizes?.borderRadius?.full);
  set("sizes-borderWidth-thin", t.sizes?.borderWidth?.thin);
  set("breakpoint-md", t.sizes?.breakpoints?.md);
  set("breakpoint-lg", t.sizes?.breakpoints?.lg);
  emitNestedStringVars(t.sizes?.stack?.gap, [], "stack-gap", set);
  emitNestedStringVars(t.sizes?.stack?.padding, [], "stack-padding", set);

  // Typography
  set("typography-fontFamily-base", t.typography?.fontFamily?.base);
  set("typography-fontFamily-mono", t.typography?.fontFamily?.mono);

  const textStyles = t.typography?.text;
  if (textStyles && typeof textStyles === "object") {
    for (const key of Object.keys(textStyles)) {
      const seg = cssSegment(key);
      const st = textStyles[key];
      if (!st || typeof st !== "object") continue;
      set(`typography-text-${seg}-fontSize`, st.fontSize);
      set(`typography-text-${seg}-fontWeight`, st.fontWeight);
      set(`typography-text-${seg}-lineHeight`, st.lineHeight);
      if (typeof st.fontFamily === "string") {
        set(`typography-text-${seg}-fontFamily`, st.fontFamily);
      }
    }
  }

  set("tooltip-gap", t.sizes?.tooltip?.gap);
  set("tooltip-bg", t.tooltipColors?.background);
  set("tooltip-border", t.tooltipColors?.border);
  set("tooltip-fg", t.tooltipColors?.foreground);
  set("tooltip-borderRadius", t.sizes?.tooltip?.borderRadius);
  set("tooltip-paddingInline", t.sizes?.tooltip?.paddingInline);
  set("tooltip-paddingBlock", t.sizes?.tooltip?.paddingBlock);
  set("tooltip-maxWidth", t.sizes?.tooltip?.maxWidth);
  set("tooltip-maxWidthSingleLine", t.sizes?.tooltip?.maxWidthSingleLine);
  set("tooltip-shadow", t.sizes?.tooltip?.boxShadow);

  // Functional colors (component-facing aliases)
  emitNestedStringVars(t.colors?.functional?.background, [], "colors-functional-background", set);
  emitNestedStringVars(t.colors?.functional?.foreground, [], "colors-functional-foreground", set);
  emitNestedStringVars(t.colors?.functional?.border, [], "colors-functional-border", set);

  // Global palette (tokens/functional/colors/globals.json → color.*)
  emitNestedStringVars(t.globalColors, [], "color", set);

  // Button variant tokens
  for (const [variantKey, objKey] of [
    ["primary", "buttonPrimary"],
    ["secondary", "buttonSecondary"],
    ["ghost", "buttonGhost"],
    ["danger", "buttonDanger"],
    ["rounded", "buttonRounded"],
  ]) {
    const v = t[objKey];
    for (const state of ["rest", "hover", "pressed", "disabled"]) {
      set(`button-${variantKey}-bg-${state}`, v?.bgColor?.[state]);
      set(`button-${variantKey}-fg-${state}`, v?.fgColor?.[state]);
      set(`button-${variantKey}-border-${state}`, v?.borderColor?.[state]);
    }
  }

  for (const variantKey of ["inline", "standalone"]) {
    const v = t.linkColors?.[variantKey];
    set(`link-${variantKey}-fg-rest`, v?.rest);
    set(`link-${variantKey}-fg-hover`, v?.hover);
  }

  const breadcrumbLink = t.breadcrumbColors?.link;
  if (breadcrumbLink) {
    for (const state of ["rest", "hover", "active"]) {
      set(`breadcrumb-link-bg-${state}`, breadcrumbLink.bgColor?.[state]);
      set(`breadcrumb-link-fg-${state}`, breadcrumbLink.fgColor?.[state]);
    }
    set(`breadcrumb-separator-fg`, t.breadcrumbColors?.separator?.fgColor);
  }

  const breadcrumbSizes = t.sizes?.breadcrumb;
  if (breadcrumbSizes) {
    set(`breadcrumb-gap`, breadcrumbSizes.gap);
    set(`breadcrumb-item-paddingInline`, breadcrumbSizes.itemPaddingInline);
    set(`breadcrumb-item-paddingBlock`, breadcrumbSizes.itemPaddingBlock);
    set(`breadcrumb-item-borderRadius`, breadcrumbSizes.itemBorderRadius);
    set(`breadcrumb-separator-width`, breadcrumbSizes.separatorWidth);
  }

  const siteHeaderColors = t.siteHeaderColors;
  if (siteHeaderColors) {
    set(`siteHeader-bg`, siteHeaderColors.background);
    set(`siteHeader-border`, siteHeaderColors.border);
    set(`siteHeader-divider-fg`, siteHeaderColors.divider);
  }

  const siteHeaderSizes = t.sizes?.siteHeader;
  if (siteHeaderSizes) {
    set(`siteHeader-height`, siteHeaderSizes.height);
    set(`siteHeader-paddingInlineStart`, siteHeaderSizes.paddingInlineStart);
    set(`siteHeader-paddingInlineEnd`, siteHeaderSizes.paddingInlineEnd);
    set(`siteHeader-paddingBlock`, siteHeaderSizes.paddingBlock);
    set(`siteHeader-leadingGap`, siteHeaderSizes.leadingGap);
    set(`siteHeader-trailingGap`, siteHeaderSizes.trailingGap);
    set(`siteHeader-divider-height`, siteHeaderSizes.dividerHeight);
    set(`siteHeader-divider-width`, siteHeaderSizes.dividerWidth);
  }

  const overlayColors = t.overlayColors;
  if (overlayColors) {
    set(`overlay-modal-bg`, overlayColors.modal);
    set(`overlay-sheet-bg`, overlayColors.sheet);
    set(`overlay-none-bg`, overlayColors.none);
  }

  emitNestedStringVars(t.sizes?.zIndex, [], "z-index", set);

  const sheetColors = t.sheetColors;
  if (sheetColors) {
    set(`sheet-bg`, sheetColors.background);
  }

  const sheetSizes = t.sizes?.sheet;
  if (sheetSizes) {
    set(`sheet-width-sm`, sheetSizes.width?.sm);
    set(`sheet-width-md`, sheetSizes.width?.md);
    set(`sheet-width-lg`, sheetSizes.width?.lg);
    set(`sheet-minWidth`, sheetSizes.minWidth);
    set(`sheet-maxWidth`, sheetSizes.maxWidth);
    set(`sheet-maxHeight`, sheetSizes.maxHeight);
    set(`sheet-padding`, sheetSizes.padding);
    set(`sheet-bottomCornerRadius`, sheetSizes.bottomCornerRadius);
  }

  const resizeHandleSizes = t.sizes?.resizeHandle;
  if (resizeHandleSizes) {
    set(`resizeHandle-hitArea`, resizeHandleSizes.hitArea);
  }

  const shadows = t.shadows;
  if (shadows) {
    set(`shadow-popover`, shadows.popover);
    set(`shadow-popoverElevated`, shadows.popoverElevated);
    set(`shadow-sheet`, shadows.sheet);
  }

  const popoverColors = t.popoverColors;
  if (popoverColors) {
    set(`popover-bg`, popoverColors.background);
  }

  const popoverSizes = t.sizes?.popover;
  if (popoverSizes) {
    set(`popover-gap`, popoverSizes.gap);
    set(`popover-borderRadius`, popoverSizes.borderRadius);
    set(`popover-minWidth`, popoverSizes.minWidth);
    set(`popover-maxWidth`, popoverSizes.maxWidth);
  }

  const actionMenuColors = t.actionMenuColors;
  if (actionMenuColors) {
    const itemBg = actionMenuColors.item?.bgColor;
    const itemFg = actionMenuColors.item?.fgColor;
    if (itemBg) {
      for (const state of ["rest", "hover", "pressed", "disabled"]) {
        set(`actionMenu-item-bg-${state}`, itemBg[state]);
      }
      for (const state of ["rest", "pressed"]) {
        set(`actionMenu-item-bg-selected-${state}`, itemBg.selected?.[state]);
      }
    }
    if (itemFg) {
      for (const state of ["rest", "pressed", "disabled", "selected", "subtext"]) {
        set(`actionMenu-item-fg-${state}`, itemFg[state]);
      }
    }
    set(`actionMenu-section-fg`, actionMenuColors.section?.fgColor);
    set(`actionMenu-divider-fg`, actionMenuColors.divider?.fgColor);
  }

  const actionMenuSizes = t.sizes?.actionMenu;
  if (actionMenuSizes) {
    emitNestedStringVars(actionMenuSizes.item, [], "actionMenu-item", set);
    emitNestedStringVars(actionMenuSizes.list, [], "actionMenu-list", set);
    emitNestedStringVars(actionMenuSizes.section, [], "actionMenu-section", set);
    emitNestedStringVars(actionMenuSizes.header, [], "actionMenu-header", set);
    emitNestedStringVars(actionMenuSizes.footer, [], "actionMenu-footer", set);
  }

  const pillColors = t.pillColors;
  if (pillColors && typeof pillColors === "object") {
    for (const shade of Object.keys(pillColors).sort()) {
      const shadeBlock = pillColors[shade];
      if (!shadeBlock || typeof shadeBlock !== "object") continue;
      for (const intensity of Object.keys(shadeBlock).sort()) {
        const intensityBlock = shadeBlock[intensity];
        if (!intensityBlock || typeof intensityBlock !== "object") continue;
        for (const surface of ["filled", "bordered"]) {
          const v = intensityBlock[surface];
          if (!v || typeof v !== "object") continue;
          for (const state of ["rest", "hover", "pressed", "disabled"]) {
            set(
              `pill-${shade}-${intensity}-${surface}-bg-${state}`,
              v?.bgColor?.[state]
            );
            set(
              `pill-${shade}-${intensity}-${surface}-fg-${state}`,
              v?.fgColor?.[state]
            );
            set(
              `pill-${shade}-${intensity}-${surface}-border-${state}`,
              v?.borderColor?.[state]
            );
          }
        }
      }
    }
  }

  for (const sizeKey of ["sm", "md"]) {
    const row = t.sizes?.pill?.[sizeKey];
    set(`pill-${sizeKey}-paddingInline`, row?.paddingInline);
    set(`pill-${sizeKey}-paddingBlock`, row?.paddingBlock);
    set(`pill-${sizeKey}-borderRadius`, row?.borderRadius);
    set(`pill-${sizeKey}-gap`, row?.gap);
  }

  const ib = t.iconButton;
  if (ib && typeof ib === "object") {
    for (const styleKey of Object.keys(ib).sort()) {
      const styleBlock = ib[styleKey];
      if (!styleBlock || typeof styleBlock !== "object") continue;
      for (const selKey of ["unselected", "selected"]) {
        const v = styleBlock[selKey];
        if (!v || typeof v !== "object") continue;
        for (const state of ["rest", "hover", "pressed", "disabled"]) {
          set(`iconButton-${styleKey}-${selKey}-bg-${state}`, v?.bgColor?.[state]);
          set(`iconButton-${styleKey}-${selKey}-fg-${state}`, v?.fgColor?.[state]);
          set(`iconButton-${styleKey}-${selKey}-border-${state}`, v?.borderColor?.[state]);
        }
      }
    }
  }

  const controlStops = ["extraSmall", "small", "medium", "large"];

  // Control size tokens (shared geometry)
  for (const stop of controlStops) {
    const seg = controlStopCssSegment(stop);
    const c = t.sizes?.control?.[stop];
    set(`control-${seg}-size`, c?.size);
    set(`control-${seg}-borderRadius`, c?.borderRadius);
    set(`control-${seg}-gap`, c?.gap);
    set(`control-${seg}-paddingBlock`, c?.paddingBlock);
    set(`control-${seg}-paddingInline-condensed`, c?.paddingInline?.condensed);
    set(`control-${seg}-paddingInline-normal`, c?.paddingInline?.normal);
    set(`control-${seg}-paddingInline-spacious`, c?.paddingInline?.spacious);
  }

  for (const stop of controlStops) {
    const seg = controlStopCssSegment(stop);
    const ib = t.sizes?.iconButton?.[stop];
    set(`iconButton-${seg}-size`, ib?.size);
    set(`iconButton-${seg}-borderRadius`, ib?.borderRadius);
    set(`iconButton-${seg}-icon`, ib?.icon);
  }

  // Button label typography (per control stop)
  for (const stop of controlStops) {
    const seg = controlStopCssSegment(stop);
    const b = t.typography?.button?.[stop];
    set(`typography-button-${seg}-fontSize`, b?.fontSize);
    set(`typography-button-${seg}-lineHeight`, b?.lineHeight);
  }

  for (const stop of ["sm", "md"]) {
    const p = t.typography?.pill?.[stop];
    set(`typography-pill-${stop}-fontSize`, p?.fontSize);
    set(`typography-pill-${stop}-lineHeight`, p?.lineHeight);
    set(`typography-pill-${stop}-fontWeight`, p?.fontWeight);
  }

  const lines = [];
  lines.push("/* AUTO-GENERATED by scripts/build-theme-css.mjs */");
  lines.push(":root {");
  for (const [k, v] of [...vars.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`  ${k}: ${v};`);
  }
  lines.push("}");
  lines.push("");

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, lines.join("\n"), "utf8");
  console.log(`Wrote ${OUTPUT}`);
}

main();

