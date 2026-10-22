import { expectTypeOf, test } from "vitest";
import { Button } from "./Button";
import type { Tokens } from "../../../mode";
import type { AlignContent, ButtonProps, Size, VariantType } from "./types";

// The variant and size unions are written out in types.ts for readability. These fail the moment the
// tokens gain, lose or rename a variant or size and the unions are not updated to match.
test("the variant and size unions equal the keys of the tokens", () => {
  expectTypeOf<VariantType>().toEqualTypeOf<Exclude<keyof Tokens["button"], "font" | "paddingInline">>();
  expectTypeOf<Size>().toEqualTypeOf<keyof Tokens["size"]["control"]>();
  expectTypeOf<Size>().toEqualTypeOf<keyof Tokens["button"]["font"]>();
  expectTypeOf<Size>().toEqualTypeOf<keyof Tokens["button"]["paddingInline"]>();
});

test("alignContent is start or center", () => {
  expectTypeOf<AlignContent>().toEqualTypeOf<"start" | "center">();
});

test("ButtonProps: the button's own props and ref, plus the anatomy", () => {
  expectTypeOf<ButtonProps>().toHaveProperty("onClick");
  expectTypeOf<ButtonProps>().toHaveProperty("disabled");
  expectTypeOf<ButtonProps>().toHaveProperty("leadingVisual");
  expectTypeOf<ButtonProps["ref"]>().toEqualTypeOf<React.Ref<HTMLButtonElement> | undefined>();
  expectTypeOf<ButtonProps["variant"]>().toEqualTypeOf<VariantType | undefined>();
});

test("JSX", () => {
  <Button>Save</Button>;
  <Button variant="primary" size="lg" block loading loadingMessage="Saving" leadingVisual={<svg />} onClick={() => {}}>Save</Button>;

  // @ts-expect-error not a variant
  <Button variant="outline">no</Button>;
  // @ts-expect-error not a size (the old API's "extraSmall" spelling is xs)
  <Button size="extraSmall">no</Button>;
  // @ts-expect-error the old per-instance theme prop is gone
  <Button theme={{}}>no</Button>;
  // @ts-expect-error a button has no href
  <Button href="/x">no</Button>;
});
