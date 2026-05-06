import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

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
        entry: resolve(__dirname, "src/index.ts"),
        name: "Cube",
        formats: ["es", "cjs"],
        fileName: (format) => `index.${format}.js`,
      },
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
