import React, { useEffect, useRef, useState } from "react";

export type ToggleProps = {
  /** Whether it starts on. */
  defaultOn?: boolean;
  /** Called with the new value when it is pressed. */
  onChange?: (on: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"button">, "onChange" | "disabled" | "children">;

export function Toggle({ defaultOn = false, onChange, disabled, children, ...rest }: ToggleProps) {
  const [on, setOn] = useState(defaultOn);
  const ref = useRef<HTMLButtonElement>(null);

  function handleClick() {
    setOn(!on);
    onChange?.(!on);
  }
  useEffect(() => {
    if (on) ref.current?.focus();
  }, [on]);

  return (
    <button ref={ref} className={on ? "on" : "off"} disabled={disabled} aria-pressed={on} onClick={handleClick} {...rest}>
      {children}
      {on && <span>On</span>}
    </button>
  );
}
