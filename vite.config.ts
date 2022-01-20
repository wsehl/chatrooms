import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  root: "./client",
  server: {
    proxy: {
      "/socket/": "http://localhost:8081/socket/",
    },
  },
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./client/src", import.meta.url)),
    },
  },
});
