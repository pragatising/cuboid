import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import type { Tokens } from "../../../mode";
import { cssVars } from "../../../utils/cssVars";
import { lengthToPx } from "../../../utils/length";
import { mergeProps } from "../../../utils/mergeProps";
import { resolveSpace } from "../../../utils/space";
import type { Space } from "../../../utils/space";
import { IconButton } from "../IconButton";
import { Icon } from "../Icon";
import { ResizeHandle } from "../ResizeHandle";
import classes from "./Sidebar.module.css";

export type SidebarEdge = "left" | "right";
/** A key of `tokens.sidebar.sizes.width`. */
export type SidebarWidthStop = keyof Tokens["sidebar"]["sizes"]["width"];
/** Named stop (`sm` / `md` / `lg`) or any CSS length (e.g. `17rem`). */
export type SidebarWidth = SidebarWidthStop | (string & {});

export type SidebarProps = React.ComponentPropsWithRef<"nav"> & {
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

export type SidebarRegionProps = React.ComponentPropsWithRef<"div"> & {
  /**
   * Override the region's block-axis (top+bottom) inset with a spacing token.
   * Defaults to the `sidebar.sizes.padding` / `footerPadding` token (uniform on all sides).
   */
  paddingBlock?: Space;
  /** Override the region's inline-axis (start+end) inset with a spacing token. */
  paddingInline?: Space;
};

export type SidebarToggleFloatingAlign = "corner" | "center";

export type SidebarToggleProps = Omit<React.ComponentPropsWithRef<"div">, "children"> & {
  /** Pin the toggle to the top inner corner of the sidebar shell. */
  floating?: boolean;
  /**
   * Where the floating toggle sits when the rail is collapsed.
   * @default "center"
   */
  floatingAlign?: SidebarToggleFloatingAlign;
  /** Replace the default chevron icon(s). */
  children?: React.ReactNode;
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

/** Read collapse state and toggle from anywhere inside {@link Sidebar}. */
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

function regionPaddingOverrides(
  tokens: Tokens,
  paddingBlock: Space | undefined,
  paddingInline: Space | undefined,
): React.CSSProperties | undefined {
  if (paddingBlock === undefined && paddingInline === undefined) return undefined;
  const style: React.CSSProperties = {};
  if (paddingBlock !== undefined) style.paddingBlock = resolveSpace(tokens, paddingBlock);
  if (paddingInline !== undefined) style.paddingInline = resolveSpace(tokens, paddingInline);
  return style;
}

function resizeHandleEdge(edge: SidebarEdge): "start" | "end" {
  return edge === "right" ? "start" : "end";
}

function applyWidthDelta(panelEdge: SidebarEdge, currentPx: number, deltaPx: number): number {
  if (panelEdge === "right") return currentPx - deltaPx;
  return currentPx + deltaPx;
}

function SidebarHeader({ paddingBlock, paddingInline, className, ...props }: SidebarRegionProps) {
  const tokens = useTokens();
  return (
    <div
      {...mergeProps(
        {
          "data-component": "Sidebar.Header",
          className: clsx(classes.Header, className),
          style: regionPaddingOverrides(tokens, paddingBlock, paddingInline),
        },
        props,
      )}
    />
  );
}

function SidebarBody({ paddingBlock, paddingInline, className, ...props }: SidebarRegionProps) {
  const tokens = useTokens();
  return (
    <div
      {...mergeProps(
        {
          "data-component": "Sidebar.Body",
          className: clsx(classes.Body, className),
          style: regionPaddingOverrides(tokens, paddingBlock, paddingInline),
        },
        props,
      )}
    />
  );
}

function SidebarFooter({ paddingBlock, paddingInline, className, ...props }: SidebarRegionProps) {
  const tokens = useTokens();
  return (
    <div
      {...mergeProps(
        {
          "data-component": "Sidebar.Footer",
          className: clsx(classes.Footer, className),
          style: regionPaddingOverrides(tokens, paddingBlock, paddingInline),
        },
        props,
      )}
    />
  );
}

function CollapseIcon({ edge, collapsed }: { edge: SidebarEdge; collapsed: boolean }) {
  const useLeftChevron = edge === "left" ? !collapsed : collapsed;
  return <Icon name={useLeftChevron ? "chevron_left" : "chevron_right"} />;
}

function SidebarToggle({
  floating = false,
  floatingAlign = "center",
  children,
  "aria-label": ariaLabel,
  className,
  ...props
}: SidebarToggleProps) {
  const { collapsed, edge, toggleCollapsed } = useSidebarContext("Sidebar.Toggle");
  const defaultLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div
      {...mergeProps(
        {
          "data-component": "Sidebar.Toggle",
          "data-floating": floating ? floatingAlign : undefined,
          className: clsx(classes.Toggle, className),
        },
        props,
      )}
    >
      <IconButton
        aria-label={ariaLabel ?? defaultLabel}
        aria-expanded={!collapsed}
        variant="ghost"
        size="sm"
        onClick={toggleCollapsed}
        icon={children ?? <CollapseIcon edge={edge} collapsed={collapsed} />}
      />
    </div>
  );
}

/**
 * In-flow navigation shell — not portaled like {@link Sheet}.
 *
 * Use {@link Sidebar.Header}, {@link Sidebar.Body}, and {@link Sidebar.Footer} for regions.
 * {@link Sidebar.Toggle} calls into the sidebar collapse state (controlled or uncontrolled).
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

  const setCollapsed = useCallback(
    (next: boolean) => {
      if (collapsedProp === undefined) {
        setInternalCollapsed(next);
      }
      onCollapsedChange?.(next);
    },
    [collapsedProp, onCollapsedChange]
  );

  const defaultWidthCss = useMemo(
    () => resolveSidebarWidthCss(width, layout.width),
    [width, layout.width]
  );

  const minWidthPx = useMemo(() => lengthToPx(layout.minWidth, 200), [layout.minWidth]);
  const maxWidthPx = useMemo(
    () => lengthToPx(layout.maxWidth, 480),
    [layout.maxWidth]
  );

  const [widthPx, setWidthPx] = useState(() => lengthToPx(defaultWidthCss, 272));
  const lastExpandedWidthRef = useRef(widthPx);

  useEffect(() => {
    const next = lengthToPx(defaultWidthCss, 272);
    setWidthPx(next);
    lastExpandedWidthRef.current = next;
  }, [defaultWidthCss]);

  useEffect(() => {
    if (!collapsed) {
      setWidthPx(lastExpandedWidthRef.current);
    }
  }, [collapsed]);

  const clampWidth = useCallback(
    (next: number) => Math.min(maxWidthPx, Math.max(minWidthPx, next)),
    [maxWidthPx, minWidthPx]
  );

  const handleResizeDelta = useCallback(
    (deltaPx: number) => {
      if (collapsed) return;
      setWidthPx((current) => {
        const next = clampWidth(applyWidthDelta(edge, current, deltaPx));
        lastExpandedWidthRef.current = next;
        onWidthChange?.(next);
        return next;
      });
    },
    [clampWidth, collapsed, edge, onWidthChange]
  );

  const toggleCollapsed = useCallback(() => {
    if (!collapsed) {
      lastExpandedWidthRef.current = widthPx;
    }
    setCollapsed(!collapsed);
  }, [collapsed, setCollapsed, widthPx]);

  const contextValue = useMemo<SidebarContextValue>(
    () => ({ collapsed, edge, toggleCollapsed }),
    [collapsed, edge, toggleCollapsed]
  );

  const widthStyle: React.CSSProperties = collapsed
    ? { width: layout.widthMinimized }
    : resizable
      ? { width: `${widthPx}px`, maxWidth: layout.maxWidth }
      : { width: resolveSidebarWidthCss(width, layout.width), maxWidth: layout.maxWidth };

  return (
    <SidebarContext.Provider value={contextValue}>
      <nav
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
                toggleSize: size.control.sm.size,
              }),
              ...widthStyle,
            },
          },
          { ...props, style },
        )}
      >
        {resizable && !collapsed && (
          <ResizeHandle
            orientation="vertical"
            edge={resizeHandleEdge(edge)}
            onResizeDelta={handleResizeDelta}
            aria-label="Resize sidebar"
          />
        )}
        {children}
      </nav>
    </SidebarContext.Provider>
  );
}

Sidebar.Header = SidebarHeader;
Sidebar.Body = SidebarBody;
Sidebar.Footer = SidebarFooter;
Sidebar.Toggle = SidebarToggle;
