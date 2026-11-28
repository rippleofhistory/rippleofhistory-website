import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHANNEL_ID } from "../src/js/site.js";
import { displayTitle, fetchChannelVideos, parseOnThisDayDate } from "./youtube-feed.js";
import { applyHome } from "./page-html.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "index.html");
const sitePath = path.join(root, "src", "js", "site.js");

function dated(video) {
  const parsed = parseOnThisDayDate(video.title);
  return parsed ? { ...video, month: parsed.month, day: parsed.day } : video;
}

function fallbackRow(video) {
  const row = {
    id: video.id,
    title: video.title,
    tag: video.tag,
    length: video.length,
    kind: video.kind,
  };
  const fields = Object.entries(row)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `  { ${fields.join(", ")} },`;
}

function stampLatest(source, videos) {
  const pattern = /export const LATEST_VIDEOS = \[[\s\S]*?\];/;
  if (!pattern.test(source)) {
    throw new Error("LATEST_VIDEOS block was not found in src/js/site.js");
  }
  const body = videos.map(fallbackRow).join("\n");
  return source.replace(pattern, `export const LATEST_VIDEOS = [\n${body}\n];`);
}

function lf(text) {
  return text.replace(/\r\n/g, "\n");
}

function writeLike(original, next) {
  const body = lf(next);
  return original.includes("\r\n") ? body.replace(/\n/g, "\r\n") : body;
}

let videos;
try {
  videos = await fetchChannelVideos(CHANNEL_ID);
} catch (error) {
  console.error(`YouTube feed failed (${error.message}). Homepage left unchanged.`);
  process.exit(1);
}

if (!videos.length) {
  console.error("YouTube feed returned no videos. Homepage left unchanged.");
  process.exit(1);
}

const latest = videos.slice(0, 8).map((video) => dated({ ...video, title: displayTitle(video.title) }));
const index = fs.readFileSync(indexPath, "utf8");
const site = fs.readFileSync(sitePath, "utf8");
const nextIndex = applyHome(lf(index), latest);
const nextSite = stampLatest(lf(site), latest);
const indexChanged = lf(index) !== nextIndex;
const siteChanged = lf(site) !== nextSite;

for (const video of latest) {
  const when = video.month && video.day ? `${video.length} (day ${video.month}-${video.day})` : video.length;
  console.log(`- ${when} ${video.id} [${video.kind}] ${video.title}`);
}

if (!indexChanged && !siteChanged) {
  console.log("Homepage already matches the latest eight videos.");
  process.exit(0);
}

if (indexChanged) fs.writeFileSync(indexPath, writeLike(index, nextIndex));
if (siteChanged) fs.writeFileSync(sitePath, writeLike(site, nextSite));
console.log("Stamped the homepage and the saved latest list.");
