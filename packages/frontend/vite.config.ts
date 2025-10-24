import { defineConfig } from "vite"

export default defineConfig({
  root: ".",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: "esbuild",
    target: "esnext",
    sourcemap: false,
  },
  esbuild: {
    // Remove console.log and debugger in production builds
    drop: ["console", "debugger"],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/ws": {
        target: "ws://localhost:3000",
        ws: true,
      },
    },
  },
})
