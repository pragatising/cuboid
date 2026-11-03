import { useContext } from "react";
import { Image } from "@sragatiping/cuboid";
import { defineBlock } from "../../core";
import { ImageRemove, ImageUpload } from "./ImageContext";
import { imageRead } from "./image.read";

export const image = defineBlock(imageRead, {
  holds: "nothing",
  menu: { label: "Image", group: "media", keywords: ["picture", "photo", "img", "upload"] },
  Write: ({ attrs, update }) => {
    const onUpload = useContext(ImageUpload);
    const onRemove = useContext(ImageRemove);
    return <Image editable src={attrs.src || undefined} alt={attrs.alt} caption={attrs.caption || undefined} width={attrs.width} bordered={attrs.bordered} align={attrs.align} onUpload={onUpload} onRemove={onRemove} onChange={update} />;
  },
});
