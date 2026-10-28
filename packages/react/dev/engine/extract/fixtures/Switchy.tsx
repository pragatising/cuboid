import React from "react";

type Kind = "spinner" | "skeleton" | "none";

export function Switchy({ kind, label }: { kind: Kind; label: string }) {
  switch (kind) {
    case "spinner":
      return <span role="status">{label}</span>;
    case "skeleton":
      return <div aria-hidden="true" />;
    default:
      return null;
  }
}
