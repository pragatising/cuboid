import React from "react";
import { clsx } from "clsx";
import { mergeProps } from "../../../utils/mergeProps";
import classes from "./SplitLayout.module.css";

export type SplitLayoutProps = React.ComponentPropsWithRef<"div">;
export type SplitLayoutMainProps = React.ComponentPropsWithRef<"main">;

function SplitLayoutMain({ className, ...props }: SplitLayoutMainProps) {
  return <main {...mergeProps({ "data-component": "SplitLayout.Main", className: clsx(classes.Main, className) }, props)} />;
}

/**
 * Horizontal app shell: sidebar (or other leading panel) plus scrollable main.
 * In-flow only; pair with `Sidebar` rather than the portaled `Sheet`.
 */
export function SplitLayout({ className, ...props }: SplitLayoutProps) {
  return <div {...mergeProps({ "data-component": "SplitLayout", className: clsx(classes.SplitLayout, className) }, props)} />;
}

SplitLayout.Main = SplitLayoutMain;
