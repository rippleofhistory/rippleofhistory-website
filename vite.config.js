import { resolve } from "node:path";
import { defineConfig } from "vite";
import { latestVideosPlugin } from "./scripts/latest-videos-plugin.js";

export default defineConfig({
  appType: "mpa",
  plugins: [latestVideosPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        onThisDay: resolve(__dirname, "on-this-day.html"),
        support: resolve(__dirname, "support.html"),
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    watch: {
      ignored: ["**/.tmp-verify/**"],
    },
  },
});
