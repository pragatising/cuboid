import type React from "react";

/**
 * Props for a component whose root element is chosen by an `as` prop. The element's own
 * props (`href` for `"a"`, `onClick` for `"button"`, and `ref` — a plain prop in React 19)
 * are typed from `As`; the component's own props (`Own`) replace any element prop with the
 * same name (e.g. Text's `color`).
 *
 *   type TextProps<As extends React.ElementType = "p"> = PolymorphicProps<As, "p", { size?: "sm" | "md" | "lg" }>;
 *
 * With no `as`, `As` falls back to its default and the props are `DefaultAs`'s.
 */
export type PolymorphicProps<
  As extends React.ElementType,
  DefaultAs extends React.ElementType,
  Own extends object = object,
> = Own & { as?: As } & Omit<React.ComponentPropsWithRef<unknown extends As ? DefaultAs : As>, keyof Own | "as">;
