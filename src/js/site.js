export const SITE_URL = "https://rippleofhistory.com";
export const SITE_NAME = "Ripple of History";
export const CHANNEL_ID = "UClKb54sR_nVBVudB9JoE81g";

export const LINKS = {
  youtube: "https://www.youtube.com/@RippleOfHistory",
  x: "https://x.com/RippleOfHistory",
  substack: "https://rippleofhistory.substack.com/",
  coffee: "https://buymeacoffee.com/rippleofhistory",
  email: "mailto:rippleofhistory@gmail.com",
};

/**
 * Swap these YouTube IDs to change what appears on the landing page.
 * Thumbnails and embeds update automatically from `id`.
 *
 * Landing "Featured Long-Form" — keep 6–8 entries.
 */
export const FEATURED_LONGFORM = [
  {
    id: "BcU5deW_Nys",
    title: "Churchill: Their Finest Hour",
    tag: "Speech",
    length: "29:54",
    blurb: "18 June 1940. The full speech — not the clip they put on tea towels.",
  },
  {
    id: "NZzgGn0Icx8",
    title: "Oldest Norman Church in England",
    tag: "Site visit",
    length: "21:29",
    blurb: "St Mary the Virgin, Westham. William’s first night in England, a Norman door, and a plague pit in the yard.",
  },
  {
    id: "UrsFPWUp3EQ",
    title: "Best American Civil War General? Me vs Grok",
    tag: "Debate",
    length: "24:38",
    blurb: "Grant, Lee, and a machine with opinions. Twenty-four minutes of disagreement.",
  },
  {
    id: "ARcAMgP8Y5s",
    title: "Spitfire vs Hurricane",
    tag: "Debate",
    length: "17:49",
    blurb: "The eternal argument, with Grok in the other chair. Battle of Britain, properly rowed.",
  },
  {
    id: "4H6sNVihsQw",
    title: "Best WW2 Tank? Me vs Grok",
    tag: "Debate",
    length: "23:59",
    blurb: "Grok says the T-34 is the GOAT. I say no.",
  },
  {
    id: "K-Y2gQodq6I",
    title: "Forgotten Voices of WW2, Part 1",
    tag: "Deep dive",
    length: "41:37",
    blurb: "1939. The lights go out. The people who were actually there.",
  },
  {
    id: "KtxDaEX3-Sc",
    title: 'Churchill: "The Few"',
    tag: "Speech",
    length: "33:22",
    blurb: "Never in the field of human conflict… the whole speech, not the soundbite.",
  },
  {
    id: "ZHaWSWsT9fc",
    title: "Forgotten Voices — Dunkirk",
    tag: "Deep dive",
    length: "41:13",
    blurb: "A colossal defeat that somehow became a miracle.",
  },
];

/** Eastbourne Airbourne — long-form days plus standout aircraft. */
export const AIRSHOWS = [
  {
    id: "mK0XAP6jM2U",
    title: "Airbourne 2026 — Sunday, Eastbourne",
    tag: "Airshow",
    length: "37:00",
    blurb: "Merlins over the Channel. The Sunday display from Eastbourne’s seafront — history, still flying.",
  },
  {
    id: "GT6g3jvULNo",
    title: "Airbourne 2026 — Saturday, Eastbourne",
    tag: "Airshow",
    length: "30:20",
    blurb: "The Saturday programme from Airbourne. Still making a mess of the sky.",
  },
  {
    id: "6dqgh0vaGZk",
    title: "Airbourne 2026 — Friday, Eastbourne",
    tag: "Airshow",
    length: "31:39",
    blurb: "Opening day on the seafront. Spitfires, the crowd, and a very loud argument with the weather.",
  },
  {
    id: "oxGRUTzv3gY",
    title: "RAF Typhoon — Airbourne 2026",
    tag: "Airshow",
    length: "6:08",
    blurb: "The Typhoon display over Eastbourne. Loud, fast, and not remotely civilian.",
  },
  {
    id: "0gLS8f7Rojw",
    title: "Battle of Britain Memorial Flight at Airbourne",
    tag: "Airshow",
    kind: "short",
  },
  {
    id: "I_yZaQN9EGw",
    title: "P-51D Mustang Marinell",
    tag: "Airshow",
    kind: "short",
  },
  {
    id: "9wIpbs8VH4g",
    title: "Royal Navy Black Cats",
    tag: "Airshow",
    kind: "short",
  },
];

/** Forgotten Voices series + Battle of Britain. */
export const DEEP_DIVES = [
  { id: "K-Y2gQodq6I", title: "Part 1 — 1939 Outbreak", tag: "Forgotten Voices", length: "41:37" },
  { id: "3Cd0_aBSK8w", title: "Part 2 — Phoney War", tag: "Forgotten Voices", length: "22:53" },
  { id: "QVxGPC4LUT8", title: "Part 3 — Norway 1940", tag: "Forgotten Voices", length: "26:24" },
  { id: "O7klZ8fY2MA", title: "Part 4 — Fall of France", tag: "Forgotten Voices", length: "27:40" },
  { id: "ZHaWSWsT9fc", title: "Part 5 — Dunkirk", tag: "Forgotten Voices", length: "41:13" },
  { id: "qbuXRiEbGFo", title: "Battle of Britain 1940", tag: "Forgotten Voices", length: "29:46" },
];

/** Fallback if the live YouTube feed cannot be reached. */
export const LATEST_VIDEOS = [
  { id: "qbuXRiEbGFo", title: "Battle of Britain 1940 — Forgotten Voices", tag: "Deep dive", length: "29:46" },
  { id: "KtxDaEX3-Sc", title: 'Churchill: "The Few"', tag: "Speech", length: "33:22" },
  { id: "mK0XAP6jM2U", title: "Airbourne 2026 — Sunday", tag: "Site visit", length: "37:00" },
  { id: "GT6g3jvULNo", title: "Airbourne 2026 — Saturday", tag: "Site visit", length: "30:20" },
  { id: "6dqgh0vaGZk", title: "Airbourne 2026 — Friday", tag: "Site visit", length: "31:39" },
  { id: "FH5VOLQutPQ", title: "Andy Burnham — King of the North?", tag: "Debate", length: "10:23" },
  { id: "HovqTcqS22k", title: "What Would Nelson Think of the Navy?", tag: "Debate", length: "7:08" },
  { id: "30oVQx89fHk", title: "We Shall Fight on the Beaches", tag: "Speech", length: "24:09" },
];

export const VIDEO_FILTERS = [
  { id: "all", label: "All long-form" },
  { id: "voices", label: "Forgotten Voices" },
  { id: "speech", label: "Speeches" },
  { id: "visit", label: "Site visits" },
  { id: "debate", label: "Debates" },
];

export const VIDEOS = [
  {
    id: "BcU5deW_Nys",
    title: "Churchill: Their Finest Hour",
    tag: "Speech",
    filter: "speech",
    length: "29:54",
    featured: true,
    blurb: "18 June 1940. France is falling. The full speech — not the clip they put on tea towels. If the Empire lasts a thousand years, men will still say this was its finest hour.",
  },
  {
    id: "K-Y2gQodq6I",
    title: "Forgotten Voices of WW2, Part 1 — 1939 Outbreak",
    tag: "Deep dive",
    filter: "voices",
    length: "41:37",
    blurb: "The lights go out. Readings from the people who were actually there when the balloon went up.",
  },
  {
    id: "ZHaWSWsT9fc",
    title: "Forgotten Voices of WW2, Part 5 — Dunkirk",
    tag: "Deep dive",
    filter: "voices",
    length: "41:13",
    blurb: "A colossal defeat that somehow became a miracle. The little ships, the beaches, and the men who made it home without their guns.",
  },
  {
    id: "mK0XAP6jM2U",
    title: "Airbourne 2026 — Sunday, Eastbourne",
    tag: "Site visit",
    filter: "visit",
    length: "37:00",
    blurb: "Merlins over the Channel. The Sunday display from Eastbourne’s seafront airshow.",
  },
  {
    id: "KtxDaEX3-Sc",
    title: 'Churchill: "The Few"',
    tag: "Speech",
    filter: "speech",
    length: "33:22",
    blurb: "Never in the field of human conflict was so much owed by so many to so few. The whole thing, not the soundbite.",
  },
  {
    id: "6dqgh0vaGZk",
    title: "Airbourne 2026 — Friday, Eastbourne",
    tag: "Site visit",
    filter: "visit",
    length: "31:39",
    blurb: "Opening day on the seafront. Spitfires, the crowd, and a very loud argument with the weather.",
  },
  {
    id: "GT6g3jvULNo",
    title: "Airbourne 2026 — Saturday, Eastbourne",
    tag: "Site visit",
    filter: "visit",
    length: "30:20",
    blurb: "The Saturday programme from Airbourne. History, still flying, still making a mess of the sky.",
  },
  {
    id: "qbuXRiEbGFo",
    title: "Battle of Britain 1940 — Forgotten Voices",
    tag: "Deep dive",
    filter: "voices",
    length: "29:46",
    blurb: "The Few, in their own words. Radar, the airfields, and a summer that decided whether this island stayed an island.",
  },
  {
    id: "O7klZ8fY2MA",
    title: "Forgotten Voices of WW2, Part 4 — Fall of France",
    tag: "Deep dive",
    filter: "voices",
    length: "27:40",
    blurb: "Blitzkrieg, the Meuse, and six weeks that knocked France out of the war. The witnesses, not the textbook.",
  },
  {
    id: "QVxGPC4LUT8",
    title: "Forgotten Voices of WW2, Part 3 — Norway 1940",
    tag: "Deep dive",
    filter: "voices",
    length: "26:24",
    blurb: "Fjords, destroyers, and a campaign that taught Churchill a few things he would rather not have learned.",
  },
  {
    id: "30oVQx89fHk",
    title: "We Shall Fight on the Beaches",
    tag: "Speech",
    filter: "speech",
    length: "24:09",
    blurb: "Dunkirk is over. The sentence is not. Churchill tells the House — and Hitler — that this island is not in the market.",
  },
  {
    id: "4H6sNVihsQw",
    title: "Best WW2 Tank? Me vs Grok",
    tag: "Debate",
    filter: "debate",
    length: "23:59",
    blurb: "Grok says the T-34 is the GOAT. I say no. A 24-minute argument with a machine, as nature intended.",
  },
  {
    id: "3Cd0_aBSK8w",
    title: "Forgotten Voices of WW2, Part 2 — Phoney War",
    tag: "Deep dive",
    filter: "voices",
    length: "22:53",
    blurb: "The Sitzkrieg, the Graf Spee, and the awkward months when everyone was at war and nobody quite knew how to start.",
  },
  {
    id: "FH5VOLQutPQ",
    title: "Andy Burnham — King of the North or Mad King?",
    tag: "Debate",
    filter: "debate",
    length: "10:23",
    blurb: "A northern question, asked with the volume up. History invited to comment on the present. Again.",
  },
  {
    id: "HovqTcqS22k",
    title: "What Would Nelson Think of the Navy?",
    tag: "Debate",
    filter: "debate",
    length: "7:08",
    blurb: "Filmed at the Redoubt Fortress and a Martello tower. Nelson, invited to review the current fleet. He is not polite.",
  },
];

export function youtubeThumb(id, large = false) {
  return large
    ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
    : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeShortThumb(id) {
  return `https://i.ytimg.com/vi/${id}/oar2.jpg`;
}

export function youtubeWatch(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeEmbed(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}

export function pad(n) {
  return String(n).padStart(2, "0");
}

export function monthName(month, long = true) {
  return new Date(2024, month - 1, 1).toLocaleString("en-GB", {
    month: long ? "long" : "short",
  });
}

export function formatOrdinal(day) {
  const j = day % 10;
  const k = day % 100;
  if (j === 1 && k !== 11) return `${day}st`;
  if (j === 2 && k !== 12) return `${day}nd`;
  if (j === 3 && k !== 13) return `${day}rd`;
  return `${day}th`;
}

export function todayParts(date = new Date()) {
  return { month: date.getMonth() + 1, day: date.getDate() };
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
