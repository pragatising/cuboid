import React from "react";
import { toElement } from "../../engine/render";
import type { Shown } from "../protocol";
import { Authored } from "./Authored";
import { resolve } from "./resolve";

/** What the page puts on itself for what it is shown: the elements of the example, from the library alone, or the example someone wrote. */
export const draw = (content: Shown): React.ReactNode =>
  "authored" in content ? <Authored component={content.authored.component} example={content.authored.example} /> : toElement(content.node, resolve, content.sources);
