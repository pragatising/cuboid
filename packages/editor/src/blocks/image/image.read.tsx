import { Image, type ImageAlign } from "@sragatiping/cuboid";
import { defineReadBlock } from "../../core";

/** A picture: where it is, what it shows, its caption, how wide it is (a percentage of the column) and whether it has a border and, when narrower than the column, which side it sits on. */
export type ImageAttrs = { src: string; alt: string; caption: string; width: number; bordered: boolean; align: ImageAlign };

/** A reader sees Cuboid's `Image`, not editable. The address is shown as it is stored: an app that keeps references (`asset:…`) turns them into addresses before it renders. */
export const imageRead = defineReadBlock<ImageAttrs>({
  name: "image",
  attrs: { src: { default: "" }, alt: { default: "" }, caption: { default: "" }, width: { default: 100 }, bordered: { default: true }, align: { default: "center" } },
  Read: ({ attrs }) => <Image src={attrs.src || undefined} alt={attrs.alt} caption={attrs.caption || undefined} width={attrs.width} bordered={attrs.bordered} align={attrs.align} />,
});
