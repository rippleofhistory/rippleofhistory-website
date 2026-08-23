import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fetchLatestVideos } from "./youtube-feed.js";

export const YOUTUBE_CHANNEL_ID = "UClKb54sR_nVBVudB9JoE81g";

const CACHE_MS = 10 * 60 * 1000;

export function latestVideosPlugin() {
  let cache = { at: 0, data: null };

  async function load() {
    const now = Date.now();
    if (cache.data && now - cache.at < CACHE_MS) return cache.data;
    const videos = await fetchLatestVideos(YOUTUBE_CHANNEL_ID, 8);
    cache = { at: now, data: videos };
    return videos;
  }

  return {
    name: "latest-videos",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/api/latest-videos.json") return next();
        try {
          const videos = await load();
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "public, max-age=60");
          res.end(JSON.stringify(videos));
        } catch (error) {
          console.warn("[latest-videos]", error.message);
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end("[]");
        }
      });
    },
    async closeBundle() {
      try {
        const videos = await load();
        const dir = join(process.cwd(), "dist", "api");
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, "latest-videos.json"), `${JSON.stringify(videos, null, 2)}\n`);
      } catch (error) {
        console.warn("[latest-videos] build skip:", error.message);
      }
    },
  };
}
