import {
  AIRSHOWS,
  DEEP_DIVES,
  FEATURED_LONGFORM,
  SITE_URL,
  formatOrdinal,
  monthName,
  youtubeShortThumb,
  youtubeThumb,
} from "../src/js/site.js";
import { eraLabel } from "../src/js/events.js";
import { shortFor } from "../src/js/shorts.js";
import {
  dayPath,
  eventCatalogue,
  eventNeedsHubDay,
  filmById,
  filmsCatalogue,
  hubDayLink,
  hubForEvent,
  hubForTitle,
} from "../src/js/paths.js";

const CSS = "__RIPPLE_CSS__";

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function jsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function metaDesc(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= 180) return clean;
  const cut = clean.slice(0, 177).replace(/\s+\S*$/, "");
  return `${cut}…`;
}

function yearLabel(year) {
  if (year < 0) return `${Math.abs(year)} BC`;
  return String(year);
}

function dateLabel(month, day, year) {
  const date = `${formatOrdinal(day)} ${monthName(month)}`;
  return year === undefined ? date : `${date} ${yearLabel(year)}`;
}

function absolute(path) {
  return `${SITE_URL}${path}`;
}

const NAV = [
  ["/", "Home"],
  ["/on-this-day.html", "Daily Shorts"],
  ["/#deep-dives", "Deep Dives"],
  ["/#airshows", "Airshows"],
  ["/games.html", "Play"],
  ["/shop.html", "Shop"],
  ["/support.html", "Support"],
  ["/about.html", "About"],
];

function shell({ title, description, path, image, imageAlt, body, json }) {
  const url = absolute(path);
  const nav = NAV.map(
    ([href, label]) =>
      `<a class="border-b border-transparent py-1 font-sans text-[0.98rem] text-ink hover:border-ink" href="${href}">${label}</a>`,
  ).join("\n          ");
  return `<!DOCTYPE html>
<html lang="en-GB">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <meta name="author" content="Daniel Sellings">
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
    <meta name="theme-color" content="#050403">
    <link rel="canonical" href="${esc(url)}">
    <link rel="icon" href="/favicon-32.png" type="image/png" sizes="64x64">
    <link rel="stylesheet" href="${CSS}">
    <meta property="og:locale" content="en_GB">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Ripple of History">
    <meta property="og:url" content="${esc(url)}">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:image" content="${esc(image)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@RippleOfHistory">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${esc(image)}">
    <meta name="twitter:image:alt" content="${esc(imageAlt)}">
    <script type="application/ld+json">${jsonLd(json)}</script>
  </head>
  <body>
    <a class="skip" href="#content">Skip to content</a>
    <header class="site-header sticky top-0 z-40 border-b border-rule bg-paper">
      <nav class="relative mx-auto flex h-16 w-full max-w-[72rem] items-center justify-between gap-8 px-5" aria-label="Primary">
        <a class="font-serif text-[1.7rem] leading-none text-ink" href="/">Ripple of History</a>
        <button class="menu-toggle h-11 w-11 place-items-center border border-rule text-ink" type="button" aria-expanded="false" aria-label="Open menu">
          <span></span>
        </button>
        <div class="nav-links gap-7">
          ${nav}
        </div>
      </nav>
    </header>
    <main id="content">
      ${body}
    </main>
    <footer class="site-footer border-t border-rule bg-paper">
      <div class="mx-auto flex w-full max-w-[72rem] flex-wrap items-end justify-between gap-x-8 gap-y-4 px-5 py-8">
        <p class="font-serif text-2xl leading-none text-ink">Ripple of History</p>
        <div class="flex flex-wrap gap-x-5 gap-y-2 font-sans text-sm text-ink">
          <a href="https://www.youtube.com/@RippleOfHistory" target="_blank" rel="noreferrer">YouTube</a>
          <a href="/contact.html">Contact</a>
          <a href="/about.html">About</a>
        </div>
      </div>
      <div class="mx-auto w-full max-w-[72rem] border-t border-rule px-5 py-3 font-sans text-sm text-ink-soft">© <span data-year></span> Daniel Sellings</div>
    </footer>
    <script>
      (function () {
        var toggle = document.querySelector(".menu-toggle");
        if (toggle) {
          toggle.addEventListener("click", function () {
            var open = document.body.classList.toggle("nav-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
          });
        }
        var year = document.querySelector("[data-year]");
        if (year) year.textContent = String(new Date().getFullYear());
      })();
    </script>
  </body>
</html>
`;
}

function videoObject(film, pageUrl) {
  const duration = parseDuration(film.length);
  return {
    "@type": "VideoObject",
    name: film.title,
    description: film.blurb || film.title,
    thumbnailUrl: youtubeThumb(film.id, true),
    embedUrl: `https://www.youtube-nocookie.com/embed/${film.id}?rel=0`,
    url: pageUrl,
    publisher: { "@type": "Organization", name: "Ripple of History", url: SITE_URL },
    isFamilyFriendly: true,
    ...(duration ? { duration } : {}),
  };
}

function parseDuration(length) {
  if (!length || !/^\d+:\d+$/.test(length)) return "";
  const [minutes, seconds] = length.split(":").map(Number);
  return `PT${minutes}M${seconds}S`;
}

function shortBlock(month, day) {
  const short = shortFor(month, day);
  if (!short) return "";
  const title = short.title || `Daily short, ${dateLabel(month, day)}`;
  return `
    <figure class="entry-short">
      <div class="entry-frame is-short">
        <iframe src="https://www.youtube-nocookie.com/embed/${esc(short.id)}?rel=0" title="${esc(title)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>
      <figcaption>The daily short. ${esc(title)}</figcaption>
    </figure>`;
}

function entryList(events, { showYear = true } = {}) {
  if (!events.length) return "<p class=\"entry-blurb\">Nothing filed for this date yet.</p>";
  return `<ul class="entry-list">${events
    .map((event) => {
      const year = showYear ? `<span class="entry-year">${esc(yearLabel(event.y))}</span> ` : "";
      return `<li><a href="${esc(event.path)}">${year}${esc(event.title)}</a><p>${esc(event.blurb)}</p></li>`;
    })
    .join("")}</ul>`;
}

export function eventPage(event) {
  const when = dateLabel(event.m, event.d, event.y);
  const title = `${event.title}, ${when} | Ripple of History`;
  const description = metaDesc(event.blurb);
  const hub = hubForEvent(event) || (eventNeedsHubDay(event) ? hubDayLink(event.m, event.d) : null);
  const siblings = (eventCatalogue().byDay.get(`${String(event.m).padStart(2, "0")}-${String(event.d).padStart(2, "0")}`) || [])
    .filter((item) => item.path !== event.path);
  const film = event.video ? filmById(event.video) : null;
  const crumbs = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
      { "@type": "ListItem", position: 2, name: "On This Day", item: absolute("/on-this-day.html") },
      { "@type": "ListItem", position: 3, name: dateLabel(event.m, event.d), item: absolute(dayPath(event.m, event.d)) },
      { "@type": "ListItem", position: 4, name: event.title, item: absolute(event.path) },
    ],
  };
  const body = `
    <article class="entry">
      <p class="entry-kicker"><a href="/on-this-day.html#${esc(String(event.m).padStart(2, "0"))}-${esc(String(event.d).padStart(2, "0"))}">Calendar</a> · <a href="${esc(dayPath(event.m, event.d))}">${esc(dateLabel(event.m, event.d))}</a></p>
      <h1>${esc(event.title)}</h1>
      <p class="entry-meta">${esc(when)}${event.loc ? ` · ${esc(event.loc)}` : ""} · ${esc(eraLabel(event.era))}</p>
      <p class="entry-blurb">${esc(event.blurb)}</p>
      ${event.more ? `<p class="entry-blurb">${esc(event.more)}</p>` : ""}
      ${shortBlock(event.m, event.d)}
      ${film ? `<p class="entry-hub"><a href="${esc(film.path)}">${esc(film.title)}</a></p>` : ""}
      ${event.video && !film ? `<p class="entry-hub"><a href="https://www.youtube.com/watch?v=${esc(event.video)}">Watch the long-form take</a></p>` : ""}
      ${hub ? `<p class="entry-hub"><a href="${esc(hub.href)}">${esc(hub.label)}</a></p>` : ""}
      <p class="entry-back"><a href="/on-this-day.html#${esc(String(event.m).padStart(2, "0"))}-${esc(String(event.d).padStart(2, "0"))}">Back to the calendar</a></p>
      ${siblings.length ? `<h2>Also on this day</h2>${entryList(siblings)}` : ""}
    </article>`;
  return shell({
    title,
    description,
    path: event.path,
    image: `${SITE_URL}/images/on-this-day.jpg`,
    imageAlt: `${event.title}, ${when}`,
    body,
    json: {
      "@context": "https://schema.org",
      "@graph": [
        crumbs,
        {
          "@type": "Article",
          headline: `${event.title}, ${when}`,
          description,
          inLanguage: "en-GB",
          author: { "@type": "Person", name: "Daniel Sellings" },
          publisher: { "@type": "Organization", name: "Ripple of History", url: SITE_URL },
          mainEntityOfPage: absolute(event.path),
        },
      ],
    },
  });
}

export function dayPage(month, day) {
  const key = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const events = eventCatalogue().byDay.get(key) || [];
  const path = dayPath(month, day);
  const heading = dateLabel(month, day);
  const title = `On this day, ${heading} | Ripple of History`;
  const description = metaDesc(
    events[0]?.blurb || `Entries for ${heading} from the Ripple of History calendar.`,
  );
  const hub = events.some((event) => event.era === "ww2" && event.y >= 1939 && event.y <= 1945)
    ? hubDayLink(month, day)
    : null;
  const body = `
    <article class="entry">
      <p class="entry-kicker"><a href="/on-this-day.html#${key}">Calendar</a></p>
      <h1>${esc(heading)}</h1>
      <p class="entry-blurb">Each entry has its own page. The calendar is still the way to browse the year.</p>
      ${shortBlock(month, day)}
      ${hub ? `<p class="entry-hub"><a href="${esc(hub.href)}">${esc(hub.label)}</a></p>` : ""}
      <h2>The entries</h2>
      ${entryList(events)}
    </article>`;
  return shell({
    title,
    description,
    path,
    image: `${SITE_URL}/images/on-this-day.jpg`,
    imageAlt: `On this day, ${heading}`,
    body,
    json: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: absolute(path),
      isPartOf: absolute("/on-this-day.html"),
    },
  });
}

function filmFrame(film) {
  return `
    <div class="entry-frame">
      <iframe src="https://www.youtube-nocookie.com/embed/${esc(film.id)}?rel=0" title="${esc(film.title)}" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
    </div>`;
}

export function filmPage(film) {
  const title = `${film.title} | Ripple of History`;
  const description = metaDesc(film.blurb);
  const hub = hubForTitle(film.title);
  const pageUrl = absolute(film.path);
  const body = `
    <article class="entry">
      <p class="entry-kicker"><a href="/films.html">Films</a> · <a href="${esc(film.seriesPath)}">${esc(film.seriesTitle)}</a></p>
      <h1>${esc(film.title)}</h1>
      <p class="entry-meta">${esc([film.tag, film.length].filter(Boolean).join(" · "))}</p>
      <p class="entry-blurb">${esc(film.blurb)}</p>
      ${filmFrame(film)}
      <p class="entry-hub"><a href="https://www.youtube.com/watch?v=${esc(film.id)}">Watch on YouTube</a></p>
      ${hub ? `<p class="entry-hub"><a href="${esc(hub.href)}">${esc(hub.label)}</a></p>` : ""}
    </article>`;
  return shell({
    title,
    description,
    path: film.path,
    image: youtubeThumb(film.id, true),
    imageAlt: film.title,
    body,
    json: { "@context": "https://schema.org", ...videoObject(film, pageUrl) },
  });
}

export function seriesPage(group) {
  const title = `${group.title} | Ripple of History`;
  const description = metaDesc(group.blurb);
  const pageUrl = absolute(group.path);
  const body = `
    <article class="entry">
      <p class="entry-kicker"><a href="/films.html">Films</a></p>
      <h1>${esc(group.title)}</h1>
      <p class="entry-blurb">${esc(group.blurb)}</p>
      <ul class="entry-list">${group.films
        .map(
          (film) =>
            `<li><a href="${esc(film.path)}">${esc(film.title)}</a><p>${esc(film.blurb)}</p></li>`,
        )
        .join("")}</ul>
    </article>`;
  return shell({
    title,
    description,
    path: group.path,
    image: group.films[0] ? youtubeThumb(group.films[0].id, true) : `${SITE_URL}/images/hero-banner.jpg`,
    imageAlt: group.title,
    body,
    json: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: group.title,
      description: group.blurb,
      url: pageUrl,
      itemListElement: group.films.map((film, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absolute(film.path),
        item: videoObject(film, absolute(film.path)),
      })),
    },
  });
}

export function cataloguePage() {
  const { series } = filmsCatalogue();
  const title = "Films | Ripple of History";
  const description = "Forgotten Voices, the Churchill speeches, Airbourne 2026, and the site visits.";
  const body = `
    <article class="entry">
      <p class="entry-kicker"><a href="/">Home</a></p>
      <h1>Films</h1>
      <p class="entry-blurb">Four series. The write-up stays short. The picture is the point.</p>
      <ul class="entry-list">${series
        .map(
          (group) =>
            `<li><a href="${esc(group.path)}">${esc(group.title)}</a><p>${esc(group.blurb)}</p></li>`,
        )
        .join("")}</ul>
    </article>`;
  return shell({
    title,
    description,
    path: "/films.html",
    image: `${SITE_URL}/images/hero-banner.jpg`,
    imageAlt: "Ripple of History films",
    body,
    json: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: absolute("/films.html"),
    },
  });
}

export function buildPages() {
  const pages = new Map();
  pages.set("/films.html", cataloguePage());
  for (const group of filmsCatalogue().series) pages.set(group.path, seriesPage(group));
  for (const film of filmsCatalogue().films) pages.set(film.path, filmPage(film));
  for (const [key, events] of eventCatalogue().byDay) {
    const [month, day] = key.split("-").map(Number);
    pages.set(dayPath(month, day), dayPage(month, day));
    for (const event of events) pages.set(event.path, eventPage(event));
  }
  return pages;
}

const MONTH_WORD =
  "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec";

export function rippleHeadline(title) {
  const headline = String(title || "")
    .replace(/^on this day(?: in history)?\.?\s*/i, "")
    .replace(new RegExp(`^(?:${MONTH_WORD})\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?\\.?\\s*`, "i"), "")
    .trim();
  return headline || title;
}

function playButton(video, className) {
  const kind = video.kind === "short" ? ` data-kind="short"` : "";
  return `<button class="${className}" type="button" data-play="${esc(video.id)}"${kind} aria-label="Play ${esc(video.title)}">`;
}

export function rippleCards(videos) {
  return videos
    .map((video) => {
      const headline = rippleHeadline(video.title);
      const date = `${video.day} ${monthName(video.month, false)}`;
      const href = dayPath(video.month, video.day);
      const src = youtubeShortThumb(video.id);
      const fallback = youtubeThumb(video.id);
      return `
            <article class="ripple-card">
              ${playButton(video, "ripple-still")}
                <img src="${src}" alt="${esc(video.title)}" width="480" height="640" onerror="this.onerror=null;this.src='${fallback}'">
              </button>
              <p class="ripple-date"><a href="${href}">${esc(date)}</a></p>
              <h3><a href="${href}">${esc(headline)}</a></h3>
            </article>`;
    })
    .join("");
}

export function videoCards(videos, { large = false } = {}) {
  return videos
    .map((video) => {
      const isShort = video.kind === "short";
      const src = isShort ? youtubeShortThumb(video.id) : youtubeThumb(video.id, large);
      const fallback = youtubeThumb(video.id);
      const meta = [video.tag, video.length].filter(Boolean).join(" · ");
      const film = filmById(video.id);
      const title = film
        ? `<a href="${esc(film.path)}">${esc(video.title)}</a>`
        : esc(video.title);
      return `
        <article class="video-card${large ? " is-featured" : ""}${isShort ? " is-short" : ""}">
          ${playButton(video, "thumb")}
            <img src="${src}" alt="${esc(video.title)}" width="${isShort ? 480 : large ? 1280 : 640}" height="${isShort ? 854 : large ? 720 : 400}" onerror="this.onerror=null;this.src='${fallback}'">
            <span class="play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5v11l10-5.5L3 1.5z"/></svg></span>
          </button>
          <div class="video-meta">
            <span class="tag">${esc(meta)}</span>
            <h3>${title}</h3>
            ${video.blurb && large ? `<p>${esc(video.blurb)}</p>` : ""}
            ${large ? `<button class="btn btn-gold play-inline" type="button" data-play="${esc(video.id)}">Play episode</button>` : ""}
          </div>
        </article>`;
    })
    .join("");
}

function spotStill(video, large) {
  const src = youtubeThumb(video.id, large);
  const fallback = youtubeThumb(video.id, false);
  const size = large ? 11 : 8;
  return `
    <span class="spot-still">
      <img src="${src}" alt="${esc(video.title)}" width="${large ? 1280 : 480}" height="${large ? 720 : 270}" onerror="this.onerror=null;this.src='${fallback}'">
      <span class="spot-mark${large ? "" : " is-compact"}" aria-hidden="true"><svg width="${size}" height="${size}" viewBox="0 0 12 12" fill="currentColor"><path d="M2.2 1.1v9.8L10.6 6 2.2 1.1z"/></svg></span>
    </span>`;
}

function spotTitle(video) {
  const film = filmById(video.id);
  const title = esc(video.title);
  return film ? `<a href="${esc(film.path)}">${title}</a>` : title;
}

export function spotlightHtml(lead, related) {
  if (!lead) return "";
  const meta = esc([lead.tag, lead.length].filter(Boolean).join(" · "));
  const rows = related.filter(Boolean).map((video) => `
      <li>
        <button class="spot-hit" type="button" data-play="${esc(video.id)}" aria-label="Play ${esc(video.title)}">
          ${spotStill(video, false)}
          <span class="spot-row-copy">
            <span class="spot-meta">${esc([video.tag, video.length].filter(Boolean).join(" · "))}</span>
            <span class="spot-row-title">${spotTitle(video)}</span>
          </span>
        </button>
      </li>`).join("");
  return `
    <div class="spotlight">
      <article class="spotlight-lead">
        <button class="spot-hit" type="button" data-play="${esc(lead.id)}" aria-label="Play ${esc(lead.title)}">
          ${spotStill(lead, true)}
        </button>
        <p class="spot-kicker">${meta}</p>
        <h3>${spotTitle(lead)}</h3>
        ${lead.blurb ? `<p class="spot-blurb">${esc(lead.blurb)}</p>` : ""}
      </article>
      <ul class="spotlight-list">${rows}</ul>
    </div>`;
}

export function fillMarker(html, name, inner) {
  const pattern = new RegExp(`<!-- ${name} -->[\\s\\S]*?<!-- /${name} -->`);
  if (!pattern.test(html)) return html;
  return html.replace(pattern, `<!-- ${name} -->\n${inner}\n<!-- /${name} -->`);
}

function pickVideo(id) {
  return (
    filmById(id) ||
    FEATURED_LONGFORM.find((video) => video.id === id) ||
    DEEP_DIVES.find((video) => video.id === id) ||
    AIRSHOWS.find((video) => video.id === id) ||
    null
  );
}

export function homeParts(latest) {
  const shorts = latest.filter((video) => video.kind === "short" && video.month && video.day).slice(0, 5);
  const pick = pickVideo;
  return {
    "ripple-rail": rippleCards(shorts),
    "latest-rail": videoCards(latest.slice(0, 8)),
    "airshow-feature": videoCards([pick("mK0XAP6jM2U")].filter(Boolean), { large: true }),
    airshows: videoCards(filmsCatalogue().series.find((item) => item.slug === "airbourne-2026").films.slice(1)),
    "long-films": spotlightHtml(pick("BcU5deW_Nys"), ["KtxDaEX3-Sc", "NZzgGn0Icx8", "4H6sNVihsQw"].map(pick)),
    voices: spotlightHtml(pick("K-Y2gQodq6I"), ["3Cd0_aBSK8w", "QVxGPC4LUT8", "O7klZ8fY2MA"].map(pick)),
  };
}

export function applyHome(html, latest) {
  const parts = homeParts(latest);
  let next = html;
  for (const [name, inner] of Object.entries(parts)) next = fillMarker(next, name, inner);
  return next;
}

export function sitemapVideo(film) {
  const description = esc(film.blurb || film.title);
  return `    <video:video>
      <video:thumbnail_loc>${esc(youtubeThumb(film.id))}</video:thumbnail_loc>
      <video:title>${esc(film.title)}</video:title>
      <video:description>${description}</video:description>
      <video:player_loc>https://www.youtube.com/embed/${esc(film.id)}</video:player_loc>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>`;
}
