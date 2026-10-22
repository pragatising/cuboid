import React from "react";
import { clsx } from "clsx";
import { usePlatform } from "../../../behaviors";
import type { Platform } from "../../../behaviors";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { resolved } from "../../../utils/resolved";
import type { CssColor } from "../../../utils/colorPaths";
import type { Length, SpaceValue } from "../../../utils/space";
import { Box } from "../Box";
import { VisuallyHidden } from "../VisuallyHidden";
import { accessibleKeyName, condensedKeyName, fullKeyName } from "./keyNames";
import { accessibleKeybindingString, splitChord, splitSequence } from "./parse";

export type KeybindingHintProps = Omit<React.ComponentPropsWithRef<"kbd">, "children" | "color"> & {
  /**
   * The keys, named as `KeyboardEvent.key` names them (`"Control"`, `"Shift"`, `"ArrowUp"`, `"a"`). Join the keys of a chord
   * with `+` (`"Shift+K"`); use `Plus` for the plus key. Separate chords to press in turn with a space (`"g i"` is "g, then
   * i"); use `Space` for the space key. `Mod` is Command on Apple platforms and Control elsewhere.
   */
  keys: string;
  /**
   * `condensed` (symbols on Apple platforms, short words elsewhere) suits menus and tooltips; `full` spells keys out and suits prose.
   * @default "condensed"
   */
  format?: "condensed" | "full";
  /** `inverted` is for a dark surface in light mode (and the reverse in dark mode), such as a tooltip. @default "normal" */
  variant?: "normal" | "inverted";
  /** @default "md" */
  size?: "sm" | "md";
};

/** The key itself: its visible name, and the one a screen reader says (the glyph is hidden from it). */
function Key({ name, format, platform }: { name: string; format: "condensed" | "full"; platform: Platform }) {
  return (
    <>
      <VisuallyHidden>{accessibleKeyName(name, platform)}</VisuallyHidden>
      <span aria-hidden>{format === "condensed" ? condensedKeyName(name, platform) : fullKeyName(name, platform)}</span>
    </>
  );
}

/**
 * A keyboard shortcut, as `<kbd>`: each chord a bordered cap, a sequence a row of them. Visible and accessible together:
 * sighted users see "⌘ ⇧ K", a screen reader hears "command shift k". The names follow the platform (⌘ on a Mac, Ctrl
 * elsewhere); `keys` is written once.
 */
export function KeybindingHint({ keys, format = "condensed", variant = "normal", size = "md", className, ...props }: KeybindingHintProps) {
  const { keybindingHint, text, fontWeight } = useTokens();
  const platform = usePlatform();
  const colors = keybindingHint.color[variant];
  const sizes = keybindingHint.sizes[size];

  return (
    <Box
      as="kbd"
      {...mergeProps({ "data-component": "KeybindingHint", "data-variant": variant, "data-size": size, className: clsx(className) }, props as object)}
      display="inline-flex"
      flexDirection="row"
      alignItems="baseline"
      gap={resolved<SpaceValue>(keybindingHint.sizes.gap)}
      padding={0}
      border="none"
      background="none"
      font="inherit"
      whiteSpace="nowrap"
      verticalAlign="baseline"
    >
      {splitSequence(keys).map((chord, index) => (
        <React.Fragment key={index}>
          {/* The spaces are invisible in a flex row and keep the spoken words apart. */}
          {index > 0 && (
            <>
              {" "}
              <VisuallyHidden>then</VisuallyHidden>{" "}
            </>
          )}
          <Box
            as="span"
            data-component="KeybindingHint.Chord"
            display="inline-flex"
            flexDirection="row"
            justifyContent="center"
            alignItems="baseline"
            gap="0.5ch"
            overflow="hidden"
            font={text.size.sm}
            fontWeight={fontWeight.normal}
            lineHeight={1}
            color={resolved<CssColor>(colors.fgColor)}
            backgroundColor={resolved<CssColor>(colors.bgColor)}
            border={{ color: resolved<CssColor>(colors.borderColor), width: "thin" }}
            borderRadius={resolved(sizes.borderRadius)}
            padding={resolved<SpaceValue>(sizes.padding)}
            minWidth={resolved<Length>(sizes.minWidth)}
          >
            {splitChord(chord).map((key, i) => (
              <React.Fragment key={i}>
                {i > 0 && format === "full" ? <span aria-hidden> + </span> : " "}
                <Key name={key} format={format} platform={platform} />
              </React.Fragment>
            ))}
          </Box>
        </React.Fragment>
      ))}
    </Box>
  );
}

/**
 * A plain string for a shortcut ("command shift k"), for building an `aria-label` or `aria-keyshortcuts`-adjacent description.
 * Prefer `<KeybindingHint>`, which is both visible and accessible; this exists for the places that can only take a string.
 */
export function getAccessibleKeybindingHintString(keys: string, platform: Platform): string {
  return accessibleKeybindingString(keys, platform);
}
