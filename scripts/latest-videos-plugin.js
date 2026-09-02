import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SHORTS } from "../src/js/shorts.js";
import {
  fetchChannelVideos,
  onThisDayMapFromVideos,
} from "./youtube-feed.js";

export const YOUTUBE_CHANNEL_ID = "UClKb54sR_nVBVudB9JoE81g";

const CACHE_MS = 10 * 60 * 1000;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.end(JSON.stringify(body));
}

export function latestVideosPlugin() {
  let cache = { at: 0, latest: null, shorts: null };

  async function load() {
    const now = Date.now();
    if (cache.latest && now - cache.at < CACHE_MS) return cache;
    const videos = await fetchChannelVideos(YOUTUBE_CHANNEL_ID);
    const latest = videos.slice(0, 8).map(({ published, ...video }) => video);
    const shorts = onThisDayMapFromVideos(videos, SHORTS);
    cache = { at: now, latest, shorts };
    return cache;
  }

  return {
    name: "latest-videos",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/api/latest-videos.json" && path !== "/api/on-this-day-shorts.json") {
          return next();
        }
        try {
          const data = await load();
          if (path === "/api/on-this-day-shorts.json") json(res, 200, data.shorts);
          else json(res, 200, data.latest);
        } catch (error) {
          console.warn("[youtube-feed]", error.message);
          if (path === "/api/on-this-day-shorts.json") json(res, 200, SHORTS);
          else json(res, 502, []);
        }
      });
    },
    async closeBundle() {
      try {
        const data = await load();
        const dir = join(process.cwd(), "dist", "api");
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, "latest-videos.json"), `${JSON.stringify(data.latest, null, 2)}\n`);
        writeFileSync(join(dir, "on-this-day-shorts.json"), `${JSON.stringify(data.shorts, null, 2)}\n`);
      } catch (error) {
        console.warn("[youtube-feed] build skip:", error.message);
      }
    },
  };
}
