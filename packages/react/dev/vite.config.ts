import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { forceStates } from "./forceStates";
import { storySource } from "./storySource";

// The docs shell's own Vite config (`npm run dev`). It is separate from `vite.config.ts` on purpose: Storybook merges that file,
// and the shell's dev-only CSS rewrite (forceStates) must not reach Storybook or the library build.
export default defineConfig({
  root: __dirname,
  plugins: [react({ babel: { plugins: [storySource] } })],
  css: { postcss: { plugins: [forceStates()] } },
  server: { fs: { allow: [path.resolve(__dirname, "../../..")] } },
});
