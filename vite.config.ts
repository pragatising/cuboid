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
        entry: "src/index.ts",
        name: "Cube",
        formats: ["es", "cjs"],
        fileName: (format) => `index.${format}.js`,
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
