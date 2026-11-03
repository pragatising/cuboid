import React from "react";
import { Icon } from "../../ui/index";
import classes from "./SelectChip.module.css";

/**
 * The chip that opens a list to choose from (Figma 5038:92511 Token): the value in use and a chevron. It is the trigger of every choice in
 * the pane (a prop's, a frame's screen), so they look alike. `tone` is its syntax: the datatype's name while nothing is chosen (teal, as a type is
 * written), then the value in the colour of what it is (a string orange, a number blue). Without one it is plain text.
 */
export function SelectChip({ children, tone, ...props }: React.ComponentPropsWithRef<"button"> & { tone?: "type" | "string" | "number" }) {
  return (
    <button type="button" {...props} className={classes.SelectChip} data-component="SelectChip" data-tone={tone}>
      {children}
      <Icon name="keyboard_arrow_down" size="sm" aria-hidden="true" />
    </button>
  );
}
