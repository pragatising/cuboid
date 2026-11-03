import React from "react";

/** A component whose content is only optional props, none of them required: with none set it draws an empty box. */
export type PlaceholderProps = {
  icon?: string;
  heading?: React.ReactNode;
  description?: React.ReactNode;
};

export function Placeholder({ icon, heading, description }: PlaceholderProps) {
  return (
    <div>
      {icon ? <span>{icon}</span> : null}
      {heading ? <p>{heading}</p> : null}
      {description ? <p>{description}</p> : null}
    </div>
  );
}

/** The same, with the description required: it always has something to say. */
export function Notice({ icon, heading, description }: { icon?: string; heading?: React.ReactNode; description: React.ReactNode }) {
  return (
    <div>
      {icon ? <span>{icon}</span> : null}
      {heading ? <p>{heading}</p> : null}
      <p>{description}</p>
    </div>
  );
}
