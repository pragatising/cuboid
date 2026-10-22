import React, { useMemo } from "react";
import { JsonViewer as JsonCodeView, type JsonViewerProps as JsonCodeViewProps } from "../CodeBlock";
import { Box } from "../core/Box";
import { Divider } from "../core/Divider";
import { Icon } from "../core/Icon";
import { IconButton } from "../core/IconButton";
import { Pill } from "../core/Pill";
import { Popover } from "../core/Popover";
import { Text } from "../core/Text";
import { useTokens } from "../../mode";
import styles from "./ApiResponseViewer.module.css";
import { statusPillShade, statusReasonPhrase, methodPillShade } from "./status";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type ApiResponseHeaders =
  | Record<string, string>
  | ReadonlyArray<readonly [string, string]>;

export interface ApiResponseViewerProps {
  /** Parsed response body — rendered with {@link JsonCodeView}. */
  body: unknown;
  /** HTTP status code. */
  status: number;
  method?: HttpMethod;
  url?: string;
  headers?: ApiResponseHeaders;
  /** Round-trip duration in milliseconds. */
  durationMs?: number;
  /** Props forwarded to the body {@link JsonCodeView} (except `data`). */
  codeView?: Omit<JsonCodeViewProps, "data">;
  "aria-label"?: string;
}

function normalizeHeaders(
  headers?: ApiResponseHeaders,
): ReadonlyArray<readonly [string, string]> {
  if (!headers) return [];
  if (Array.isArray(headers)) return headers;
  return Object.entries(headers);
}

function ResponseHeadersPanel({ entries }: { entries: ReadonlyArray<readonly [string, string]> }) {
  const { space } = useTokens();
  return (
    <Box gap="sm" padding="sm" className={styles.headersPopover}>
      <Text color="neutral.default" weight="medium">
        Headers
      </Text>
      <dl className={styles.headers} style={{ gap: space.sm }}>
        {entries.map(([name, value]) => (
          <div key={name} className={styles.headerEntry} style={{ gap: space.xxs }}>
            <Text as="dt" color="neutral.default" weight="medium">
              {name}
            </Text>
            <Text as="dd" color="neutral.muted">
              {value}
            </Text>
          </div>
        ))}
      </dl>
    </Box>
  );
}

/**
 * HTTP response shell — status summary, optional headers, JSON body via
 * {@link JsonCodeView}. Intended for API debug panels and network inspectors.
 */
export function ApiResponseViewer({
  body,
  status,
  method,
  url,
  headers,
  durationMs,
  codeView,
  "aria-label": ariaLabel,
}: ApiResponseViewerProps) {
  const headerEntries = useMemo(() => normalizeHeaders(headers), [headers]);
  const showHeaders = headerEntries.length > 0;

  return (
    <Box
      role="region"
      aria-label={ariaLabel ?? "API response"}
      borderColor="translucent.2"
      borderRadius="md"
      overflow="hidden"
    >
      <Box
        flexDirection="row"
        alignItems="center"
        gap="sm"
        paddingBlock="sm"
        paddingInline="md"
        className={styles.summary}
      >
        <Box
          flexDirection="row"
          alignItems="center"
          gap="sm"
          flexGrow={1}
          className={styles.summaryLeading}
        >
          {url ? (
            <Text as="span" color="neutral.muted" truncate className={styles.url}>
              {url}
            </Text>
          ) : null}

          {method ? (
            <Pill shade={methodPillShade(method)} intensity="light" className={styles.method}>
              {method}
            </Pill>
          ) : null}

          <Box flexDirection="row" alignItems="center" gap="xs" flexShrink={0} className={styles.status}>
            <Pill shade={statusPillShade(status)} intensity="bold">
              {status}
            </Pill>
            <Text color="neutral.muted">{statusReasonPhrase(status)}</Text>
          </Box>

          {showHeaders ? (
            <Popover
              placement="bottom-start"
              aria-label="Response headers"
              role="dialog"
              className={styles.headersPopoverPanel}
              trigger={
                <IconButton
                  aria-label="Response headers"
                  variant="ghost"
                  size="xs"
                  icon={<Icon name="keyboard_arrow_down" />}
                />
              }
            >
              <ResponseHeadersPanel entries={headerEntries} />
            </Popover>
          ) : null}
        </Box>

        {durationMs != null ? (
          <Text as="span" color="neutral.muted" className={styles.duration}>
            {durationMs} ms
          </Text>
        ) : null}
      </Box>

      <Divider />

      <Box flexGrow={1} className={styles.body}>
        <JsonCodeView data={body} surfaceVariant="embedded" linkify aria-label="Response body" {...codeView} />
      </Box>
    </Box>
  );
}
