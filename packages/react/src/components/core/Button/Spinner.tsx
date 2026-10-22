import React from "react";
import classes from "./Spinner.module.css";

/** A busy indicator in the current text colour. Its size is set by the parent (the button's icon size). */
export function Spinner() {
  return (
    <svg
      data-component="loadingSpinner"
      className={classes.Spinner}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
