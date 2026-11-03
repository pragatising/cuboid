import React, { createContext, useState } from "react";

export type OverlayProps = {
  /** What opens it. */
  trigger: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where it opens, from the trigger. @default "bottom" */
  placement?: "top" | "bottom";
  autoFocus?: boolean;
  children?: React.ReactNode;
};

const OverlayContext = createContext(false);

/** A panel that opens from a trigger. */
export function Overlay({ trigger, open, onOpenChange, placement = "bottom", autoFocus = true, children }: OverlayProps) {
  const [inner, setInner] = useState(false);
  const shown = open ?? inner;
  return (
    <OverlayContext.Provider value={shown}>
      {React.cloneElement(trigger, { onClick: () => (onOpenChange ?? setInner)(!shown) } as object)}
      {shown ? (
        <div role="dialog" data-placement={placement} data-autofocus={autoFocus}>
          {children}
        </div>
      ) : null}
    </OverlayContext.Provider>
  );
}
