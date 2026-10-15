import { SHORTS } from "../src/js/shorts.js";
import { fetchChannelVideos, onThisDayMapFromVideos } from "../scripts/youtube-feed.js";

const CHANNEL_ID = "UClKb54sR_nVBVudB9JoE81g";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  try {
    const videos = await fetchChannelVideos(CHANNEL_ID);
    res.status(200).json(onThisDayMapFromVideos(videos, SHORTS));
  } catch {
    res.status(200).json(SHORTS);
  }
}
