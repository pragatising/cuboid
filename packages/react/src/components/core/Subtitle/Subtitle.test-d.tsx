import { expectTypeOf, test } from "vitest";
import { Subtitle } from "./Subtitle";
import type { SubtitleProps } from "./Subtitle";

test("with no `as`, Subtitle takes a paragraph's props and ref", () => {
  expectTypeOf<SubtitleProps>().toHaveProperty("onClick");
  expectTypeOf<SubtitleProps>().not.toHaveProperty("href");
  expectTypeOf<SubtitleProps["ref"]>().toEqualTypeOf<React.Ref<HTMLParagraphElement> | undefined>();
});

test("JSX: `as` decides the element's props; there is no size prop", () => {
  <Subtitle>default</Subtitle>;
  <Subtitle as="h2" color="neutral.contrast">heading-level subtitle</Subtitle>;
  <Subtitle as="a" href="/x">link</Subtitle>;

  // @ts-expect-error subtitles have exactly one size
  <Subtitle size="lg">no</Subtitle>;
  // @ts-expect-error href belongs to anchors
  <Subtitle href="/x">no</Subtitle>;
  // @ts-expect-error unknown colour token
  <Subtitle color="neutral.nope">no</Subtitle>;
});
