import React, { createContext, useCallback, useContext, useId, useMemo, useState } from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { lengthToPx } from "../../../utils/length";
import { mergeProps } from "../../../utils/mergeProps";
import type { PolymorphicProps } from "../../../utils/polymorphic";
import { resolveSpace } from "../../../utils/space";
import type { Space } from "../../../utils/space";
import { resolved } from "../../../utils/resolved";
import type { SpaceValue } from "../../../utils/space";
import { Box } from "../Box";
import { Heading } from "../Heading";
import { Icon } from "../Icon";
import { IconButton } from "../IconButton";
import { ResizeHandle } from "../ResizeHandle";
import { Tooltip } from "../Tooltip";
import { VisuallyHidden } from "../VisuallyHidden";
import classes from "./Sidebar.module.css";

export type SidebarEdge = "left" | "right";
/** A key of `tokens.sidebar.sizes.width`. */
export type SidebarWidthStop = keyof Tokens["sidebar"]["sizes"]["width"];
/** Named stop (`sm` / `md` / `lg`) or any CSS length (e.g. `17rem`). */
export type SidebarWidth = SidebarWidthStop | (string & {});

export type SidebarProps = Omit<React.ComponentPropsWithRef<"nav">, "color"> & {
  /** When true, the sidebar collapses to the minimized rail width. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Which document edge the sidebar sits on. @default "left" */
  edge?: SidebarEdge;
  /** Expanded width: token stop or CSS length. @default "md" */
  width?: SidebarWidth;
  /** Drag the inner edge to resize (disabled while collapsed). */
  resizable?: boolean;
  /** Fired while resizing with the current width in px. */
  onWidthChange?: (widthPx: number) => void;
};

export type SidebarRegionProps = Omit<React.ComponentPropsWithRef<"div">, "color"> & {
  /**
   * Override the region's block-axis (top+bottom) inset with a spacing token.
   * Defaults to the `sidebar.sizes.padding` / `footerPadding` token (uniform on all sides).
   */
  paddingBlock?: Space;
  /** Override the region's inline-axis (start+end) inset with a spacing token. */
  paddingInline?: Space;
};

export type SidebarHeaderProps = SidebarRegionProps & {
  /**
   * Whatever identifies what the sidebar belongs to: an avatar, an org logo, a team icon, any node. It is shown before
   * the title, and stays visible in the collapsed rail when the header has no toggle.
   */
  leadingVisual?: React.ReactNode;
  /**
   * Show the collapse toggle at the end of the header. In the collapsed rail the toggle replaces the title and
   * leading visual, so there is always a way to expand. Turn it off to drive collapse from elsewhere.
   * @default true
   */
  toggle?: boolean;
};

export type SidebarHeaderButtonProps = Omit<React.ComponentPropsWithRef<"button">, "color"> & {
  /** The button's label: the account, workspace or team name. */
  children: React.ReactNode;
  /** An avatar, a logo or an icon before the label. */
  leadingVisual?: React.ReactNode;
  /** After the label. A down chevron by default, which says "this opens a menu"; `false` for none. */
  trailingVisual?: React.ReactNode | false;
};

export type SidebarSectionProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "color"> & {
  /** The section's heading, shown above its items. It names the group for assistive technology, also when hidden by a collapsed rail. */
  label: React.ReactNode;
};

export type SidebarItemProps<As extends React.ElementType = "a"> = PolymorphicProps<
  As,
  "a",
  {
    /** The page the link points at: draws the selected look and sets `aria-current="page"`. @default false */
    current?: boolean;
    /** Shown before the label (typically an `Icon`). In a collapsed rail it is all that is shown, so give it one. */
    leadingVisual?: React.ReactNode;
    /** Shown after the label. Hidden in a collapsed rail. */
    trailingVisual?: React.ReactNode;
  }
>;

export type SidebarToggleProps = Omit<React.ComponentPropsWithRef<"button">, "children" | "aria-label" | "aria-labelledby"> & {
  /** Replace the default panel icon. */
  icon?: React.ReactNode;
  /** Override the default expand/collapse label. */
  "aria-label"?: string;
};

interface SidebarContextValue {
  collapsed: boolean;
  edge: SidebarEdge;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebarContext(component: string): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error(`${component} must be used within <Sidebar>.`);
  }
  return ctx;
}

/** Read collapse state and toggle from anywhere inside {@link Sidebar}. Items, sections and the header already follow it. */
export function useSidebar(): SidebarContextValue {
  return useSidebarContext("useSidebar");
}

const WIDTH_STOPS: SidebarWidthStop[] = ["sm", "md", "lg"];

function isWidthStop(value: SidebarWidth): value is SidebarWidthStop {
  return WIDTH_STOPS.includes(value as SidebarWidthStop);
}

function resolveSidebarWidthCss(width: SidebarWidth, stops: Tokens["sidebar"]["sizes"]["width"]): string {
  if (isWidthStop(width)) return stops[width];
  return width;
}

/**
 * The default toggle icon: Material's `dock_to_left` / `dock_to_right`. On the left edge the expanded sidebar shows
 * `dock_to_right` (collapse it) and the collapsed rail `dock_to_left` (expand it); the right edge is the mirror.
 */
function toggleIconName(edge: SidebarEdge, collapsed: boolean) {
  const dockedLeft = edge === "left" ? collapsed : !collapsed;
  return dockedLeft ? "dock_to_left" : "dock_to_right";
}

/** The collapse / expand button. The header already includes one; use this to place it anywhere else inside the sidebar. */
function SidebarToggle({ icon, "aria-label": ariaLabel, className, onClick, ...props }: SidebarToggleProps) {
  const { collapsed, edge, toggleCollapsed } = useSidebarContext("Sidebar.Toggle");

  return (
    <IconButton
      {...mergeProps(
        {
          "data-component": "Sidebar.Toggle",
          "aria-label": ariaLabel ?? (collapsed ? "Expand sidebar" : "Collapse sidebar"),
          "aria-expanded": !collapsed,
          variant: "ghost" as const,
          size: "sm" as const,
          className: clsx(classes.Toggle, className),
          onClick: toggleCollapsed,
          icon: icon ?? <Icon name={toggleIconName(edge, collapsed)} />,
        },
        { ...props, onClick },
      )}
    />
  );
}

/** The top of the sidebar: a leading visual and a title, then the collapse toggle. */
function SidebarHeader({ leadingVisual, toggle = true, paddingBlock, paddingInline, className, children, ...props }: SidebarHeaderProps) {
  const { collapsed } = useSidebarContext("Sidebar.Header");
  const { text, fontWeight, fgColor } = useTokens();
  // The collapsed rail has room for one thing: the toggle if the header has one, else the leading visual.
  const showLeading = leadingVisual != null && (!collapsed || !toggle);

  return (
    <Box
      {...mergeProps({ "data-component": "Sidebar.Header", className: clsx(classes.Header, className) }, props as object)}
      flexDirection="row"
      paddingBlock={paddingBlock}
      paddingInline={paddingInline}
    >
      {showLeading ? <span className={classes.LeadingVisual}>{leadingVisual}</span> : null}
      {!collapsed && children != null ? (
        <Box data-component="Sidebar.Title" className={classes.Title} font={text.size.md} fontWeight={fontWeight.medium} color={fgColor.neutral.default as never}>
          {children}
        </Box>
      ) : null}
      {toggle ? <SidebarToggle /> : null}
    </Box>
  );
}

/**
 * The header's title as a button: a leading visual, the name and a chevron, with the ActionMenu row's hover, pressed and
 * focus looks. It is the trigger for an account or workspace menu: give it to an `ActionMenu` or `Popover` as their
 * `trigger` (it takes a `ref` and the `aria-expanded` / `aria-controls` they add), and put the whole thing in a
 * `Sidebar.Header` in place of its title. Its pressed look also shows while the menu is open.
 */
function SidebarHeaderButton({ leadingVisual, trailingVisual, className, children, ...props }: SidebarHeaderButtonProps) {
  return (
    <Box
      as="button"
      {...mergeProps({ "data-component": "Sidebar.HeaderButton", type: "button" as const, className: clsx(classes.HeaderButton, className) }, props as object)}
      flexDirection="row"
      alignItems="center"
      gap="1x"
      width="100%"
      minWidth="0"
    >
      {leadingVisual ? <span className={classes.LeadingVisual}>{leadingVisual}</span> : null}
      <span className={classes.HeaderButtonLabel}>{children}</span>
      {trailingVisual === false ? null : (
        <span className={classes.HeaderButtonTrailing} aria-hidden="true">
          {trailingVisual ?? <Icon name="keyboard_arrow_down" size="xs" />}
        </span>
      )}
    </Box>
  );
}

function SidebarBody({ paddingBlock, paddingInline, className, ...props }: SidebarRegionProps) {
  return (
    <Box
      // The space between one group and the next; a `gap` you pass replaces it.
      gap="3x"
      {...mergeProps({ "data-component": "Sidebar.Body", className: clsx(classes.Body, className) }, props as object)}
      // The space between the header and the first section, unless the consumer sets the block padding.
      paddingBlockStart={paddingBlock === undefined ? "2x" : undefined}
      paddingBlock={paddingBlock}
      paddingInline={paddingInline}
    />
  );
}

function SidebarFooter({ paddingBlock, paddingInline, className, ...props }: SidebarRegionProps) {
  return (
    <Box
      {...mergeProps({ "data-component": "Sidebar.Footer", className: clsx(classes.Footer, className) }, props as object)}
      paddingBlock={paddingBlock}
      paddingInline={paddingInline}
    />
  );
}

/** Tells a `Sidebar.Item` it is in a section's list, so it renders as a list item. */
const SectionListContext = createContext(false);

/**
 * A labelled set of items: a group named by an `h3` (so screen-reader users can jump between groups) over a list of its
 * items. In the collapsed rail the heading is visually hidden, not removed, so the group keeps its name and its heading.
 */
function SidebarSection({ label, className, children, ...props }: SidebarSectionProps) {
  const { collapsed } = useSidebarContext("Sidebar.Section");
  const tokens = useTokens();
  const { actionMenu } = tokens;
  const labelId = useId();

  const heading = (
    <Heading
      as="h3"
      size="h6"
      id={labelId}
      className={classes.SectionLabel}
      style={{
        color: "var(--cube-actionMenu-item-fgColor-subtext)",
        letterSpacing: tokens.text.letterSpacing.label,
        paddingBlock: actionMenu.sizes.section.paddingBlock,
        paddingInline: resolveSpace(tokens, "1.5x"),
      }}
    >
      {label}
    </Heading>
  );

  return (
    <Box
      {...mergeProps(
        { "data-component": "Sidebar.Section", role: "group", "aria-labelledby": labelId, className: clsx(classes.Section, className) },
        props as object,
      )}
      // Space between the heading and its list; the items' own gap is `actionMenu.sizes.list.itemGap`.
      gap="1x"
    >
      {collapsed ? <VisuallyHidden>{heading}</VisuallyHidden> : heading}
      <Box as="ul" role="list" margin={0} padding={0} gap={resolved<SpaceValue>(actionMenu.sizes.list.itemGap)} className={classes.SectionItems}>
        <SectionListContext.Provider value>{children}</SectionListContext.Provider>
      </Box>
    </Box>
  );
}

/**
 * One link of the nav rail. It follows the sidebar: in a collapsed rail it shows only its `leadingVisual` (named by its
 * label, with a tooltip), so consumers do not switch it themselves.
 *
 * It looks like an ActionMenu row (the Figma nav rail is that design) and reads `tokens.actionMenu`, but it is a link,
 * not a menu item: `aria-current` marks the page, and there is no `role="menuitem"`.
 */
function SidebarItem<As extends React.ElementType = "a">({
  as,
  current = false,
  leadingVisual,
  trailingVisual,
  className,
  children,
  ...props
}: SidebarItemProps<As>) {
  const Component: React.ElementType = as ?? "a";
  const inList = useContext(SectionListContext);
  const { collapsed, edge } = useSidebarContext("Sidebar.Item");
  const { ["aria-label"]: ariaLabel, ...rest } = props as { "aria-label"?: string };
  // Without a visual there is nothing to show in the rail, so the label stays.
  const iconOnly = collapsed && leadingVisual != null;
  const name = ariaLabel ?? (iconOnly && typeof children === "string" ? children : undefined);

  const link = (
    <Component
      {...mergeProps(
        {
          "data-component": "Sidebar.Item",
          "data-current": current ? "" : undefined,
          "data-icon-only": iconOnly ? "" : undefined,
          "aria-current": current ? ("page" as const) : undefined,
          // A collapsed item is named by its tooltip.
          "aria-label": iconOnly && name ? undefined : name,
          className: clsx(classes.Item, className as string | undefined),
        },
        rest as object,
      )}
    >
      <span className={classes.ItemInner}>
        {leadingVisual ? <span className={classes.Slot}>{leadingVisual}</span> : null}
        {!iconOnly ? <span className={classes.ItemLabel}>{children as React.ReactNode}</span> : null}
        {!iconOnly && trailingVisual ? <span className={classes.Slot}>{trailingVisual}</span> : null}
      </span>
    </Component>
  );

  const item =
    iconOnly && name ? (
      <Tooltip text={name} type="label" placement={tooltipPlacement(edge)}>
        {link}
      </Tooltip>
    ) : (
      link
    );

  return inList ? (
    <Box as="li" display="block" margin={0} padding={0} className={classes.SectionItem}>
      {item}
    </Box>
  ) : (
    item
  );
}

function tooltipPlacement(edge: SidebarEdge) {
  return edge === "left" ? "right" : "left";
}

/**
 * In-flow navigation shell, a `<nav>`: not portaled like {@link Sheet}.
 *
 * Build the nav rail from {@link Sidebar.Header} (a leading visual, a title and the collapse toggle),
 * {@link Sidebar.Body} holding {@link Sidebar.Section}s of {@link Sidebar.Item}s, and {@link Sidebar.Footer}.
 * Everything inside follows the collapse state (controlled or uncontrolled), so items and sections need no logic of
 * their own.
 */
export function Sidebar({
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  edge = "left",
  width = "md",
  resizable = false,
  onWidthChange,
  className,
  style,
  children,
  ...props
}: SidebarProps) {
  const tokens = useTokens();
  const { sidebar, borderWidth, size } = tokens;
  const layout = sidebar.sizes;

  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? internalCollapsed;

  const toggleCollapsed = useCallback(() => {
    if (collapsedProp === undefined) setInternalCollapsed(!collapsed);
    onCollapsedChange?.(!collapsed);
  }, [collapsed, collapsedProp, onCollapsedChange]);

  const contextValue = useMemo<SidebarContextValue>(() => ({ collapsed, edge, toggleCollapsed }), [collapsed, edge, toggleCollapsed]);

  const defaultWidthCss = resolveSidebarWidthCss(width, layout.width);
  const minWidthPx = lengthToPx(layout.minWidth, 200);
  const maxWidthPx = lengthToPx(layout.maxWidth, 480);

  // The width the user dragged to, remembered per `width` prop: changing the prop starts over from its stop. It is never
  // cleared by collapsing, so expanding returns to where the user left it.
  const [dragged, setDragged] = useState<{ base: string; px: number } | null>(null);
  const draggedPx = dragged?.base === defaultWidthCss ? dragged.px : null;
  const expandedPx = draggedPx ?? lengthToPx(defaultWidthCss, 272);

  const handleResize = (px: number) => {
    setDragged({ base: defaultWidthCss, px });
    onWidthChange?.(px);
  };

  const widthStyle: React.CSSProperties = collapsed
    ? { width: layout.widthMinimized }
    : { width: resizable && draggedPx != null ? `${draggedPx}px` : defaultWidthCss, maxWidth: layout.maxWidth };

  return (
    <SidebarContext.Provider value={contextValue}>
      <Box
        as="nav"
        {...mergeProps(
          {
            "data-component": "Sidebar",
            "data-edge": edge,
            "data-collapsed": collapsed ? "true" : undefined,
            "data-resizable": resizable && !collapsed ? "" : undefined,
            className: clsx(classes.Sidebar, className),
            style: {
              backgroundColor: sidebar.color.background,
              ...cssVars("sidebar", {
                borderColor: sidebar.color.border,
                borderWidth: borderWidth.thin,
                padding: layout.padding,
                footerPadding: layout.footerPadding,
                toggleSize: size.control.md.size,
              }),
              ...widthStyle,
            },
          },
          { ...props, style } as object,
        )}
      >
        {resizable && !collapsed && (
          <ResizeHandle
            edge={edge === "right" ? "left" : "right"}
            value={expandedPx}
            min={minWidthPx}
            max={maxWidthPx}
            onValueChange={handleResize}
            aria-label="Resize sidebar"
          />
        )}
        {children}
      </Box>
    </SidebarContext.Provider>
  );
}

Sidebar.Header = SidebarHeader;
Sidebar.HeaderButton = SidebarHeaderButton;
Sidebar.Body = SidebarBody;
Sidebar.Footer = SidebarFooter;
Sidebar.Section = SidebarSection;
Sidebar.Item = SidebarItem;
Sidebar.Toggle = SidebarToggle;
