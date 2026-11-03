import React, { useRef } from "react";
import { clsx } from "clsx";
import { Box } from "../../Box";
import { Button } from "../../Button";
import { Link } from "../../Link";
import { Text } from "../../Text";
import type { LinkStatus } from "../linkData";
import { parseLinkUrl, linkBase } from "../linkUrl";
import { useSmartCardContext } from "../SmartCardContext";
import {
  EMBED_AUTO_INITIAL_HEIGHT_PX,
  EMBED_MIN_HEIGHT_PX,
  embedFrameSize,
  resolveEmbedHeight,
  type EmbedHeight,
} from "./frameSize";
import { useMeasuredHeight } from "./useMeasuredHeight";
import classes from "./SmartCardEmbed.module.css";

/**
 * Scripts and same-origin storage are allowed because embedded tools (design files, sandboxes) need their own storage, and
 * measuring a same-origin frame needs its `contentDocument`. Same-origin content is the host's own build, so it being able to
 * lift its own sandbox is accepted. Pass `sandbox` to tighten or loosen it.
 */
export const EMBED_SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";

export type SmartCardEmbedProps = Omit<React.ComponentPropsWithRef<"div">, "children" | "color" | "content"> & {
  /** How tall the frame is: a pixel preset, a ratio, or `auto` to fit the content (same-origin only). Unset: `auto` where it can be measured, else `md`. */
  height?: EmbedHeight;
  /** The iframe's `sandbox` attribute. @default EMBED_SANDBOX */
  sandbox?: string;
  /** The iframe's title, for assistive tech. @default the link's title */
  title?: string;
};

/** What each status that has nothing to frame says. */
const MESSAGES: Partial<Record<LinkStatus, string>> = {
  unauthorized: "You need to sign in to see this.",
  forbidden: "You don't have access to this.",
  not_found: "This link can't be found.",
  errored: "This link couldn't be loaded.",
};

/**
 * The link's content in a sandboxed, lazy iframe, with a border. When there is nothing to frame (still resolving, not
 * embeddable, or the link failed) it says so and offers the link itself.
 */
export function SmartCardEmbed({ height, sandbox = EMBED_SANDBOX, title, className, ref, ...props }: SmartCardEmbedProps) {
  const { url, status, data, reload } = useSmartCardContext("SmartCard.Embed");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embed = data?.embedUrl ? parseLinkUrl(data.embedUrl, linkBase()) : null;
  const sameOrigin = embed !== null && typeof window !== "undefined" && embed.origin === window.location.origin;
  const preset = resolveEmbedHeight(height, sameOrigin);
  const measured = useMeasuredHeight(iframeRef, preset === "auto", embed?.href);

  const frameProps = {
    "data-component": "SmartCard.Embed",
    "data-status": status,
    className: clsx(className),
    ref,
    ...props,
  };

  if (!embed) {
    const loading = status === "pending" || status === "resolving";
    return (
      <Box {...frameProps} border="subtle" borderRadius="md" padding="2x" gap="1x" alignItems="start" role={loading ? "status" : undefined}>
        <Text size="sm" color="neutral.muted">
          {loading ? "Loading…" : (MESSAGES[status] ?? "This link can't be shown here.")}
        </Text>
        <Link href={url} external size="sm">
          {data?.title ?? url}
        </Link>
        {status !== "pending" && status !== "resolving" && status !== "fallback" && (
          <Button size="sm" onClick={reload}>
            Try again
          </Button>
        )}
      </Box>
    );
  }

  const size = preset === "auto" ? { heightPx: measured ?? EMBED_AUTO_INITIAL_HEIGHT_PX } : embedFrameSize(preset);

  return (
    <Box {...frameProps} border="subtle" borderRadius="md" overflow="hidden">
      <iframe
        ref={iframeRef}
        className={classes.Frame}
        src={embed.href}
        title={title ?? data?.title ?? "Embedded content"}
        loading="lazy"
        sandbox={sandbox}
        allow="fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ minHeight: EMBED_MIN_HEIGHT_PX, ...("heightPx" in size ? { height: size.heightPx } : { aspectRatio: size.aspectRatio }) }}
      />
    </Box>
  );
}
