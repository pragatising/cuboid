import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom"],
    // The workspace's Cuboid source, not its `dist` (which is only as fresh as the last build).
    alias: { "@sragatiping/cuboid": fileURLToPath(new URL("../react/src/index.ts", import.meta.url)) },
  },
  css: { modules: { classNameStrategy: "non-scoped" } },
  test: { globals: true, environment: "jsdom", setupFiles: ["./src/test/setup.ts"], include: ["src/**/*.test.{ts,tsx}"] },
});
