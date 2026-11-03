import React, { useEffect, useMemo } from "react";
import { printExample } from "../../engine/print";
import { toElement } from "../../engine/render";
import { useAnatomy } from "../anatomy/AnatomyContext";
import { Device } from "../canvas/Device";
import type { DeviceId } from "../canvas/Device";
import { importFrom, resolve } from "../playground/host";
import { ExampleBoundary } from "../playground/ExampleBoundary";
import type { Template } from "./templates";
import classes from "./CompositionView.module.css";

/** The template as JSON: the schema the composition is drawn from, and what goes in the right pane. */
export const schemaOf = (template: Template) => JSON.stringify(template.root, null, 2);

/** The width of a frame a composition is in when it is on no device: a desktop's. */
const FRAME = 1440;

function Drawn({ template }: { template: Template }) {
  const sources = useMemo(() => printExample(template.root, { importFrom }).sources, [template]);
  return <ExampleBoundary>{toElement(template.root, resolve, sources)}</ExampleBoundary>;
}

/**
 * Every ready-made composition, side by side on the canvas, each named above it as a frame is in Figma. Each is drawn from its JSON on the
 * device it asks for, or on the one chosen for all. The one last pressed is selected: its schema is in the right pane, and its issues.
 */
export function CompositionView({ templates, selectedId, onSelect, device }: { templates: Template[]; selectedId: string; onSelect: (id: string) => void; device: DeviceId | null }) {
  const { setExample } = useAnatomy();
  const selected = templates.find((template) => template.id === selectedId) ?? templates[0];

  useEffect(() => {
    const code = schemaOf(selected);
    setExample({ name: selected.title, code, lineMap: code.split("\n").map(() => null) });
    return () => setExample(null);
  }, [selected, setExample]);

  return (
    <div className={classes.Row}>
      {templates.map((template) => (
        <section key={template.id} className={classes.Item} aria-label={template.title} data-selected={template.id === selected.id ? "" : undefined} onPointerDownCapture={() => onSelect(template.id)}>
          <button type="button" className={classes.Title} onClick={() => onSelect(template.id)}>
            {template.title}
          </button>
          <Device device={device ?? template.device} url={`localhost:3000/${template.id}`} frameWidth={FRAME}>
            <Drawn template={template} />
          </Device>
        </section>
      ))}
    </div>
  );
}
