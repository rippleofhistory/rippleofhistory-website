const FEED = (channelId) =>
  `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

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

export async function fetchLatestVideos(channelId, limit = 8) {
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
    });
    if (videos.length >= limit) break;
  }

  return videos;
}
