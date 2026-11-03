import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTokens } from "../../../mode";
import { mergeProps } from "../../../utils/mergeProps";
import { ActionMenu } from "../ActionMenu";
import { Box } from "../Box";
import { Icon, type IconName } from "../Icon";
import { IconButton } from "../IconButton";
import { InputText } from "../InputText";
import { ResizeHandle } from "../ResizeHandle";
import { Text } from "../Text";
import { downloadImage, imageFileExtension, readImageFile } from "./imageFile";
import classes from "./Image.module.css";

/** What an edit changes: any of these, and only these, are in it. */
export type ImageChange = Partial<{ src: string; alt: string; caption: string; width: number; bordered: boolean; align: ImageAlign }>;

/** Which side of its column a picture narrower than the column sits on. */
export type ImageAlign = "start" | "center" | "end";

const ALIGNMENTS: { id: ImageAlign; label: string; icon: IconName }[] = [
  { id: "start", label: "Left", icon: "format_align_left" },
  { id: "center", label: "Center", icon: "format_align_center" },
  { id: "end", label: "Right", icon: "format_align_right" },
];

export type ImageProps = Omit<React.ComponentPropsWithRef<"figure">, "children" | "onChange"> & {
  /** The picture's address. Without one a reader sees nothing, and an editor sees the "Add Image" bar. */
  src?: string;
  /** What the picture shows, for anyone who cannot see it. Empty for a picture that only decorates. */
  alt?: string;
  /** The line under the picture. */
  caption?: string;
  /** How wide the picture is, as a percentage of its column, from the narrowest the `image` token allows to 100. It is centred unless `align` says otherwise. @default 100 */
  width?: number;
  /** Where a picture narrower than its column sits. A full-width picture fills the column, so this shows only once it is narrower. @default "center" */
  align?: ImageAlign;
  /** A hairline round the picture. @default true */
  bordered?: boolean;
  /**
   * Edit it: the "Add Image" bar to click or drop a file on, a handle on each side to resize, a caption field and a toolbar over the picture. The same
   * component reads and writes, so what is edited is drawn exactly as it will be read. @default false
   */
  editable?: boolean;
  /** Called with what changed, as it changes: a file added, the picture resized, the caption typed. */
  onChange?: (change: ImageChange) => void;
  /** Turn a chosen or dropped file into the address to keep (an upload). Without it the file's own data URL is the address. A rejection shows its message and offers a retry. */
  onUpload?: (file: File) => Promise<string>;
  /** Adds an "Expand" button to the toolbar; what it opens (a preview) is the caller's. */
  onExpand?: () => void;
  /**
   * Adds a "Remove" button to the editing toolbar. Called with the picture's address; what removing means is the caller's: only forget the picture, or
   * delete the file that was uploaded. The picture is cleared (`onChange({ src: "" })`) once it resolves, and kept, with the reason shown, if it rejects.
   * Without it the button clears the picture and nothing else.
   */
  onRemove?: (src: string) => void | Promise<void>;
  /** The name a download is saved under. @default "image" plus the picture's extension */
  filename?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * A picture in a document, to read or to edit. Read, it is the picture at its width with its caption, and a toolbar to expand or save it when
 * hovered. Editable, the same picture gets an "Add Image" bar (click or drop a file; an upload shows its progress and its failure), a resize handle
 * on each side (drag, or Arrow keys: it stays centred, so each edge moves half of what the width does), a caption field and a toolbar. It knows
 * nothing of where files go (`onUpload`), what expanding opens (`onExpand`) or what document it is in.
 */
export function Image({
  src,
  alt = "",
  caption,
  width = 100,
  bordered = true,
  align = "center",
  editable = false,
  onChange,
  onUpload,
  onExpand,
  onRemove,
  filename,
  className,
  ref,
  ...props
}: ImageProps) {
  const { image, shadow } = useTokens();
  const minWidth = image.sizes.minWidth;
  const percent = clamp(Number.isFinite(width) ? width : 100, minWidth, 100);

  const figureRef = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [captionOpen, setCaptionOpen] = useState(Boolean(caption));
  const [upload, setUpload] = useState<{ status: "idle" | "uploading" | "error"; message?: string }>({ status: "idle" });
  const [over, setOver] = useState(false);
  const [columnPx, setColumnPx] = useState(0);
  const [failed, setFailed] = useState<string | undefined>();

  // The column's width, which the resize handles turn pixels into a percentage by: measured on the figure, never on the picture, which is already scaled.
  useLayoutEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;
    const measure = () => setColumnPx(figure.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(figure);
    return () => observer.disconnect();
  }, [src, editable]);

  // A caption that arrives from outside opens its field.
  useEffect(() => {
    if (caption) setCaptionOpen(true);
  }, [caption]);

  const setRefs = (node: HTMLElement | null) => {
    figureRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLElement | null>).current = node;
  };

  const [removing, setRemoving] = useState<{ status: "idle" | "removing" | "error"; message?: string }>({ status: "idle" });

  const remove = async () => {
    if (!src) return;
    setRemoving({ status: "removing" });
    try {
      await onRemove?.(src);
      setRemoving({ status: "idle" });
      onChange?.({ src: "" });
    } catch (error) {
      setRemoving({ status: "error", message: error instanceof Error ? error.message : "Could not remove the image" });
    }
  };

  const take = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file?.type.startsWith("image/")) return;
    setUpload({ status: "uploading" });
    try {
      const address = onUpload ? await onUpload(file) : await readImageFile(file);
      setUpload({ status: "idle" });
      onChange?.({ src: address });
    } catch (error) {
      setUpload({ status: "error", message: error instanceof Error ? error.message : "Upload failed" });
    }
  };

  const figure = (children: React.ReactNode) => (
    <Box as="figure" margin={0} {...mergeProps({ "data-component": "Image", "data-editable": editable ? "" : undefined, className }, props as object)} ref={setRefs}>
      {children}
    </Box>
  );

  if (!src) {
    if (!editable) return null;
    const busy = upload.status === "uploading";
    return figure(
      <>
        <button
          type="button"
          className={classes.Empty}
          data-over={over ? "" : undefined}
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setOver(false);
            void take(event.dataTransfer.files);
          }}
        >
          <Icon name="image" />
          <Text as="span" size="md" color="neutral.muted">
            {busy ? "Uploading…" : "Add Image"}
          </Text>
          {upload.status === "error" ? (
            <Text as="span" size="sm" color="danger.strong" role="alert">
              {upload.message}, click to try again
            </Text>
          ) : null}
        </button>
        <input ref={input} type="file" accept="image/*" hidden tabIndex={-1} onChange={(event) => { void take(event.target.files); event.target.value = ""; }} />
      </>,
    );
  }

  const reveal = hovered || focused || dragging;
  const half = (columnPx * percent) / (100 * (align === "center" ? 2 : 1));
  const handles = editable && columnPx > 0;
  // Centred, the picture grows on both sides, so each handle moves half of what the width does. Aligned to a side, it grows from that side: only the
  // handle on the free edge is shown, and it moves all of it.
  const margin = { marginInlineStart: align === "start" ? 0 : "auto", marginInlineEnd: align === "end" ? 0 : "auto" } as const;
  const share = align === "center" ? 2 : 1;
  const aligned = ALIGNMENTS.find((option) => option.id === align) ?? ALIGNMENTS[1];
  const showCaption = editable ? captionOpen : Boolean(caption);

  const handle = (edge: "left" | "right") => (
    <Box position="absolute" top={0} bottom={0} {...(edge === "left" ? { left: "2x" } : { right: "2x" })} width="0px" opacity={reveal ? 1 : 0}>
      <ResizeHandle
        edge={edge}
        shape="grip"
        aria-label={`Resize image from the ${edge}`}
        // The picture stays centred, so a handle moves half of what the width does: it is given, and gives back, half the width.
        value={half}
        min={(columnPx * minWidth) / (100 * share)}
        max={columnPx / share}
        step={8}
        onValueChange={(next) => onChange?.({ width: Math.round(clamp(((next * share) / columnPx) * 100, minWidth, 100)) })}
        onResizeStart={() => setDragging(true)}
        onResizeEnd={() => setDragging(false)}
      />
    </Box>
  );

  return figure(
    <>
      <Box
        position="relative"
        width={`${percent}%`}
        {...margin}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event: React.FocusEvent) => !event.currentTarget.contains(event.relatedTarget as Node | null) && setFocused(false)}
      >
        {failed === src ? (
          // A picture that does not load is a bar with a reason, not the browser's broken icon: it keeps the picture's place and room for its toolbar.
          <div className={classes.Failed} role="img" aria-label={alt || "Image"} data-bordered={bordered ? "" : undefined}>
            <Icon name="broken_image" />
            <Text as="span" size="md" color="neutral.muted">
              Image could not be loaded
            </Text>
          </div>
        ) : (
          <img className={classes.Picture} data-bordered={bordered ? "" : undefined} src={src} alt={alt} draggable={false} onError={() => setFailed(src)} />
        )}
        {handles ? (
          <>
            {align !== "start" ? handle("left") : null}
            {align !== "end" ? handle("right") : null}
          </>
        ) : null}
        <Box
          position="absolute"
          right="1x"
          top="1x"
          flexDirection="row"
          gap="0.5x"
          padding="0.5x"
          backgroundColor="canvas.default"
          borderRadius="md"
          boxShadow={shadow.floating.md}
          opacity={reveal ? 1 : 0}
          data-component="Image.Toolbar"
        >
          {editable ? <IconButton aria-label="Caption" variant="ghost" size="sm" selected={captionOpen} icon={<Icon name="notes" />} onClick={() => setCaptionOpen((open) => !open)} /> : null}
          {editable ? (
            <ActionMenu
              aria-label="Alignment"
              trigger={<IconButton aria-label={`Alignment: ${aligned.label}`} variant="ghost" size="sm" icon={<Icon name={aligned.icon} />} />}
            >
              {ALIGNMENTS.map((option) => (
                <ActionMenu.Item key={option.id} selected={option.id === align} leadingVisual={<Icon name={option.icon} />} onClick={() => onChange?.({ align: option.id })}>
                  {option.label}
                </ActionMenu.Item>
              ))}
            </ActionMenu>
          ) : null}
          {editable ? <IconButton aria-label="Border" variant="ghost" size="sm" selected={bordered} icon={<Icon name="border_all" />} onClick={() => onChange?.({ bordered: !bordered })} /> : null}
          {onExpand ? <IconButton aria-label="Expand" variant="ghost" size="sm" icon={<Icon name="open_in_full" />} onClick={onExpand} /> : null}
          <IconButton aria-label="Download" variant="ghost" size="sm" icon={<Icon name="download" />} onClick={() => void downloadImage(src, filename ?? `image.${imageFileExtension(src)}`)} />
          {editable ? <IconButton aria-label="Remove" variant="ghost" size="sm" disabled={removing.status === "removing"} icon={<Icon name="delete" />} onClick={() => void remove()} /> : null}
        </Box>
      </Box>
      {removing.status === "error" ? (
        <Box width={`${percent}%`} {...margin} paddingBlockStart="1x">
          <Text size="sm" color="danger.strong" role="alert">
            {removing.message}
          </Text>
        </Box>
      ) : null}
      {showCaption ? (
        editable ? (
          <Box width={`${percent}%`} {...margin} paddingBlockStart="1x">
            <InputText size="sm" aria-label="Image caption" placeholder="Add a caption…" value={caption ?? ""} onChange={(event) => onChange?.({ caption: event.target.value })} />
          </Box>
        ) : (
          <Box as="figcaption" width={`${percent}%`} {...margin} paddingBlockStart="1x">
            <Text size="sm" color="neutral.muted">
              {caption}
            </Text>
          </Box>
        )
      ) : null}
    </>,
  );
}
