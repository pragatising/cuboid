import React from "react";
import apiJson from "~bench/generated/api.json";
import { useProps } from "../PropsContext";
import { Prop } from "./Prop";
import type { ComponentApi } from "../../../engine/api";
import type { Live } from "./Prop";
import { nodeOf, writtenOf } from "../../../engine/example";
import type { ExampleTree, Instance } from "../../../engine/example";
import type { ComponentDoc } from "../../../engine/types";
import { composeExamples } from "../../playground/compose";
import { PropOperator } from "./Prop/PropOperator";
import { TypeSignature } from "./Prop/PropSelectors";
import { PropsListSection } from "./PropsListSection";
import { useOpenComponent } from "./useOpenComponent";
import { exported } from "../../playground/compose";
import classes from "./PropsList.module.css";

const API = apiJson as unknown as Record<string, ComponentApi>;

/** What the component writes itself on the one it is built on, as the code writes it: `name = value`. Nothing to choose. */
function SetRow({ name, value }: { name: string; value: string }) {
  return (
    <li className={classes.Fixed} data-component="Prop">
      <Prop.Key prop={{ name, type: "", kind: "other" }} />
      <PropOperator assign />
      <TypeSignature type={value} />
    </li>
  );
}

/**
 * One component's API as `api.json` gives it: the box holds everything the caller can set on it, then, as a section inside the box, what it writes
 * itself on what it is built on, and last the count of the element's attributes. The view only draws what the API says.
 */
function Api({ name, caller, live }: { name: string; caller: ComponentApi; live: Live | null }) {
  const open = useOpenComponent();
  const { dom, css } = caller.native;
  // What the example writes on this instance that the component does not list (`disabled` on a button: the element's own): the example's, so it is shown as written.
  const listed = new Set(caller.props.map((prop) => prop.info.name));
  const unlisted = Object.entries(live?.base?.written ?? {}).filter(([prop]) => prop !== "children" && !listed.has(prop));
  let first = true;
  const label = () => (first ? ((first = false), `${name} properties`) : undefined);
  return (
    <div className={classes.Api} data-component="PropsList.Api">
      {caller.props.length || caller.sets.length || unlisted.length || dom + css > 0 ? (
        <PropsListSection.Well>
          {caller.props.length ? (
            <ul className={classes.Rows} aria-label={label() ?? `${name} properties`}>
              {caller.props.map((prop) => (
                <Prop key={prop.info.name} prop={prop.info} live={live} />
              ))}
            </ul>
          ) : null}
          {unlisted.length ? (
            <ul className={classes.Rows} aria-label={`${name} written`}>
              {unlisted.map(([prop, source]) => (
                <li key={prop} className={classes.Fixed} data-component="Prop" data-written="">
                  <Prop.Key prop={{ name: prop, type: "", kind: "other" }} />
                  {source ? (
                    <>
                      <PropOperator assign />
                      <TypeSignature type={source} />
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {caller.builtOn && caller.sets.length ? (
            <PropsListSection title={caller.builtOn.on} lead="Sets on" count={caller.sets.length} kind="instance" unit="values set" onOpen={open.to(caller.builtOn.on, caller.builtOn.declared)} bare>
              <ul className={classes.Rows} aria-label={`${name} sets`}>
                {caller.sets.map((set) => (
                  <SetRow key={set.name} name={set.name} value={set.value} />
                ))}
              </ul>
            </PropsListSection>
          ) : null}
          {/* The element's own attributes (`style`, `className`, `onClick`…) are counted, last, and not listed: they are the element's, not this component's. */}
          {dom + css > 0 ? (
            <p className={classes.More}>
              and {dom.toLocaleString()} more attributes of the element{css ? `, ${css.toLocaleString()} CSS properties by name` : ""}
            </p>
          ) : null}
        </PropsListSection.Well>
      ) : null}
    </div>
  );
}

/**
 * The Properties card (Figma 5090:187398): a section for each piece the component is made of, the component's own then each of its parts
 * (`Table.HeadCell`, `Table.Cell`…), the way a design tool's panel has a section for each thing a selection holds. Each section opens and
 * closes; the component's own is open and its parts are closed, so the card starts as short as the component's own props. Inside a section the
 * props are grouped as the code has them (see `Api`). The component's props can be played with when an example of it is (see `useProps`); a
 * part's props are read as types: what an example says of a part is in its code.
 */
/** What an instance is called in the pane: its own text (`Edit`), else the component and its place among the others. */
function labelOf(instance: Instance, index: number): string {
  const text = instance.children.find((child) => "kind" in child && child.kind === "text");
  return text && "text" in text ? text.text : `${instance.component ?? instance.tag} ${index + 1}`;
}

/** The pane pointed at one instance of the example: what it sets, and where a change to it goes. */
function liveFor(play: NonNullable<Live>, instance: Instance): Live {
  const component = instance.component ?? instance.tag;
  const doc: ComponentDoc = composeExamples(component)?.doc ?? { name: component, props: [], parts: [] };
  return {
    ...play,
    base: { ...play.base!, component, doc, node: nodeOf(instance, component), written: writtenOf(instance) },
    overrides: play.overridesAt(instance.id),
    change: (name, value) => play.changeAt(instance.id, name, value),
  };
}

export function PropsList({ component, api: library = API }: { component: string; api?: Record<string, ComponentApi> }) {
  const play = useProps();
  const api = library[component];
  const tree: ExampleTree | undefined = play?.base?.component === component ? play.base.tree : undefined;
  // A part that declares nothing (it is an element and takes its attributes) has nothing to show but them, so no section.
  const parts = (api?.parts ?? []).map((id) => library[id]).filter((part) => part && part.props.length > 0);
  // Only the example of the component the pane is for can be changed.
  const live = play?.base?.component === component ? play : null;
  const open = useOpenComponent();
  const hasOwn = (api?.props.length ?? 0) > 0 || (api?.native.dom ?? 0) > 0;

  if (!hasOwn && parts.length === 0) return <p className={classes.Empty}>{component} has no props of its own.</p>;

  return (
    <div className={classes.PropsList} data-component="PropsList">
      {hasOwn ? (
        <PropsListSection title={component} count={api.props.length} defaultOpen onOpen={open.toSource(exported[component])}>
          <Api name={component} caller={api} live={live} />
        </PropsListSection>
      ) : null}
      {parts.map((part) => {
        // The instances of this part the example writes: each is its own, with its own props, however many there are.
        const written = (tree?.instances ?? []).filter((instance) => instance.component === part.id);
        return (
          <PropsListSection key={part.id} title={part.id} count={part.props.length} note={written.length ? `×${written.length}` : undefined}>
            {written.length && live ? (
              written.map((instance, index) => (
                <PropsListSection key={instance.id} title={labelOf(instance, index)} count={part.props.length} kind="instance" arrow defaultOpen={written.length === 1}>
                  <Api name={part.id} caller={part} live={liveFor(live, instance)} />
                </PropsListSection>
              ))
            ) : (
              <Api name={part.id} caller={part} live={null} />
            )}
          </PropsListSection>
        );
      })}
    </div>
  );
}
