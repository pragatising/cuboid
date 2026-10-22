import { expectTypeOf, test } from "vitest";
import { ButtonBase } from "./ButtonBase";
import type { ButtonBaseComponentProps } from "./types";

test("the element's own props and ref follow `as`", () => {
  expectTypeOf<ButtonBaseComponentProps>().toHaveProperty("disabled");
  expectTypeOf<ButtonBaseComponentProps["ref"]>().toEqualTypeOf<React.Ref<HTMLButtonElement> | undefined>();
  expectTypeOf<ButtonBaseComponentProps<"a">>().toHaveProperty("href");
  expectTypeOf<ButtonBaseComponentProps<"a">["ref"]>().toEqualTypeOf<React.Ref<HTMLAnchorElement> | undefined>();

  <ButtonBase as="a" href="/x">link</ButtonBase>;
  // @ts-expect-error a button has no href
  <ButtonBase href="/x">no</ButtonBase>;
});

test("takes everything Button takes", () => {
  <ButtonBase>label</ButtonBase>;
  <ButtonBase variant="primary" size="lg" block alignContent="start" leadingVisual={<svg />} trailingVisual={<svg />}>label</ButtonBase>;
  <ButtonBase loading loadingMessage="Saving" inactive>label</ButtonBase>;

  // @ts-expect-error not a variant
  <ButtonBase variant="outline">no</ButtonBase>;
  // @ts-expect-error not a size
  <ButtonBase size="extraSmall">no</ButtonBase>;
});
