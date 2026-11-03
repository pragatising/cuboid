import React from "react";
import { InputText } from "../../../../../ui/index";
import classes from "./PropSelectors.module.css";

/** What the text in the field is, so it is written in the colour the code gives it: `type` is a name (a slot's, a set's). */
export type PropFieldKind = "string" | "number" | "type";

/** The props that make a field the chip of the Figma, whatever draws the input: its size, colour, and hugging what it holds. */
export function fieldProps({ kind, label, placeholder, value, trailingVisual, width }: { kind: PropFieldKind; label: string; placeholder?: string; value: string; trailingVisual?: React.ReactNode; width?: number }) {
  // Where the browser cannot size an input to its content (`field-sizing`), the characters it has room for.
  const chars = Math.max(width ?? 0, value.length || (placeholder ?? "").length, 3);
  return {
    size: "sm" as const,
    "aria-label": label,
    placeholder,
    value,
    trailingVisual,
    spellCheck: false,
    "data-kind": kind,
    wrapperClassName: kind === "type" ? `${classes.Field} ${classes.FieldType}` : classes.Field,
    className: classes.FieldInput,
    style: { "--chars": chars } as React.CSSProperties,
  };
}

/**
 * A chip you type in (Figma 5038:92224): TextField at its small size, 20px, grown to its text. It rests as its type's name, takes the focus
 * border on hover and while typed in. The field is the string and number selectors, and the free part of a token (`FgColor | #hex`).
 */
export function PropField({
  kind,
  label,
  placeholder,
  value,
  trailingVisual,
  width,
  ...props
}: Omit<React.ComponentProps<typeof InputText>, "size" | "className" | "wrapperClassName" | "label" | "value" | "placeholder"> & {
  kind: PropFieldKind;
  /** What it is for, said to a screen reader. */
  label: string;
  placeholder?: string;
  value: string;
  /** The characters it has room for, at least. Without it, as many as it holds. */
  width?: number;
}) {
  return <InputText {...props} {...fieldProps({ kind, label, placeholder, value, trailingVisual, width })} />;
}
