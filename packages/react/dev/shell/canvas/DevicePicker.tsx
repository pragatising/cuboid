import React from "react";
import { ActionMenu, Icon, IconButton } from "../../../src";
import { DEVICE_OPTIONS } from "./Device";
import type { DeviceId } from "./Device";

const ICON = { none: "crop_square", desktop: "laptop_mac", tablet: "tablet_mac", phone: "mobile_2" } as const;

/** Chooses the screen content is shown on: one button, showing the one chosen, that opens the list. */
export function DevicePicker({ value, onChange }: { value: DeviceId; onChange: (device: DeviceId) => void }) {
  const chosen = DEVICE_OPTIONS.find((option) => option.id === value);
  return (
    <ActionMenu
      aria-label="Device"
      selectionMode="single"
      placement="bottom-end"
      trigger={<IconButton variant="outlined" size="sm" aria-label={`Device: ${chosen?.label ?? "No device"}`} icon={<Icon name={ICON[value]} />} />}
    >
      {DEVICE_OPTIONS.map((option) => (
        <ActionMenu.Item key={option.id} selected={option.id === value} leadingVisual={<Icon name={ICON[option.id]} />} onClick={() => onChange(option.id)}>
          {option.label}
        </ActionMenu.Item>
      ))}
    </ActionMenu>
  );
}
