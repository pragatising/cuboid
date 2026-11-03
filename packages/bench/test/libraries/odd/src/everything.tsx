import React from "react";
import type { ComponentType } from "react";

interface BaseProps {
  /** Shown by assistive technology. */
  label?: string;
}

export interface BadgeProps extends BaseProps {
  count: number;
  /** @default "gray" */
  shade?: "gray" | "red";
}

export class Badge extends React.Component<BadgeProps> {
  render() {
    return <span data-shade={this.props.shade}>{this.props.count}</span>;
  }
}

interface RowProps<T extends string> extends BaseProps {
  value: T;
  onPick?: (value: T) => void;
}

function Row({ value, onPick, label }: RowProps<string>) {
  return (
    <li aria-label={label} onClick={() => onPick?.(value)}>
      {value}
    </li>
  );
}

type PanelProps = React.HTMLAttributes<HTMLDivElement> & { heading?: string };

export function Panel({ heading, children, ...rest }: PanelProps) {
  return (
    <div {...rest}>
      {heading ? <h3>{heading}</h3> : null}
      <ul>{children}</ul>
    </div>
  );
}
Panel.Row = Row;

function withTone<P extends object>(Wrapped: ComponentType<P>): ComponentType<P & { tone?: string }> {
  return (props) => <Wrapped {...(props as P)} />;
}

export const TonedPanel = withTone(Panel);
