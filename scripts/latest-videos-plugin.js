import { SHORTS } from "../src/js/shorts.js";
import {
  displayTitle,
  fetchChannelVideos,
  onThisDayMapFromVideos,
} from "./youtube-feed.js";

export const YOUTUBE_CHANNEL_ID = "UClKb54sR_nVBVudB9JoE81g";

const CACHE_MS = 60 * 1000;

function feedKind(url) {
  const path = url?.split("?")[0];
  if (path === "/api/latest-videos" || path === "/api/latest-videos.json") return "latest";
  if (path === "/api/on-this-day-shorts" || path === "/api/on-this-day-shorts.json") return "shorts";
  return null;
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export function latestVideosPlugin() {
  let cache = { at: 0, latest: null, shorts: null };

  async function load() {
    const now = Date.now();
    if (cache.latest && now - cache.at < CACHE_MS) return cache;
    const videos = await fetchChannelVideos(YOUTUBE_CHANNEL_ID);
    const latest = videos.slice(0, 8).map(({ published, ...video }) => ({
      ...video,
      title: displayTitle(video.title),
    }));
    const shorts = onThisDayMapFromVideos(videos, SHORTS);
    cache = { at: now, latest, shorts };
    return cache;
  }

  function attach(server) {
    server.middlewares.use(async (req, res, next) => {
      const kind = feedKind(req.url);
      if (!kind) return next();
      try {
        const data = await load();
        json(res, 200, kind === "shorts" ? data.shorts : data.latest);
      } catch (error) {
        console.warn("[youtube-feed]", error.message);
        if (kind === "shorts") json(res, 200, SHORTS);
        else json(res, 502, []);
      }
    });
  }

  // Leave the feeds out of dist. A baked JSON file is served ahead of the Vercel rewrite and freezes the channel.
  return {
    name: "latest-videos",
    configureServer: attach,
    configurePreviewServer: attach,
  };
}
