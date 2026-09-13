import React from "react";
import { useTheme } from "../../theme/ThemeContext";
import { GraphHandle } from "../Graph/GraphHandle";

export interface JsonInputHandleProps {
  /** Handle id — must be unique within the card. Edge references: "cardId:handleId". */
  id: string;
  /** Inner dot fill colour. Defaults to the theme's blue accent. */
  color?: string;
}

/**
 * An input handle pre-positioned for use inside `<JsonCardTitle>`.
 *
 * Place it as the **first child** of `<JsonCardTitle>` and it will sit on
 * the card's left outer edge, vertically centred with the title text:
 *
 * ```tsx
 * <GraphCard id="email" x={x} y={y}>
 *   <JsonCardTitle>
 *     <JsonInputHandle id="in" />
 *     Email Details
 *   </JsonCardTitle>
 *   <JsonFieldRow label="email" value="user@example.com" />
 * </GraphCard>
 * ```
 *
 * ### Why the negative left offset?
 * `JsonCardTitle` is inside `GraphCard` which has `padding: space[3]` (12px).
 * An absolutely-positioned element at `left: 0` inside `JsonCardTitle` would
 * sit 12px in from the card's outer edge. The `calc(-1 * space[3])` offset
 * cancels the card padding so the handle protrudes from the card's true left
 * border — consistent with handles on `GraphRow` object rows.
 */
export function JsonInputHandle({ id, color }: JsonInputHandleProps) {
  const tokens = useTheme();

  return (
    <GraphHandle
      id={id}
      side="left"
      color={color}
      style={{
        // Cancel the card's horizontal padding so the handle sits on the
        // card's outer left edge, not 12px inside it.
        left: `calc(-1 * ${tokens.sizes.space[3]})`,
      }}
    />
  );
}
