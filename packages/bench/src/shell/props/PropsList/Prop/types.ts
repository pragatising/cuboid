import type { useProps } from "../../PropsContext";

export type { ComponentJson as ComponentApi, Member, PropInfo } from "../../../../engine/api";

/** What the Playground shares with the pane while a component is played with: the example and what has been changed in it. */
export type Live = NonNullable<ReturnType<typeof useProps>>;

/**
 * The selectors the Figma draws (Prop.Selectors, 3392:49459): what a prop's value is chosen or typed with. `type` is the one with no
 * control, only the type written out (a ref, an object, an array).
 */
export type SelectorType = "string" | "number" | "boolean" | "enum" | "token" | "tokenSets" | "react" | "function" | "type";
