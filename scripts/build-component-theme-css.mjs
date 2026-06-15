#!/usr/bin/env node
/**
 * Component token CSS — colors + component-specific selector rules.
 * Foundation tokens live in theme.css (globals, shadows, size, typography).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const INPUT = path.join(ROOT, "src/theme/output/theme.json");
const OUTPUT = path.join(ROOT, "src/theme/output/components.css");

const PREFIX = "--cube";

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

/** Component layout tokens — not exported in theme.css */
function emitComponentSizeTokens(t, set) {
  const layoutSizes = t.sizes?.layout;
  if (layoutSizes) {
    set("layout-pageMaxWidth", layoutSizes.pageMaxWidth);
    set("layout-contentMaxWidth", layoutSizes.contentMaxWidth);
    set("layout-sectionLabelWidth", layoutSizes.sectionLabelWidth);
    set("layout-pagePaddingInline", layoutSizes.pagePaddingInline);
  }

  const highlightSizes = t.sizes?.highlight;
  if (highlightSizes) {
    set("highlight-paddingInline", highlightSizes.paddingInline);
    set("highlight-paddingBlock", highlightSizes.paddingBlock);
    set("highlight-borderRadius", highlightSizes.borderRadius);
  }

  const breadcrumbSizes = t.sizes?.breadcrumb;
  if (breadcrumbSizes) {
    set("breadcrumb-gap", breadcrumbSizes.gap);
    set("breadcrumb-item-paddingInline", breadcrumbSizes.itemPaddingInline);
    set("breadcrumb-item-paddingBlock", breadcrumbSizes.itemPaddingBlock);
    set("breadcrumb-item-borderRadius", breadcrumbSizes.itemBorderRadius);
    set("breadcrumb-separator-width", breadcrumbSizes.separatorWidth);
  }

  const siteHeaderSizes = t.sizes?.siteHeader;
  if (siteHeaderSizes) {
    set("siteHeader-height", siteHeaderSizes.height);
    set("siteHeader-paddingInlineStart", siteHeaderSizes.paddingInlineStart);
    set("siteHeader-paddingInlineEnd", siteHeaderSizes.paddingInlineEnd);
    set("siteHeader-paddingBlock", siteHeaderSizes.paddingBlock);
    set("siteHeader-leadingGap", siteHeaderSizes.leadingGap);
    set("siteHeader-trailingGap", siteHeaderSizes.trailingGap);
    set("siteHeader-divider-height", siteHeaderSizes.dividerHeight);
    set("siteHeader-divider-width", siteHeaderSizes.dividerWidth);
  }

  const sheetSizes = t.sizes?.sheet;
  if (sheetSizes) {
    set("sheet-width-sm", sheetSizes.width?.sm);
    set("sheet-width-md", sheetSizes.width?.md);
    set("sheet-width-lg", sheetSizes.width?.lg);
    set("sheet-minWidth", sheetSizes.minWidth);
    set("sheet-maxWidth", sheetSizes.maxWidth);
    set("sheet-maxHeight", sheetSizes.maxHeight);
    set("sheet-padding", sheetSizes.padding);
    set("sheet-bottomCornerRadius", sheetSizes.bottomCornerRadius);
  }

  const sidebarSizes = t.sizes?.sidebar;
  if (sidebarSizes) {
    set("sidebar-width-sm", sidebarSizes.width?.sm);
    set("sidebar-width-md", sidebarSizes.width?.md);
    set("sidebar-width-lg", sidebarSizes.width?.lg);
    set("sidebar-widthMinimized", sidebarSizes.widthMinimized);
    set("sidebar-minWidth", sidebarSizes.minWidth);
    set("sidebar-maxWidth", sidebarSizes.maxWidth);
    set("sidebar-padding", sidebarSizes.padding);
    set("sidebar-footerPadding", sidebarSizes.footerPadding);
  }

  const resizeHandleSizes = t.sizes?.resizeHandle;
  if (resizeHandleSizes) {
    set("resizeHandle-hitArea", resizeHandleSizes.hitArea);
  }

  const popoverSizes = t.sizes?.popover;
  if (popoverSizes) {
    set("popover-gap", popoverSizes.gap);
    set("popover-borderRadius", popoverSizes.borderRadius);
    set("popover-minWidth", popoverSizes.minWidth);
    set("popover-maxWidth", popoverSizes.maxWidth);
  }

  const actionMenuSizes = t.sizes?.actionMenu;
  if (actionMenuSizes) {
    emitNestedStringVars(actionMenuSizes.item, [], "actionMenu-item", set);
    emitNestedStringVars(actionMenuSizes.list, [], "actionMenu-list", set);
    emitNestedStringVars(actionMenuSizes.section, [], "actionMenu-section", set);
    emitNestedStringVars(actionMenuSizes.header, [], "actionMenu-header", set);
    emitNestedStringVars(actionMenuSizes.footer, [], "actionMenu-footer", set);
  }

  const pillRow = t.sizes?.pill;
  set("pill-paddingInline", pillRow?.paddingInline);
  set("pill-paddingBlock", pillRow?.paddingBlock);
  set("pill-borderRadius", pillRow?.borderRadius);
  set("pill-gap", pillRow?.gap);

  set("tooltip-gap", t.sizes?.tooltip?.gap);
  set("tooltip-borderRadius", t.sizes?.tooltip?.borderRadius);
  set("tooltip-paddingInline", t.sizes?.tooltip?.paddingInline);
  set("tooltip-paddingBlock", t.sizes?.tooltip?.paddingBlock);
  set("tooltip-maxWidth", t.sizes?.tooltip?.maxWidth);
  set("tooltip-maxWidthSingleLine", t.sizes?.tooltip?.maxWidthSingleLine);
  set("tooltip-shadow", t.sizes?.tooltip?.boxShadow);

  const controlStops = ["extraSmall", "small", "medium", "large"];
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

    const ib = t.sizes?.iconButton?.[stop];
    set(`iconButton-${seg}-size`, ib?.size);
    set(`iconButton-${seg}-borderRadius`, ib?.borderRadius);
    set(`iconButton-${seg}-icon`, ib?.icon);
  }
}

function emitPillSelectorRules(pillColors, lines) {
  if (!pillColors || typeof pillColors !== "object") return;

  lines.push("/* Pill — [data-cube-pill]; vars below (--cube-pill-*-bg|fg|border) */");

  for (const shade of Object.keys(pillColors).sort()) {
    const shadeBlock = pillColors[shade];
    if (!shadeBlock || typeof shadeBlock !== "object") continue;

    for (const intensity of Object.keys(shadeBlock).sort()) {
      const intensityBlock = shadeBlock[intensity];
      if (!intensityBlock || typeof intensityBlock !== "object") continue;

      for (const surface of ["filled", "bordered"]) {
        const key = `${shade}-${intensity}-${surface}`;
        const p = `--cube-pill-${key}`;

        lines.push(`[data-cube-pill="${key}"] {`);
        lines.push(`  color: var(${p}-fg);`);
        lines.push(`  background-color: var(${p}-bg);`);
        lines.push(`  border-color: var(${p}-border);`);
        lines.push(`}`);

        lines.push(`a[data-cube-pill="${key}"]:visited {`);
        lines.push(`  color: var(${p}-fg);`);
        lines.push(`  background-color: var(${p}-bg);`);
        lines.push(`  border-color: var(${p}-border);`);
        lines.push(`}`);

        lines.push(`[data-cube-pill="${key}"]:disabled,`);
        lines.push(`[data-cube-pill="${key}"][aria-disabled="true"] {`);
        lines.push(`  opacity: 0.45;`);
        lines.push(`  cursor: not-allowed;`);
        lines.push(`}`);
        lines.push("");
      }
    }
  }
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
    }
  };

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

  const highlightColors = t.highlightColors;
  if (highlightColors) {
    for (const shade of Object.keys(highlightColors)) {
      set(`highlight-${shade}-bg`, highlightColors[shade]?.bgColor);
      set(`highlight-${shade}-fg`, highlightColors[shade]?.fgColor);
    }
  }

  const breadcrumbLink = t.breadcrumbColors?.link;
  if (breadcrumbLink) {
    for (const state of ["rest", "hover", "active"]) {
      set(`breadcrumb-link-bg-${state}`, breadcrumbLink.bgColor?.[state]);
      set(`breadcrumb-link-fg-${state}`, breadcrumbLink.fgColor?.[state]);
    }
    set(`breadcrumb-separator-fg`, t.breadcrumbColors?.separator?.fgColor);
  }

  const siteHeaderColors = t.siteHeaderColors;
  if (siteHeaderColors) {
    set(`siteHeader-bg`, siteHeaderColors.background);
    set(`siteHeader-border`, siteHeaderColors.border);
    set(`siteHeader-divider-fg`, siteHeaderColors.divider);
  }

  const overlayColors = t.overlayColors;
  if (overlayColors) {
    set(`overlay-modal-bg`, overlayColors.modal);
    set(`overlay-sheet-bg`, overlayColors.sheet);
    set(`overlay-none-bg`, overlayColors.none);
  }

  const sheetColors = t.sheetColors;
  if (sheetColors) {
    set(`sheet-bg`, sheetColors.background);
  }

  const sidebarColors = t.sidebarColors;
  if (sidebarColors) {
    set(`sidebar-bg`, sidebarColors.background);
    set(`sidebar-border`, sidebarColors.border);
  }

  const popoverColors = t.popoverColors;
  if (popoverColors) {
    set(`popover-bg`, popoverColors.background);
  }

  set("tooltip-bg", t.tooltipColors?.background);
  set("tooltip-border", t.tooltipColors?.border);
  set("tooltip-fg", t.tooltipColors?.foreground);

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
          set(`pill-${shade}-${intensity}-${surface}-bg`, v?.bgColor);
          set(`pill-${shade}-${intensity}-${surface}-fg`, v?.fgColor);
          set(`pill-${shade}-${intensity}-${surface}-border`, v?.borderColor);
        }
      }
    }
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

  emitComponentSizeTokens(t, set);

  const lines = [];
  lines.push("/* AUTO-GENERATED by scripts/build-component-theme-css.mjs */");
  lines.push(":root {");
  for (const [k, v] of [...vars.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`  ${k}: ${v};`);
  }
  lines.push("}");
  lines.push("");
  emitPillSelectorRules(t.pillColors, lines);

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, lines.join("\n"), "utf8");
  console.log(`Wrote ${OUTPUT}`);
}

main();
