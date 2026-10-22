import type React from "react";
import type { Tokens } from "../../../mode";
import type { PolymorphicProps } from "../../../utils/polymorphic";

// The variants and sizes are the keys of the button tokens. Button.test-d.tsx fails if these drift from them.
export type VariantType = "primary" | "secondary" | "ghost" | "danger" | "rounded";
export type Size = "xs" | "sm" | "md" | "lg";
export type AlignContent = "start" | "center";

export type ButtonBaseProps = {
  /**
   * Determines the colours of the button, one of `tokens.button`'s looks
   * @default "secondary"
   */
  variant?: VariantType;
  /**
   * Size of the button: its height, padding, gap, the label font, and the icon and visual size
   * @default "sm"
   */
  size?: Size;
  /**
   * Disables a button. Avoid disabling buttons because it will make them inaccessible to users
   * who rely on keyboard navigation. Buttons that are disabled cannot be clicked, selected, or navigated through.
   */
  disabled?: boolean;
  /**
   * Allow a button to fill its container horizontally
   */
  block?: boolean;
  /**
   * Specify whether the button is in a loading state: a spinner replaces the leading visual
   * and activation is ignored. The button stays focusable.
   */
  loading?: boolean;
  /**
   * The content to announce to screen readers when loading
   * @default "Loading"
   */
  loadingMessage?: string;
  /**
   * Whether the button looks visually disabled, but can still accept focus and be announced.
   * Activation is ignored.
   */
  inactive?: boolean;
} & React.ComponentPropsWithRef<"button">;

export type ButtonProps = {
  /**
   * Content alignment for when visuals are present
   * @default "center"
   */
  alignContent?: AlignContent;
  /**
   * The leading visual which comes before the button content
   */
  leadingVisual?: React.ReactNode;
  /**
   * The trailing visual which comes after the button content
   */
  trailingVisual?: React.ReactNode;
  children?: React.ReactNode;
} & ButtonBaseProps;

/**
 * What the ButtonBase component takes: everything Button adds to a button, on any element
 * (`as`). Only its own props are listed here; the element's attributes and ref come from `as`.
 */
export type ButtonBaseComponentProps<As extends React.ElementType = "button"> = PolymorphicProps<
  As,
  "button",
  Pick<ButtonProps, "size" | "block" | "loading" | "loadingMessage" | "inactive" | "alignContent" | "leadingVisual" | "trailingVisual"> & {
    variant?: VariantType;
  }
>;
