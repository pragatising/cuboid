import React, {
  CSSProperties,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTheme } from "../../../theme/ThemeContext";
import type { CubeTheme, SheetWidthStopTokens, ThemeTokens } from "../../../theme/types";
import { parseLengthPx } from "../../../utils/parseLengthPx";
import { IconButton } from "../IconButton";
import { ChevronLeftIcon, ChevronRightIcon } from "../../../icons/material";
import { ResizeHandle } from "../ResizeHandle";
import { sidebarCssVars } from "./sidebarCssVars";
import styles from "./Sidebar.module.css";

export type SidebarEdge = "left" | "right";
export type SidebarWidthStop = keyof SheetWidthStopTokens;
/** Named stop (`sm` / `md` / `lg`) or any CSS length (e.g. `17rem`). */
export type SidebarWidth = SidebarWidthStop | (string & {});

export interface SidebarProps {
  /** When true, the sidebar collapses to the minimized rail width. */
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Which document edge the sidebar sits on. @default "left" */
  edge?: SidebarEdge;
  /** Expanded width — token stop or CSS length. @default "md" */
  width?: SidebarWidth;
  /** Drag the inner edge to resize (disabled while collapsed). */
  resizable?: boolean;
  /** Fired while resizing with the current width in px. */
  onWidthChange?: (widthPx: number) => void;
  /** Accessible name when the sidebar has no visible title. */
  "aria-label"?: string;
  /** ID of the visible title element, when present. */
  "aria-labelledby"?: string;
  theme?: CubeTheme;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export interface SidebarRegionProps {
  theme?: CubeTheme;
  className?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
}

export type SidebarToggleFloatingAlign = "corner" | "center";

export interface SidebarToggleProps {
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
  theme?: CubeTheme;
  className?: string;
  style?: CSSProperties;
}

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

function resolveSidebarWidthCss(width: SidebarWidth, stops: SheetWidthStopTokens): string {
  if (isWidthStop(width)) return stops[width];
  return width;
}

function regionInlineVars(theme: CubeTheme | undefined, tokens: ThemeTokens) {
  return theme ? (sidebarCssVars(tokens) as React.CSSProperties) : undefined;
}

function resizeHandleEdge(edge: SidebarEdge): "start" | "end" {
  return edge === "right" ? "start" : "end";
}

function applyWidthDelta(panelEdge: SidebarEdge, currentPx: number, deltaPx: number): number {
  if (panelEdge === "right") return currentPx - deltaPx;
  return currentPx + deltaPx;
}

function SidebarHeader({ theme, className, style, children }: SidebarRegionProps) {
  const tokens = useTheme(theme);
  return (
    <div
      className={[styles.Sidebar__header, className].filter(Boolean).join(" ")}
      style={{ ...regionInlineVars(theme, tokens), ...style }}
    >
      {children}
    </div>
  );
}

function SidebarBody({ theme, className, style, children }: SidebarRegionProps) {
  const tokens = useTheme(theme);
  return (
    <div
      className={[styles.Sidebar__body, className].filter(Boolean).join(" ")}
      style={{ ...regionInlineVars(theme, tokens), ...style }}
    >
      {children}
    </div>
  );
}

function SidebarFooter({ theme, className, style, children }: SidebarRegionProps) {
  const tokens = useTheme(theme);
  return (
    <div
      className={[styles.Sidebar__footer, className].filter(Boolean).join(" ")}
      style={{ ...regionInlineVars(theme, tokens), ...style }}
    >
      {children}
    </div>
  );
}

function CollapseIcon({ edge, collapsed }: { edge: SidebarEdge; collapsed: boolean }) {
  const useLeftChevron = edge === "left" ? !collapsed : collapsed;
  const Glyph = useLeftChevron ? ChevronLeftIcon : ChevronRightIcon;
  return <Glyph />;
}

function SidebarToggle({
  floating = false,
  floatingAlign = "center",
  children,
  "aria-label": ariaLabel,
  theme,
  className,
  style,
}: SidebarToggleProps) {
  const { collapsed, edge, toggleCollapsed } = useSidebarContext("Sidebar.Toggle");
  const defaultLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";

  return (
    <div
      className={[
        styles.Sidebar__toggle,
        floating ? styles["Sidebar__toggle--floating"] : null,
        floating && floatingAlign === "corner"
          ? styles["Sidebar__toggle--floating-align-corner"]
          : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <IconButton
        aria-label={ariaLabel ?? defaultLabel}
        aria-expanded={!collapsed}
        variant="ghost"
        size="sm"
        theme={theme}
        onClick={toggleCollapsed}
      >
        {children ?? <CollapseIcon edge={edge} collapsed={collapsed} />}
      </IconButton>
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
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  theme,
  className,
  style,
  children,
}: SidebarProps) {
  const tokens = useTheme(theme);
  const layout = tokens.sizes.sidebar;

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

  const minWidthPx = useMemo(() => parseLengthPx(layout.minWidth, 200), [layout.minWidth]);
  const maxWidthPx = useMemo(
    () => parseLengthPx(layout.maxWidth, 480),
    [layout.maxWidth]
  );

  const [widthPx, setWidthPx] = useState(() => parseLengthPx(defaultWidthCss, 272));
  const lastExpandedWidthRef = useRef(widthPx);

  useEffect(() => {
    const next = parseLengthPx(defaultWidthCss, 272);
    setWidthPx(next);
    lastExpandedWidthRef.current = next;
  }, [defaultWidthCss]);

  useEffect(() => {
    if (!collapsed) {
      setWidthPx(lastExpandedWidthRef.current);
    }
  }, [collapsed]);

  const inlineVars = theme ? (sidebarCssVars(tokens) as React.CSSProperties) : undefined;

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

  const widthStyle: CSSProperties = collapsed
    ? { width: layout.widthMinimized }
    : resizable
      ? { width: `${widthPx}px`, maxWidth: layout.maxWidth }
      : { width: resolveSidebarWidthCss(width, layout.width), maxWidth: layout.maxWidth };

  const classNames = [
    styles.Sidebar,
    styles[`Sidebar--${edge}`],
    resizable && !collapsed ? styles["Sidebar--resizable"] : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SidebarContext.Provider value={contextValue}>
      <nav
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        data-collapsed={collapsed ? "true" : undefined}
        className={classNames}
        style={{ ...inlineVars, ...widthStyle, ...style }}
      >
        {resizable && !collapsed && (
          <ResizeHandle
            orientation="vertical"
            edge={resizeHandleEdge(edge)}
            onResizeDelta={handleResizeDelta}
            aria-label="Resize sidebar"
            theme={theme}
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
