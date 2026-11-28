import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHANNEL_ID, LATEST_VIDEOS, SITE_URL } from "../src/js/site.js";
import { hydrateShorts } from "../src/js/shorts.js";
import { displayTitle, fetchChannelVideos, onThisDayMapFromVideos, parseOnThisDayDate } from "./youtube-feed.js";
import { applyHome, buildPages, sitemapVideo } from "./page-html.js";
import { filmsCatalogue } from "../src/js/paths.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS_TOKEN = "__RIPPLE_CSS__";

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function dated(video) {
  const parsed = parseOnThisDayDate(video.title);
  return parsed ? { ...video, month: parsed.month, day: parsed.day } : video;
}

export function pagesPlugin() {
  let pages = new Map();
  let latest = LATEST_VIDEOS.map(dated);
  let ready;
  let cssFile = "/src/css/styles.css";

  function ensure() {
    if (!ready) ready = load();
    return ready;
  }

  async function load() {
    try {
      const videos = await withTimeout(fetchChannelVideos(CHANNEL_ID), 8000);
      hydrateShorts(onThisDayMapFromVideos(videos));
      latest = videos.slice(0, 8).map((video) => dated({ ...video, title: displayTitle(video.title) }));
    } catch (error) {
      console.warn(`[ripple-pages] YouTube feed skipped (${error.message}). Using the saved latest list.`);
    }
    pages = buildPages();
    console.log(`[ripple-pages] ${pages.size} pages`);
  }

  function writeSitemap(outDir) {
    const sitemapPath = path.join(outDir, "sitemap.xml");
    const source = fs.existsSync(sitemapPath) ? sitemapPath : path.join(root, "public", "sitemap.xml");
    let xml = fs.readFileSync(source, "utf8");
    xml = xml.replace(/https:\/\/(?!www\.)rippleofhistory\.com/g, SITE_URL);
    const lastmod = new Date().toISOString().slice(0, 10);
    const existing = new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
    const filmPaths = new Map(filmsCatalogue().films.map((film) => [film.path, film]));
    const blocks = [];
    for (const route of pages.keys()) {
      const loc = `${SITE_URL}${route}`;
      if (existing.has(loc)) continue;
      const film = filmPaths.get(route);
      const video = film ? `\n${sitemapVideo(film)}\n` : "\n";
      blocks.push(`  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>${video}  </url>`);
    }
    if (!xml.includes("</urlset>")) return;
    xml = xml.replace("</urlset>", `${blocks.join("\n")}\n</urlset>`);
    fs.writeFileSync(sitemapPath, xml);
  }

  return {
    name: "ripple-pages",
    async transformIndexHtml(html, ctx) {
      const filename = ctx?.filename || "";
      if (!filename.endsWith(`${path.sep}index.html`)) return html;
      await ensure();
      return applyHome(html, latest);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = decodeURIComponent(new URL(req.url || "/", "http://127.0.0.1").pathname);
        const generated = pathname === "/films.html" || pathname.startsWith("/films/") || pathname.startsWith("/on-this-day/");
        if (!generated) return next();
        ensure()
          .then(() => {
            const page = pages.get(pathname);
            if (!page || (req.method !== "GET" && req.method !== "HEAD")) return next();
            res.statusCode = 200;
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(page.replaceAll(CSS_TOKEN, "/src/css/styles.css"));
          })
          .catch(next);
      });
    },
    generateBundle(_options, bundle) {
      const css = Object.values(bundle).find((file) => file.type === "asset" && String(file.fileName).endsWith(".css"));
      if (css) cssFile = `/${css.fileName}`;
    },
    async writeBundle(options) {
      await ensure();
      const outDir = options.dir;
      if (!outDir) return;
      for (const [route, page] of pages) {
        const dest = path.join(outDir, route.replace(/^\//, ""));
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, page.replaceAll(CSS_TOKEN, cssFile));
      }
      writeSitemap(outDir);
    },
  };
}
