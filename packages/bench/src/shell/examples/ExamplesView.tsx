import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Preview } from "../../frame";
import { hasExamples, humanize, loadExamples } from "../../frame/examples";
import type { Example } from "../../frame/examples";
import { Box, EmptyState } from "../../ui/index";
import { Device } from "../canvas/Device";
import { useCanvasSelection } from "../canvas/Canvas";
import { useFrames } from "../canvas/FrameStore";
import { composeExamples } from "../playground/compose";
import { useAnatomy } from "../anatomy/AnatomyContext";
import { applyEdits, nodeOf, writtenOf } from "../../engine/example";
import { patchesOf, useExampleTree } from "./useExampleTree";
import { MAIN, useProps } from "../props/PropsContext";

/** How wide a frame is to begin with: what fills its container needs a width to fill, and the frame's right edge drags it from here. */
const FRAME_WIDTH = 480;

/** What selecting an example's frame is known by. */
const frameId = (component: string, name: string) => `${component}:${name}`;

/**
 * One example, in a frame named for it, drawn with what has been set on its component in the pane (kept for this frame, selected or not), on the screen
 * chosen for this frame in the pane. A press on an empty part of the page it is drawn in selects the frame, as one on the frame's own edge does.
 */
function ExampleFrame({ component, name, frame }: { component: string; name: string; frame: Example["frame"] }) {
  const content = useMemo(() => ({ authored: { component, example: name } }), [component, name]);
  const id = frameId(component, name);
  // What was changed in this frame, by instance: the page makes each element written at one of these places with those props, and no other.
  const play = useProps();
  const { main, positions } = useExampleTree(component, name);
  const edits = useMemo(() => patchesOf(play?.editsOf(id), main?.id, positions), [play, id, main, positions]);
  const frames = useFrames();
  const device = frames?.deviceOf(id) ?? "none";
  const startOn = frames?.startOn;
  useEffect(() => {
    if (frame.device) startOn?.(id, frame.device);
  }, [id, frame.device, startOn]);
  const select = useCanvasSelection()?.select;
  const press = useCallback(() => select?.(id), [select, id]);
  return (
    <Device device={device} url={`localhost:3000/${component}`} frameWidth={frame.width ?? FRAME_WIDTH} name={frame.name ?? humanize(name)} id={id}>
      <Preview title={`${component}: ${frame.name ?? humanize(name)}`} content={content} minHeight={frame.height} edits={edits} onEmptyPress={press} />
    </Device>
  );
}

/**
 * The Examples view: what someone wrote to be shown, `Name.examples.tsx` beside the component (plain function components, one per export,
 * written as an app would use the component). Each is a frame of its own, named for its export, side by side as frames are on a page in
 * Figma, and each is drawn in a page of its own (see `Preview`). Nothing here is derived: to show another example, write another export.
 */
export function ExamplesView({ component }: { component: string }) {
  const has = hasExamples(component);
  const [found, setFound] = useState<Example[] | null>(null);
  const names = useMemo(() => found?.map((example) => example.name) ?? null, [found]);
  const selected = useCanvasSelection()?.selected ?? null;
  const play = useProps();
  const tour = useMemo(() => composeExamples(component), [component]);
  const select = useCanvasSelection()?.select;
  const selectedNow = useRef(selected);
  selectedNow.current = selected;
  const picked = names?.find((name) => frameId(component, name) === selected);
  const { setExample } = useAnatomy();

  // The example selected, as a tree: what it says about the component is what the pane starts from.
  const { written, tree, main } = useExampleTree(component, picked);

  // Selecting a frame puts the component's props in the pane, as that example sets them, to play with in that frame: what is changed there
  // is drawn in that frame only. Another frame is another example's props.
  useEffect(() => {
    play?.setBase(picked !== undefined && tour ? { component, doc: tour.doc, node: main ? nodeOf(main, component) : { tag: component }, written: main ? writtenOf(main) : undefined, tree, scope: frameId(component, picked) } : null);
    return () => play?.setBase(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `play` changes with every change made; the frame selected is what this is about
  }, [component, picked, tour, main, tree, play?.setBase]);

  // And its code, with the changes written in, beside the props: each change in the instance it was made on.
  const edits = play?.base ? play.editsOf(play.base.scope ?? play.base.component) : undefined;
  const code = useMemo(() => {
    if (!tree) return written;
    const byId = Object.fromEntries(Object.entries(edits ?? {}).map(([key, changes]) => [key === MAIN ? (main?.id ?? key) : key, changes]));
    return applyEdits(tree, byId);
  }, [tree, written, edits, main]);
  useEffect(() => {
    setExample(picked !== undefined && code !== undefined ? { name: humanize(picked), code, lineMap: code.split("\n").map((_, line) => line) } : null);
    return () => setExample(null);
  }, [picked, code, setExample]);

  useEffect(() => {
    let current = true;
    setFound(null);
    void loadExamples(component).then((loaded) => current && setFound(loaded ?? []));
    return () => {
      current = false;
    };
  }, [component]);

  // The first example is selected to begin with, so the pane has something to show. Letting go of it afterwards is the viewer's.
  const first = names?.[0];
  useEffect(() => {
    if (first !== undefined && !names?.some((name) => frameId(component, name) === selectedNow.current)) select?.(frameId(component, first));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per component's examples loaded: what is selected later is not this effect's to undo
  }, [component, first, select]);

  if (!has || names?.length === 0) {
    return (
      <Box flexGrow={1} alignItems="center" justifyContent="center">
        <EmptyState
          icon="code"
          heading="No examples yet"
          description={`Write them in ${component}.examples.tsx beside the component: each exported function component is an example, shown here in a frame named for it.`}
        />
      </Box>
    );
  }
  if (!names) return null;

  return (
    <Box as="ul" flexDirection="row" alignItems="flex-start" gap="6x" style={{ listStyle: "none", margin: 0, padding: "120px 160px 160px" }}>
      {found!.map(({ name, frame }) => (
        <li key={name} style={{ flex: "none" }}>
          <ExampleFrame component={component} name={name} frame={frame} />
        </li>
      ))}
    </Box>
  );
}
