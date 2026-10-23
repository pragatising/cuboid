import { expectTypeOf, test } from "vitest";
import { Heading } from "./Heading";
import type { HeadingProps } from "./Heading";

test("the heading element's own props and ref are typed", () => {
  expectTypeOf<HeadingProps>().toHaveProperty("onClick");
  expectTypeOf<HeadingProps>().not.toHaveProperty("href");
  expectTypeOf<HeadingProps["ref"]>().toEqualTypeOf<React.Ref<HTMLHeadingElement> | undefined>();
  expectTypeOf<HeadingProps["size"]>().toEqualTypeOf<"h1" | "h2" | "h3" | "h4" | "h5" | "h6" | undefined>();
});

test("JSX: only heading elements are allowed for `as`, and size is independent of level", () => {
  <Heading>default</Heading>;
  <Heading as="h1" size="h3">small h1</Heading>;
  <Heading as="h6" size="h1" color="danger.strong">large h6</Heading>;

  // @ts-expect-error a div is not a heading
  <Heading as="div">no</Heading>;
  // @ts-expect-error nor is an anchor
  <Heading as="a" href="/x">no</Heading>;
  // @ts-expect-error unknown size
  <Heading size="xl">no</Heading>;
  // @ts-expect-error unknown colour token
  <Heading color="neutral.nope">no</Heading>;
});
