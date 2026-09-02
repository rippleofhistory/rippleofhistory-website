const FEED = (channelId) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

const MONTHS = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const MONTH_PATTERN = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");

function decodeXml(value) {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function tagFor(title, isShort) {
  const text = title.toLowerCase();
  if (isShort || /on this day|#onthisday/.test(text)) return "Short";
  if (/forgotten voices/.test(text)) return "Deep dive";
  if (/churchill|finest hour|the few|beaches|full speech/.test(text)) return "Speech";
  if (/airbourne|airshow|westham|church|fortress|martello/.test(text)) return "Site visit";
  if (/\bgrok\b| vs |tank|hurricane|spitfire|general/.test(text)) return "Debate";
  return "Long-form";
}

function formatPublished(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-GB", { day: "numeric", month: "short" });
}

export function displayTitle(title) {
  return String(title)
    .replace(/#(?:onthisday|history|shorts)\b/gi, "")
    .replace(/#(\w+)/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,])/g, "$1")
    .replace(/^(?:in\s+)+/i, "")
    .trim();
}

export function parseOnThisDayDate(title) {
  const text = String(title).toLowerCase();
  const monthDay = text.match(new RegExp(`\\b(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  if (monthDay) {
    const month = MONTHS[monthDay[1]];
    const day = Number(monthDay[2]);
    if (month && day >= 1 && day <= 31) return { month, day };
  }
  const dayMonth = text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_PATTERN})\\b`));
  if (dayMonth) {
    const day = Number(dayMonth[1]);
    const month = MONTHS[dayMonth[2]];
    if (month && day >= 1 && day <= 31) return { month, day };
  }
  return null;
}

export function isOnThisDayVideo(title, isShort) {
  const text = String(title).toLowerCase();
  if (/airbourne|substack/.test(text)) return false;
  if (/forgotten voices/.test(text) && !/on this day|#onthisday/.test(text)) return false;
  if (/#onthisday|\bon this day\b/.test(text)) return true;
  return Boolean(isShort && parseOnThisDayDate(title));
}

export function calendarKey(month, day) {
  return `${Number(month)}-${Number(day)}`;
}

function publishedParts(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return { month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

export async function fetchChannelVideos(channelId) {
  const response = await fetch(FEED(channelId), {
    headers: { "User-Agent": "RippleOfHistorySite/1.0" },
  });
  if (!response.ok) {
    throw new Error(`YouTube feed ${response.status}`);
  }
  const xml = await response.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  const videos = [];

  for (const match of entries) {
    const block = match[1];
    const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const rawTitle = block.match(/<title>([^<]+)<\/title>/)?.[1];
    const href = block.match(/<link[^>]*href="([^"]+)"/)?.[1] || "";
    const published = block.match(/<published>([^<]+)<\/published>/)?.[1];
    if (!id || !rawTitle) continue;
    const title = decodeXml(rawTitle);
    const isShort = href.includes("/shorts/");
    videos.push({
      id,
      title,
      tag: tagFor(title, isShort),
      length: formatPublished(published),
      kind: isShort ? "short" : "video",
      published,
    });
  }

  return videos;
}

export async function fetchLatestVideos(channelId, limit = 8) {
  const videos = await fetchChannelVideos(channelId);
  return videos.slice(0, limit).map(({ published, ...video }) => video);
}

export function onThisDayMapFromVideos(videos, archive = {}) {
  const map = { ...archive };
  const list = Array.isArray(videos) ? videos : [];

  for (const video of [...list].reverse()) {
    if (!video?.id) continue;
    const title = video.title || "";
    const isShort = video.kind === "short";
    if (!isOnThisDayVideo(title, isShort)) continue;
    const parsed = parseOnThisDayDate(title) || publishedParts(video.published);
    if (!parsed) continue;
    map[calendarKey(parsed.month, parsed.day)] = {
      id: video.id,
      title: displayTitle(title),
    };
  }

  return map;
}
