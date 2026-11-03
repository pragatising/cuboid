import React from "react";

export type CardProps = React.ComponentPropsWithRef<"section"> & {
  /** The card's heading. */
  title: string;
  tone?: "info" | "warn";
};

/** A titled block. */
export function Card({ title, tone = "info", children, ...props }: CardProps) {
  return (
    <section data-tone={tone} {...props}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
