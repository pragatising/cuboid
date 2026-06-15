import React, { useMemo } from "react";
import { JsonCodeView, type JsonCodeViewProps } from "../CodeBlock";
import { Box } from "../core/Box";
import { Divider } from "../core/Divider";
import { IconButton } from "../core/IconButton";
import { Pill } from "../core/Pill";
import { Popover } from "../core/Popover";
import { Stack } from "../core/Stack";
import { Text } from "../core/Text";
import { ExpandMoreIcon } from "../../icons/material";
import type { CubeTheme } from "../../theme/types";
import styles from "./ApiResponseViewer.module.css";
import { statusPillShade, statusReasonPhrase } from "./status";

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
  theme?: CubeTheme;
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

function ResponseHeadersPanel({
  entries,
  theme,
}: {
  entries: ReadonlyArray<readonly [string, string]>;
  theme?: CubeTheme;
}) {
  return (
    <Stack gap="xs" padding="sm" className={styles.headersPopover} theme={theme}>
      <Text variant="caption" color="fg.neutral.muted" theme={theme}>
        Headers
      </Text>
      <dl className={styles.headers}>
        {entries.map(([name, value]) => (
          <div key={name} className={styles.headerEntry}>
            <Text as="dt" variant="inlineCode" color="fg.neutral.default" theme={theme}>
              {name}
            </Text>
            <Text as="dd" variant="bodySmall" color="fg.neutral.muted" theme={theme}>
              {value}
            </Text>
          </div>
        ))}
      </dl>
    </Stack>
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
  theme,
  codeView,
  "aria-label": ariaLabel,
}: ApiResponseViewerProps) {
  const headerEntries = useMemo(() => normalizeHeaders(headers), [headers]);
  const showHeaders = headerEntries.length > 0;

  return (
    <Box
      role="region"
      aria-label={ariaLabel ?? "API response"}
      border="default"
      borderRadius="md"
      overflow="hidden"
      direction="vertical"
      gap="none"
      theme={theme}
    >
      <Stack
        direction="horizontal"
        align="center"
        gap="sm"
        padding="sm"
        paddingInline="md"
        className={styles.summary}
        theme={theme}
      >
        <Stack
          direction="horizontal"
          align="center"
          gap="xs"
          shrink={0}
          className={styles.summaryLeading}
          theme={theme}
        >
          <Pill
            shade={statusPillShade(status)}
            intensity="bold"
            variant="caption"
            theme={theme}
          >
            {status}
          </Pill>
          <Text variant="caption" color="fg.neutral.muted" theme={theme}>
            {statusReasonPhrase(status)}
          </Text>

          {method ? (
            <Text as="span" variant="inlineCode" color="fg.neutral.default" theme={theme}>
              {method}
            </Text>
          ) : null}

          {showHeaders ? (
            <Popover
              placement="bottom-start"
              aria-label="Response headers"
              theme={theme}
              className={styles.headersTrigger}
              contentClassName={styles.headersPopoverPanel}
              trigger={
                <IconButton
                  aria-label="Response headers"
                  variant="ghost"
                  size="xs"
                  theme={theme}
                >
                  <ExpandMoreIcon />
                </IconButton>
              }
            >
              <ResponseHeadersPanel entries={headerEntries} theme={theme} />
            </Popover>
          ) : null}
        </Stack>

        {url ? (
          <Text
            as="span"
            variant="bodySmall"
            color="fg.neutral.muted"
            truncate
            className={styles.url}
            theme={theme}
          >
            {url}
          </Text>
        ) : null}

        {durationMs != null ? (
          <Text
            as="span"
            variant="caption"
            color="fg.neutral.muted"
            className={styles.duration}
            theme={theme}
          >
            {durationMs} ms
          </Text>
        ) : null}
      </Stack>

      <Divider theme={theme} />

      <Box grow className={styles.body} theme={theme}>
        <JsonCodeView
          data={body}
          surfaceVariant="embedded"
          linkify
          aria-label="Response body"
          theme={theme}
          {...codeView}
        />
      </Box>
    </Box>
  );
}
