import React from "react";
import { createRoot } from "react-dom/client";
import "@sragatiping/cuboid-primitives/css/theme.css";
import "@sragatiping/cuboid-primitives/icons/icon-fonts.css";
import { setMode } from "../../src/mode";
import { Shell } from "./Shell";

// The token build writes both modes into theme.css; setMode picks one (and sets data-mode on <html>).
setMode("light");

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>,
);
