import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      // Mirrors the "@/*" path alias from tsconfig.json so test files can
      // import components the same way the app does.
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
