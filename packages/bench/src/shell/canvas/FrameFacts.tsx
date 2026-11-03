import React from "react";
import { ActionMenu, Box, Text } from "../../ui/index";
import { SelectChip } from "../props";
import { DEVICE_OPTIONS } from "./Device";
import type { DeviceId } from "./Device";
import { useFrames } from "./FrameStore";

/** The label column of a row, as wide as the Figma's (5090:187660), so what is chosen or read lines up under it. */
const LABEL = "6.25rem";

/**
 * What the frame selected has of its own, above its example's props and code: the screen it is shown on (a select, as the Figma has it),
 * and how big it is. The size is read, not set: it follows the frame as it is dragged on the canvas, or is the screen's. A frame's name
 * is the example's, and is not changed here.
 */
export function FrameFacts({ id }: { id: string }) {
  const frames = useFrames();
  if (!frames) return null;
  const device = frames.deviceOf(id);
  const size = frames.sizeOf(id);
  const chosen = DEVICE_OPTIONS.find((option) => option.id === device);
  return (
    <Box flexDirection="column" gap="0.5x" paddingInline="1x">
      <Box flexDirection="row" alignItems="center" gap="3x" minHeight="1.25rem">
        <Text as="span" size="sm" color="neutral.muted" style={{ width: LABEL }}>
          Device
        </Text>
        <ActionMenu
          aria-label="Device"
          selectionMode="single"
          placement="bottom-start"
          trigger={<SelectChip aria-label={`Device: ${chosen?.label ?? "No device"}`}>{chosen?.label ?? "No device"}</SelectChip>}
        >
          {DEVICE_OPTIONS.map((option) => (
            <ActionMenu.Item key={option.id} selected={option.id === device} onClick={() => frames.setDevice(id, option.id as DeviceId)}>
              {option.label}
            </ActionMenu.Item>
          ))}
        </ActionMenu>
      </Box>
      <Box flexDirection="row" alignItems="center" gap="3x" minHeight="1.25rem">
        <Text as="span" size="sm" color="neutral.muted" style={{ width: LABEL }}>
          Size
        </Text>
        <Text as="span" size="sm" aria-label="Size">
          {size ? `${size.width} × ${size.height}` : "–"}
        </Text>
      </Box>
    </Box>
  );
}
