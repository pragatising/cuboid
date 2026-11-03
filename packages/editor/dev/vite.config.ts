import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// A page to try the editor on. Cuboid comes from the workspace source, as in the tests.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: { "@sragatiping/cuboid": fileURLToPath(new URL("../../react/src/index.ts", import.meta.url)) },
  },
  server: { port: 5189, strictPort: true },
});
