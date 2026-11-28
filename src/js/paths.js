import { eventsFor } from "./events.js";
import { AIRSHOWS, DEEP_DIVES, FEATURED_LONGFORM, VIDEOS, pad } from "./site.js";

const HUB = "https://www.ww2hub.net";

export function slugify(value) {
  const slug = String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72)
    .replace(/-+$/g, "");
  return slug || "entry";
}

function yearPart(year) {
  return year < 0 ? `bce-${Math.abs(year)}` : String(year);
}

function daysInMonth(month) {
  return new Date(2024, month, 0).getDate();
}

let eventCache;

export function eventCatalogue() {
  if (eventCache) return eventCache;
  const used = new Set();
  const events = [];
  const byDay = new Map();

  for (let month = 1; month <= 12; month += 1) {
    const count = daysInMonth(month);
    for (let day = 1; day <= count; day += 1) {
      const key = `${pad(month)}-${pad(day)}`;
      const dayEvents = [];
      for (const event of eventsFor(month, day)) {
        const base = `${yearPart(event.y)}-${key}-${slugify(event.title)}`;
        let slug = base;
        let n = 2;
        while (used.has(slug)) {
          slug = `${base}-${n}`;
          n += 1;
        }
        used.add(slug);
        const record = { ...event, slug, path: `/on-this-day/${slug}.html` };
        events.push(record);
        dayEvents.push(record);
      }
      byDay.set(key, dayEvents);
    }
  }

  eventCache = { events, byDay };
  return eventCache;
}

export function dayPath(month, day) {
  return `/on-this-day/${pad(month)}-${pad(day)}.html`;
}

export function pathForEvent(event) {
  const list = eventCatalogue().byDay.get(`${pad(event.m)}-${pad(event.d)}`) || [];
  const found = list.find((item) => item.y === event.y && item.title === event.title);
  return found?.path || "";
}

function hubMatch(title) {
  const text = String(title || "").toLowerCase();
  const rules = [
    [/\bdunkirk\b/, "/battle/dunkirk", "Dunkirk on WW2 Hub"],
    [/\bbattle of britain\b|\bthe few\b/, "/battle/battle-of-britain", "The Battle of Britain on WW2 Hub"],
    [/\bnormandy\b|\bd-day\b|\boverlord\b/, "/battle/normandy", "Normandy on WW2 Hub"],
    [/\bdieppe\b/, "/battle/dieppe", "Dieppe on WW2 Hub"],
    [/\bstalingrad\b|\boperation uranus\b/, "/battle/stalingrad", "Stalingrad on WW2 Hub"],
    [/\bbulge\b|\bardennes\b/, "/battle/bulge", "The Bulge on WW2 Hub"],
    [/\bpearl\b/, "/battle/pearl-harbor", "Pearl Harbor on WW2 Hub"],
    [/\bmidway\b/, "/battle/midway", "Midway on WW2 Hub"],
    [/\bberlin\b(?![\s\S]*\braid\b)/, "/battle/berlin", "Berlin on WW2 Hub"],
    [/\bchurchill\b|\bfinest hour\b|\bwe shall fight\b/, "/person/hist-churchill", "Churchill on WW2 Hub"],
  ];
  for (const [pattern, path, label] of rules) {
    if (pattern.test(text)) return { href: `${HUB}${path}`, label };
  }
  return null;
}

export function hubForTitle(title) {
  return hubMatch(title);
}

export function hubForEvent(event) {
  return hubMatch(event.title);
}

export function hubDayLink(month, day) {
  return {
    href: `${HUB}/on-this-day?month=${month}&day=${day}`,
    label: "This date on WW2 Hub",
  };
}

export function eventNeedsHubDay(event) {
  return event.era === "ww2" && event.y >= 1939 && event.y <= 1945 && !hubMatch(event.title);
}

function richest(id) {
  const sources = [VIDEOS, FEATURED_LONGFORM, AIRSHOWS, DEEP_DIVES]
    .map((list) => list.find((item) => item.id === id))
    .filter(Boolean);
  const film = { id, title: "", tag: "", length: "", blurb: "", kind: "" };
  for (const source of sources) {
    if (!film.title) film.title = source.title;
    if (!film.tag) film.tag = source.tag || "";
    if (!film.length) film.length = source.length || "";
    if (!film.blurb && source.blurb) film.blurb = source.blurb;
    if (!film.kind && source.kind) film.kind = source.kind;
  }
  const full = VIDEOS.find((item) => item.id === id);
  if (full?.title) film.title = full.title;
  if (full?.blurb) film.blurb = full.blurb;
  if (!film.blurb) film.blurb = film.title;
  return film;
}

function unique(ids) {
  const seen = new Set();
  return ids.filter((id) => {
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

let filmCache;

export function filmsCatalogue() {
  if (filmCache) return filmCache;
  const series = [
    {
      slug: "forgotten-voices",
      title: "Forgotten Voices of WW2",
      blurb: "They were there. Outbreak to the Battle of Britain, told in order.",
      ids: DEEP_DIVES.map((video) => video.id),
    },
    {
      slug: "churchill-speeches",
      title: "Churchill speeches",
      blurb: "The full speeches, not the lines on the tea towels.",
      ids: ["BcU5deW_Nys", "KtxDaEX3-Sc", "30oVQx89fHk"],
    },
    {
      slug: "airbourne-2026",
      title: "Airbourne 2026",
      blurb: "Eastbourne seafront, 2026. Friday, Saturday, Sunday, and the aircraft that made the noise.",
      ids: AIRSHOWS.map((video) => video.id),
    },
    {
      slug: "site-visits",
      title: "Site visits",
      blurb: "Churches, fortresses, and the places the films were actually shot.",
      ids: unique([
        "NZzgGn0Icx8",
        "HovqTcqS22k",
        ...VIDEOS.filter((video) => video.filter === "visit" && !/airbourne/i.test(video.title)).map((video) => video.id),
      ]),
    },
  ];

  const used = new Set(series.map((item) => item.slug));
  const films = [];
  for (const group of series) {
    group.path = `/films/${group.slug}.html`;
    group.films = group.ids.map((id) => {
      const film = richest(id);
      let slug = slugify(film.title);
      let n = 2;
      while (used.has(slug)) {
        slug = `${slugify(film.title)}-${n}`;
        n += 1;
      }
      used.add(slug);
      const record = {
        ...film,
        slug,
        path: `/films/${slug}.html`,
        seriesSlug: group.slug,
        seriesTitle: group.title,
        seriesPath: group.path,
      };
      films.push(record);
      return record;
    });
  }

  filmCache = { series, films, byId: new Map(films.map((film) => [film.id, film])) };
  return filmCache;
}

export function filmById(id) {
  return filmsCatalogue().byId.get(id) || null;
}

export function filmPathForId(id) {
  return filmById(id)?.path || "";
}
