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
        about: resolve(__dirname, "about.html"),
        support: resolve(__dirname, "support.html"),
        contact: resolve(__dirname, "contact.html"),
        disclaimer: resolve(__dirname, "disclaimer.html"),
        privacy: resolve(__dirname, "privacy.html"),
        terms: resolve(__dirname, "terms.html"),
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
