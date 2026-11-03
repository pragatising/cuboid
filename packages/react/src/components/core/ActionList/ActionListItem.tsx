import React, { useEffect, useId } from "react";
import { clsx } from "clsx";
import { isDev } from "../../../utils/isDev";
import { mergeProps } from "../../../utils/mergeProps";
import { Box } from "../Box";
import { Icon } from "../Icon";
import type { IconName } from "../Icon";
import { KeybindingHint } from "../KeybindingHint";
import { Text } from "../Text";
import { useActionListContext } from "./ActionListContext";
import { useActiveOptionContext } from "./ActiveOptionContext";
import classes from "./ActionListItem.module.css";

/**
 * What goes before or after a row's label: an icon by its name (`"edit"`), or one element for what an icon cannot say (an
 * avatar, a colour swatch). Text is not a visual, and nothing interactive belongs in a row: a menu item cannot hold a button.
 */
export type ItemVisual = IconName | React.ReactElement;

export type ActionListItemProps = Omit<React.ComponentPropsWithRef<"button">, "children" | "color" | "role"> & {
  /** The item's label. */
  children: React.ReactNode;
  /** A second line under the label. */
  description?: React.ReactNode;
  /** A small visual before the description. */
  descriptionVisual?: ItemVisual;
  /** A visual before the label: an icon's name, or one element. Hidden from assistive technology. */
  leadingVisual?: ItemVisual;
  /** A visual after the label: an icon's name, or one element. Hidden from assistive technology. */
  trailingVisual?: ItemVisual;
  /**
   * The keys that do the same as this item (`"Mod+Shift+K"`, as `KeybindingHint` writes them), shown after the label. It is
   * a reminder: it does not bind the keys. Use it in place of a `trailingVisual` that draws a shortcut.
   */
  shortcut?: string;
  /**
   * Whether the item is chosen: shows a trailing check and makes it a checkbox (or a radio, in a `selectionMode="single"`
   * list) with `aria-checked`. Leave unset for a plain action.
   */
  selected?: boolean;
  /** Show the check when `selected`. @default true */
  showSelectionCheck?: boolean;
  /** Only the leading visual is shown, so it needs one; the label becomes the accessible name. */
  iconOnly?: boolean;
  /** Shows a trailing chevron: the item opens something further. */
  hasSubmenu?: boolean;
  /** Keep the menu open after this item is activated (filters, multi-step menus). */
  keepOpenOnSelect?: boolean;
};

function decorate(visual: ItemVisual, className: string) {
  if (typeof visual === "string") return <Icon name={visual} className={className} aria-hidden />;
  const element = visual as React.ReactElement<{ className?: string }>;
  return React.cloneElement(element, {
    className: clsx(className, element.props.className),
    "aria-hidden": true,
    focusable: false,
  } as Partial<{ className: string }>);
}

/**
 * One row of an action menu. Its colours and sizes are the `--cube-actionMenu-*` variables the token build publishes, read in
 * ActionListItem.module.css, so the row carries no inline style and also works outside an `ActionMenu.List`. Its role follows the
 * list's: a menu item (or radio, or checkbox) in a `menu`, an `option` in a `listbox`.
 */
function ActionListItem({
  children,
  description,
  descriptionVisual,
  leadingVisual,
  trailingVisual,
  shortcut,
  selected,
  showSelectionCheck = true,
  iconOnly = false,
  hasSubmenu = false,
  keepOpenOnSelect = false,
  className,
  disabled,
  id: idProp,
  "aria-label": ariaLabel,
  ...props
}: ActionListItemProps) {
  const { selectionMode, role: listRole } = useActionListContext();
  const search = useActiveOptionContext();
  const generatedId = useId();
  const id = idProp ?? generatedId;
  // With a search field, focus stays in the field: the row is the active option when the field points at it, and is not a tab stop.
  const active = search !== null && search.activeId === id;
  const checkable = selected !== undefined || selectionMode !== undefined;
  const isOption = listRole === "listbox";
  const role = isOption ? "option" : selectionMode === "single" ? "menuitemradio" : checkable ? "menuitemcheckbox" : "menuitem";
  const checked = selected === true;
  useEffect(() => {
    if (!isDev()) return;
    if (iconOnly && !leadingVisual) console.warn("An icon-only item shows only its leading visual: pass `leadingVisual`.");
    if (hasSubmenu && checked) console.warn("An item that opens a submenu is not also chosen: use `selected` or `hasSubmenu`, not both.");
    if (shortcut && hasSubmenu) console.warn("An item that opens a submenu has no shortcut of its own: drop `shortcut` or `hasSubmenu`.");
  }, [iconOnly, leadingVisual, hasSubmenu, checked, shortcut]);
  const name = iconOnly ? (ariaLabel ?? (typeof children === "string" ? children : undefined)) : ariaLabel;

  return (
    <Box
      as="button"
      {...mergeProps(
        {
          "data-component": "ActionMenu.Item",
          type: "button" as const,
          id,
          role,
          tabIndex: search ? -1 : undefined,
          "data-active": active ? "" : undefined,
          className: clsx(
            classes.ActionListItem,
            checked && classes["ActionListItem--selected"],
            description && classes["ActionListItem--withSubtext"],
            iconOnly && classes["ActionListItem--iconOnly"],
            className,
          ),
          disabled,
          "aria-disabled": disabled || undefined,
          // An option in a listbox is `aria-selected` (on every option, so the choice is announced); menu items are `aria-checked`.
          "aria-selected": isOption ? checked : undefined,
          "aria-checked": !isOption && checkable ? checked : undefined,
          "aria-label": name,
          "data-keep-open": keepOpenOnSelect ? "true" : undefined,
        },
        props as object,
      )}
    >
      <span className={classes.ActionListItemInner}>
        {leadingVisual ? <span className={classes.IconSlot}>{decorate(leadingVisual, classes.IconSlot)}</span> : null}

        {!iconOnly ? (
          <span className={classes.Content}>
            <Text as="span" size="md" color="currentColor" truncate className={classes.Label} data-component="ActionList.Label">
              {children}
            </Text>
            {description ? (
              <span className={classes.SubtextRow}>
                {descriptionVisual ? <span className={classes.SubtextIconSlot}>{decorate(descriptionVisual, classes.SubtextIconSlot)}</span> : null}
                <Text as="span" size="sm" color="var(--cube-actionMenu-item-fgColor-subtext)" truncate className={classes.Subtext}>
                  {description}
                </Text>
              </span>
            ) : null}
          </span>
        ) : null}

        {trailingVisual ? <span className={classes.TrailingSlot}>{decorate(trailingVisual, classes.TrailingSlot)}</span> : null}

        {shortcut ? (
          <span className={classes.TrailingSlot}>
            <KeybindingHint keys={shortcut} size="sm" />
          </span>
        ) : null}

        {hasSubmenu ? (
          <span className={classes.TrailingSlot}>
            <Icon name="chevron_right" />
          </span>
        ) : null}

        {checked && showSelectionCheck ? (
          <span className={classes.TrailingSlot}>
            <Icon name="check" />
          </span>
        ) : null}
      </span>
    </Box>
  );
}

export { ActionListItem };
