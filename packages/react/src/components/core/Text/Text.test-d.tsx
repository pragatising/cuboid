import { expectTypeOf, test } from "vitest";
import { Text } from "./Text";
import type { TextProps } from "./Text";

test("with no `as`, Text takes a paragraph's props", () => {
  expectTypeOf<TextProps>().toHaveProperty("onClick");
  expectTypeOf<TextProps>().toHaveProperty("title");
  expectTypeOf<TextProps>().not.toHaveProperty("href");
  expectTypeOf<TextProps["ref"]>().toEqualTypeOf<React.Ref<HTMLParagraphElement> | undefined>();
});

test('as="a" adds anchor props and an anchor ref', () => {
  expectTypeOf<TextProps<"a">>().toHaveProperty("href");
  expectTypeOf<TextProps<"a">["ref"]>().toEqualTypeOf<React.Ref<HTMLAnchorElement> | undefined>();
  expectTypeOf<TextProps<"button">>().toHaveProperty("disabled");
  expectTypeOf<TextProps<"button">>().toHaveProperty("onClick");
});

test("Text's own props always win over the element's (colour is a token path, not the HTML attribute)", () => {
  expectTypeOf<TextProps<"a">["size"]>().toEqualTypeOf<"sm" | "md" | "lg" | undefined>();
  expectTypeOf<TextProps<"span">["color"]>().toEqualTypeOf<TextProps["color"]>();
});

test("JSX: the element chosen by `as` decides which props are allowed", () => {
  <Text>plain</Text>;
  <Text as="a" href="/x">link</Text>;
  <Text as="button" onClick={() => {}}>button</Text>;
  <Text as="span" color="success.strong" weight="semibold">inline</Text>;

  // @ts-expect-error href belongs to anchors, not the default paragraph
  <Text href="/x">no</Text>;
  // @ts-expect-error a span has no href
  <Text as="span" href="/x">no</Text>;
  // @ts-expect-error unknown colour token
  <Text color="neutral.nope">no</Text>;
  // @ts-expect-error unknown size
  <Text size="xl">no</Text>;
});
