import React, { useId, useState } from "react";
import { FileTypeIcon, Icon } from "../../../ui/index";
import classes from "./PropsList.module.css";

/** A section's props: the well the Figma sets them on, holding the groups of props. */
function PropsListSectionWell({ children }: { children: React.ReactNode }) {
  return (
    <div className={classes.Well} data-component="PropsList.Section.Well">
      {children}
    </div>
  );
}

/**
 * A section of the card (Figma Accordion, 5072:156084): a button that opens and closes it, the chevron saying which, the component's tile
 * and name. How many props are in it is said to a screen reader. A component that another renders is the same section as an instance.
 */
function PropsListSectionRoot({
  title,
  lead,
  count,
  kind = "component",
  note,
  unit,
  onOpen,
  defaultOpen = false,
  bare = false,
  arrow = false,
  children,
}: {
  title: string;
  /** What the section is to the component, said before the name: `Passed to` Overlay, for the props a component hands down as they are. */
  lead?: string;
  count: number;
  /** What the section is: the component itself (❖), or an instance of another component that it renders (◆), as the Figma's FileType draws them. */
  kind?: "component" | "instance";
  /** What the code says of where its props come from, after the name (`BoxProps<"div">`). */
  note?: React.ReactNode;
  /** What `count` counts, said to a screen reader. @default props, or values set for an instance */
  unit?: string;
  /** Goes to the component's source: the mark at the end of the header is its button. */
  onOpen?: () => void;
  defaultOpen?: boolean;
  /** Inside another section's box: it is not boxed again, and is as wide as the props above it. */
  bare?: boolean;
  /** One of several the example writes of a part, nested under the part: the return arrow says it is inside it, as the Figma draws an instance in an instance. */
  arrow?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const body = useId();
  const name = lead ? `${lead} ${title}` : title;
  return (
    <section className={classes.Section} data-component="PropsList.Section" data-kind={kind} data-bare={bare ? "" : undefined} data-open={open ? "" : undefined} aria-label={name}>
      <div className={classes.SectionRow}>
        <button type="button" className={classes.SectionHeader} aria-label={`${name}, ${count} ${unit ?? (kind === "instance" ? "values set" : "props")}`} aria-expanded={open} aria-controls={body} onClick={() => setOpen(!open)}>
          {arrow ? <Icon name="subdirectory_arrow_right" size="md" className={classes.SectionChevron} aria-hidden="true" /> : null}
          <Icon name={open ? "keyboard_arrow_down" : "keyboard_arrow_right"} size="md" className={classes.SectionChevron} aria-hidden="true" />
          <FileTypeIcon type={kind} size={18} />
          <span className={classes.SectionTitle}>
            {lead ? <span className={classes.SectionLead}>{lead} </span> : null}
            {title}
          </span>
          {note ? <span className={classes.SectionNote}>{note}</span> : null}
        </button>
        {onOpen ? (
          <button type="button" className={classes.SectionOpen} aria-label={`Open ${title} source`} onClick={onOpen}>
            <Icon name="north_east" size="xs" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <div id={body} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

export const PropsListSection = Object.assign(PropsListSectionRoot, { Well: PropsListSectionWell });
