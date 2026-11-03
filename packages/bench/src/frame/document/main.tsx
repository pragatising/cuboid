import React, { useState } from "react";
import { createRoot } from "react-dom/client";
// The library's own styles (its tokens, its fonts), as its config lists them.
import "virtual:bench-styles";
import type { FrameWindow, Shown } from "../protocol";
import { Boundary } from "./Boundary";
import { draw } from "./draw";
import { setPatches } from "./patches";
import "./document.css";

/**
 * The page inside a frame: the library on a page of its own, with its own tokens, mode, fonts and viewport, and nothing of Bench's interface. Bench
 * tells it what to draw (`show`), and reads its size and its elements directly (the page is on the same origin).
 */
const root = createRoot(document.getElementById("root")!);
// The mode is the page's own: the library's tokens write both, and the attribute picks one.
document.documentElement.setAttribute("data-mode", "light");

let set: (content: Shown | null) => void = () => undefined;

function Stage() {
  const [content, setContent] = useState<Shown | null>(null);
  set = setContent;
  return content ? <Boundary resetKey={content}>{draw(content)}</Boundary> : null;
}

root.render(<Stage />);
(window as FrameWindow).Bench = { show: (content) => set(content), edit: setPatches };
