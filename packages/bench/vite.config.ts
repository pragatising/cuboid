import fs from "node:fs";
import path from "node:path";
import { defineConfig, searchForWorkspaceRoot, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { loadBench } from "./src/load";
import { bench, benchJsx } from "./src/plugin";
import { forceStates } from "./src/forceStates";
import { sourceHashPlugin } from "./src/sourceHash";

// Bench's theme (`bench generate`: Cuboid's tokens + theme/overrides.json5) is for Bench's own interface (shell/, ui/), not for the library it
// shows: the frames and the library's own components keep the library's tokens, so a component is drawn as it is.
const theme = path.join(__dirname, ".theme");
const own = [path.join(__dirname, "src/shell"), path.join(__dirname, "src/ui")].map((dir) => dir + path.sep);
const benchTheme = (): Plugin => ({
  name: "bench-theme",
  enforce: "pre",
  resolveId(source, importer) {
    if (!fs.existsSync(theme) || !importer || !own.some((dir) => importer.startsWith(dir))) return null;
    if (source === "@sragatiping/cuboid-primitives/css/theme.css") return path.join(theme, "css/theme.css");
    if (source === "@sragatiping/cuboid-primitives") return path.join(theme, "js/tokens.js");
    return null;
  },
});

// Bench's own Vite config (`bench dev`). The library it shows is not in it: the config of the package that runs it says where that is.
export default defineConfig(async () => {
  // The config of the package Bench is run from (`BENCH_CONFIG`, or `bench.config.ts` there): Bench shows whichever library it is told about.
  const { config, base } = await loadBench();
  return {
    root: path.join(__dirname, "src"),
    plugins: [benchTheme(), benchJsx(), bench(config, base), react(), sourceHashPlugin(config, base)],
    resolve: { dedupe: ["react", "react-dom"] },
    // Bench's own files and its dependencies (the plugin adds the library's folders).
    server: { fs: { allow: [__dirname, searchForWorkspaceRoot(__dirname)] } },
    // Two pages: Bench, and the page inside each frame (frame/document), which draws the library on a document of its own.
    build: { rollupOptions: { input: { index: path.join(__dirname, "src/index.html"), frame: path.join(__dirname, "src/frame/document/index.html") } } },
    css: { postcss: { plugins: [forceStates()] } },
  };
});
