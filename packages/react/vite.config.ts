import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig(({ mode }) => {
  // `npm run dev` serves the demo app; `npm run build` produces the library dist
  if (mode === "development") {
    return {
      plugins: [react()],
      root: "dev",
    };
  }

  return {
    plugins: [
      react(),
      dts({
        insertTypesEntry: true,
        include: ["src"],
        exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.test-d.ts", "src/**/*.test-d.tsx", "src/**/*.examples.tsx", "src/test"],
      }),
    ],
    build: {
      lib: {
        entry: {
          index: path.resolve(__dirname, "src/index.ts"),
        },
        name: "Cube",
        formats: ["es", "cjs"],
        fileName: (format, entryName) =>
          `${entryName}.${format === "es" ? "es" : "cjs"}.js`,
      },
      cssCodeSplit: false,
      rollupOptions: {
        // Never bundle React — consumers provide it.
        // Never bundle the tokens either (ADR-04): the consuming app's build
        // runs the token pipeline over its own overrides and resolves this
        // import to the result. Inlining them would freeze the defaults.
        external: [
          "react",
          "react/jsx-runtime",
          "react-dom",
          /^@sragatiping\/cuboid-primitives(\/.*)?$/,
        ],
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM",
          },
        },
      },
      sourcemap: true,
    },
  };
});
