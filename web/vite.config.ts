import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../pkg/ui/dist",
    emptyOutDir: true,
  },
  base: "/app/",           // <<< IMPORTANT: assets will be served at /app/*
});