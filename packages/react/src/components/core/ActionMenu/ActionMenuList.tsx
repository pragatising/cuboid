import React from "react";
import { clsx } from "clsx";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { actionMenuVars } from "./actionMenuVars";
import classes from "./ActionMenuList.module.css";

export type ActionMenuListProps = Omit<React.ComponentPropsWithRef<"div">, "role"> & {
  children: React.ReactNode;
};

export type ActionMenuListRegionProps = React.ComponentPropsWithRef<"div">;

export type ActionMenuListSectionProps = Omit<React.ComponentPropsWithRef<"div">, "role" | "children"> & {
  label: React.ReactNode;
  children?: React.ReactNode;
};

function ActionMenuListHeader({ children, className, ...props }: ActionMenuListRegionProps) {
  const tokens = useTokens();
  return (
    <div
      {...mergeProps(
        { "data-component": "ActionMenuList.Header", className: clsx(classes.Header, className), style: actionMenuVars(tokens) },
        props,
      )}
    >
      {children}
      <div className={classes.HeaderDivider} role="separator" />
    </div>
  );
}

function ActionMenuListFooter({ className, ...props }: ActionMenuListRegionProps) {
  const tokens = useTokens();
  return (
    <div
      {...mergeProps(
        { "data-component": "ActionMenuList.Footer", className: clsx(classes.Footer, className), style: actionMenuVars(tokens) },
        props,
      )}
    />
  );
}

function ActionMenuListSection({ label, children, className, ...props }: ActionMenuListSectionProps) {
  return (
    <div
      {...mergeProps(
        {
          "data-component": "ActionMenuList.Section",
          className: clsx(classes.Section, className),
          role: "group",
          "aria-label": typeof label === "string" ? label : undefined,
        },
        props,
      )}
    >
      <div className={classes.SectionLabel}>{label}</div>
      <div className={classes.SectionItems}>{children}</div>
    </div>
  );
}

function isHeaderChild(child: React.ReactNode): boolean {
  return React.isValidElement(child) && child.type === ActionMenuListHeader;
}

function isFooterChild(child: React.ReactNode): boolean {
  return React.isValidElement(child) && child.type === ActionMenuListFooter;
}

/** Menu list container. Header and footer children are lifted out around the scrolling item area. */
function ActionMenuListRoot({ children, className, ...props }: ActionMenuListProps) {
  const tokens = useTokens();
  const childArray = React.Children.toArray(children);
  const header = childArray.find((child) => isHeaderChild(child));
  const footer = childArray.find((child) => isFooterChild(child));
  const body = childArray.filter((child) => !isHeaderChild(child) && !isFooterChild(child));

  return (
    <div
      {...mergeProps(
        {
          "data-component": "ActionMenuList",
          role: "menu",
          className: clsx(classes.ActionMenuList, className),
          style: actionMenuVars(tokens),
        },
        props,
      )}
    >
      {header}
      <div className={classes.ListItems}>{body}</div>
      {footer}
    </div>
  );
}

export const ActionMenuList = Object.assign(ActionMenuListRoot, {
  Header: ActionMenuListHeader,
  Footer: ActionMenuListFooter,
  Section: ActionMenuListSection,
});
