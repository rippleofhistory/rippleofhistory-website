import { fetchLatestVideos } from "../scripts/youtube-feed.js";

const CHANNEL_ID = "UClKb54sR_nVBVudB9JoE81g";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=86400");
  try {
    const videos = await fetchLatestVideos(CHANNEL_ID, 8);
    res.status(200).json(videos);
  } catch {
    res.status(502).json([]);
  }
}
