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
      }),
    ],
    build: {
      lib: {
        entry: {
          index: path.resolve(__dirname, "src/index.ts"),
          tokens: path.resolve(__dirname, "src/tokens.ts"),
        },
        name: "Cube",
        formats: ["es", "cjs"],
        fileName: (format, entryName) =>
          `${entryName}.${format === "es" ? "es" : "cjs"}.js`,
      },
      cssCodeSplit: false,
      rollupOptions: {
        // Never bundle React — consumers provide it
        external: ["react", "react/jsx-runtime", "react-dom"],
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
