import { expectTypeOf, test } from "vitest";
import type { Tokens } from "../../../mode";
import { IconButton } from "./IconButton";
import type { IconButtonA11yProps, IconButtonProps, IconButtonSize, IconButtonVariant } from "./IconButton";

// The variant and size unions are written out for readability. These fail the moment the tokens gain, lose or
// rename a variant or size and the unions are not updated to match.
test("the variant and size unions equal the keys of the iconButton tokens", () => {
  expectTypeOf<IconButtonVariant>().toEqualTypeOf<Exclude<keyof Tokens["iconButton"], IconButtonSize>>();
  expectTypeOf<IconButtonSize>().toEqualTypeOf<Exclude<keyof Tokens["iconButton"], IconButtonVariant>>();
});

test("IconButtonProps: the button's own props and ref, plus the icon", () => {
  expectTypeOf<IconButtonProps>().toHaveProperty("onClick");
  expectTypeOf<IconButtonProps>().toHaveProperty("icon");
  expectTypeOf<IconButtonProps["ref"]>().toEqualTypeOf<React.Ref<HTMLButtonElement> | undefined>();
  expectTypeOf<IconButtonProps["variant"]>().toEqualTypeOf<IconButtonVariant | undefined>();
  expectTypeOf<IconButtonProps["size"]>().toEqualTypeOf<IconButtonSize | undefined>();
});

test("an accessible name is required, exactly one way", () => {
  expectTypeOf<IconButtonA11yProps>().toMatchTypeOf<{ "aria-label"?: string; "aria-labelledby"?: string }>();

  <IconButton icon={<svg />} aria-label="Close" />;
  <IconButton icon={<svg />} aria-labelledby="heading" variant="ghost" selected size="md" />;

  // @ts-expect-error an icon-only button must have an accessible name
  <IconButton icon={<svg />} />;
  // @ts-expect-error exactly one of aria-label / aria-labelledby, not both
  <IconButton icon={<svg />} aria-label="x" aria-labelledby="y" />;
});

test("JSX", () => {
  // @ts-expect-error icon-only variants are ghost and outlined, not the labelled ones
  <IconButton icon={<svg />} aria-label="x" variant="primary" />;
  // @ts-expect-error not a size
  <IconButton icon={<svg />} aria-label="x" size="extraSmall" />;
  // @ts-expect-error the icon is the `icon` prop, not children
  <IconButton aria-label="x"><svg /></IconButton>;
  // @ts-expect-error a button has no href
  <IconButton icon={<svg />} aria-label="x" href="/x" />;
  // @ts-expect-error the old per-instance theme prop is gone
  <IconButton icon={<svg />} aria-label="x" theme={{}} />;
});
