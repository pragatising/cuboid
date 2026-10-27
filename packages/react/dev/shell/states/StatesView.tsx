import React, { useLayoutEffect, useRef, useState } from "react";
import { Box, EmptyState, Text, VisuallyHidden } from "../../../src";
import { Connector } from "./Connector";
import { Group } from "./Group";
import { buildNav } from "../nav";
import { applyStep, discoverParts, pseudoOf } from "./derive";
import { INTERACTIONS } from "./interactions";
import type { Interaction, PartModel, State, StateModel } from "./model";
import { loadPreviewSource } from "./source";
import type { PreviewSource } from "./source";
import classes from "./StatesView.module.css";

/** One picture: the component's example, with each place a state concerns put in that state once it is on the page. */
function Preview({ source, variant, state }: { source: PreviewSource; variant?: string; state: State }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const elements = Array.from(host.current?.querySelectorAll("*") ?? []);
    for (const step of state.apply) applyStep(elements, step);
  }, [state, variant, source]);
  return (
    <div ref={host} data-preview>
      <source.Example variant={variant} />
    </div>
  );
}

/** How an element looks to the eye, for telling whether two states differ. */
function lookOf(element: Element | undefined): string {
  if (!element) return "";
  const css = getComputedStyle(element);
  return ["backgroundColor", "color", "borderTopColor", "boxShadow", "outlineStyle", "outlineColor", "textDecorationLine", "opacity", "width", "height"].map((key) => css[key as keyof CSSStyleDeclaration]).join("|");
}

function Figure({ source, variant, state, figureRef }: { source: PreviewSource; variant?: string; state: State; figureRef?: (element: HTMLElement | null) => void }) {
  return (
    <Box as="figure" margin={0} alignItems="center">
      {/* The picture is for the eye: it is not interactive and a screen reader gets the caption instead. */}
      <div inert aria-hidden="true" ref={figureRef}>
        <Preview source={source} variant={variant} state={state} />
      </div>
      <VisuallyHidden as="figcaption">{state.label}</VisuallyHidden>
    </Box>
  );
}

function describe(interaction: Interaction, part: string, quiet: boolean) {
  const pseudo = pseudoOf(interaction.id);
  return (
    <Box flexDirection="column" gap="1x" style={{ maxWidth: 280 }}>
      <Text size="sm" weight="semibold">
        {interaction.label} · {part}
      </Text>
      <Text size="sm" color="neutral.muted">
        {INTERACTIONS[interaction.id].summary} {pseudo ? <>The stylesheet reacts to <code>{pseudo}</code>: </> : null}
        {interaction.from} → {interaction.to}.
      </Text>
      {quiet ? (
        <Text size="sm" color="neutral.muted">
          Nothing visibly changes between these two states.
        </Text>
      ) : null}
      <Text size="sm" color="neutral.muted">
        The explanation of this interaction goes here.
      </Text>
    </Box>
  );
}

/** A row: the states a part reaches, each arrow naming the interaction that leads to it and starting where it happens. */
function Flow({ part, model, source, variant }: { part: string; model: StateModel; source: PreviewSource; variant?: string }) {
  const figures = useRef(new Map<string, HTMLElement | null>());
  const [same, setSame] = useState<Set<string>>(new Set());

  useLayoutEffect(() => {
    // The figure holds the preview's own wrapper, and `target` counts the elements inside it.
    const look = (state: string, target: number) => lookOf(figures.current.get(state)?.firstElementChild?.querySelectorAll("*")[target]);
    setSame(new Set(model.interactions.filter((it) => look(it.from, it.target) === look(it.to, it.target)).map((it) => it.to)));
  }, [model, source, variant]);

  return (
    <Box as="ol" flexDirection="row" alignItems="center" gap={0} style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {model.states.map((state) => {
        const arrow = model.interactions.find((it) => it.to === state.id);
        return (
          <Box as="li" key={state.id} flexDirection="row" alignItems="center" flexShrink={0}>
            {arrow ? (
              <Connector label={arrow.label} quiet={same.has(arrow.to)}>
                {describe(arrow, part, same.has(arrow.to))}
              </Connector>
            ) : null}
            <Figure source={source} variant={variant} state={state} figureRef={(element) => void figures.current.set(state.id, element)} />
          </Box>
        );
      })}
    </Box>
  );
}

/**
 * The States view, derived. It renders the component's example once, reads the component's own stylesheet through the CSSOM and
 * puts each interaction to the test on the page's elements (derive.ts) to learn which part it happens on and what that part
 * becomes. Then it draws, for each part and each variant, a row: the pictures are states, the arrows with badges are interactions.
 * A component that reacts to nothing still has its rest. Nothing about a component is written here.
 */
export function StatesView({ component }: { component: string }) {
  const [source, setSource] = useState<PreviewSource | null | undefined>(undefined);
  /** What each variant reacts to: a variant can style interactions another does not (`inherit` has no hover). */
  const [found, setFound] = useState<Map<string | undefined, PartModel[]> | null>(null);
  const probes = useRef(new Map<string | undefined, HTMLDivElement | null>());

  useLayoutEffect(() => {
    setSource(undefined);
    setFound(null);
    let current = true;
    void loadPreviewSource(component).then((loaded) => current && setSource(loaded));
    return () => {
      current = false;
    };
  }, [component]);

  useLayoutEffect(() => {
    if (!source) return;
    const next = new Map<string | undefined, PartModel[]>();
    for (const [variant, host] of probes.current) if (host) next.set(variant, discoverParts(host, component));
    setFound(next);
  }, [source, component]);

  if (source === null) {
    return (
      <Box flexGrow={1} alignItems="center" justifyContent="center">
        <EmptyState icon="touch_app" heading={`${component}: States`} description="No story to draw this component from yet." />
      </Box>
    );
  }
  if (!source) return null;

  const variants = source.variants.length > 0 ? source.variants : [undefined];
  // The parts found over all variants: the component itself first. A part of another component that has its own page (the Button
  // inside a Header) is that component's to show, so it is only mentioned.
  const pages = new Set(buildNav().flatMap((section) => section.items.map((item) => item.name)));
  const all = found ? [...new Set([component, ...[...found.values()].flatMap((list) => list.map((entry) => entry.part))])].sort((a, b) => (a === component ? -1 : b === component ? 1 : a.localeCompare(b))) : [];
  /** The page a part belongs to, when it is another component's: `Button`, `Breadcrumb.Link` and `BreadcrumbLink` all belong to a page. */
  const ownerOf = (part: string) => (part.startsWith(component) ? undefined : [...pages].filter((page) => part.startsWith(page)).sort((a, b) => b.length - a.length)[0]);
  const borrowed = (part: string) => ownerOf(part) !== undefined;
  const names = all.filter((part) => !borrowed(part));
  const others = [...new Set(all.filter(borrowed).map((part) => ownerOf(part)!))];
  const named = names.length > 1;
  const modelOf = (part: string, variant: string | undefined): StateModel => found?.get(variant)?.find((entry) => entry.part === part)?.model ?? { states: [{ id: "rest", label: "rest", apply: [] }], interactions: [] };
  return (
    <Box flexDirection="column" gap="8x" padding="4x" alignSelf="flex-start" className={classes.Pictures} data-component="Shell.States">
      {/* One example per variant, drawn only to be read: its stylesheet and elements tell which states exist. */}
      {variants.map((variant) => (
        <div key={variant ?? "default"} ref={(element) => void probes.current.set(variant, element)} inert aria-hidden="true" style={{ position: "absolute", visibility: "hidden" }}>
          <source.Example variant={variant} />
        </div>
      ))}
      {names.map((part) => (
        <Box as="section" key={part} aria-label={part} flexDirection="column" gap="4x">
          {named ? (
            <Text as="h2" size="sm" weight="semibold" color="neutral.contrast">
              Part: {part}
            </Text>
          ) : null}
          {variants.map((variant) => (
            <Group key={variant ?? "default"} kind={variant ? "Variant" : undefined} name={variant} capitalize as={named ? "h3" : "h2"}>
              <Flow part={part} model={modelOf(part, variant)} source={source} variant={variant} />
            </Group>
          ))}
        </Box>
      ))}
      {others.length > 0 ? (
        <Text size="sm" color="neutral.muted">
          Also in this example, with their own pages: {others.join(", ")}.
        </Text>
      ) : null}
    </Box>
  );
}
