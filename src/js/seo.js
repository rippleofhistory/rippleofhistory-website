import {
  SITE_URL,
  SITE_NAME,
  CHANNEL_ID,
  LINKS,
  FEATURED_LONGFORM,
  AIRSHOWS,
  DEEP_DIVES,
  youtubeThumb,
  youtubeWatch,
} from "./site.js";

function parseLength(length) {
  if (!length || !/^\d+:\d+$/.test(length)) return undefined;
  const [minutes, seconds] = length.split(":").map(Number);
  return minutes * 60 + seconds;
}

function videoObject(video) {
  const duration = parseLength(video.length);
  return {
    "@type": "VideoObject",
    name: video.title,
    description: video.blurb || `${video.title} — ${SITE_NAME}`,
    thumbnailUrl: youtubeThumb(video.id, true),
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
    url: youtubeWatch(video.id),
    ...(duration ? { duration: `PT${Math.floor(duration / 60)}M${duration % 60}S` } : {}),
    publisher: { "@id": `${SITE_URL}/#organization` },
    isFamilyFriendly: true,
  };
}

function inject(data) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

const organization = {
  "@type": ["Organization", "Person"],
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  alternateName: ["Ripple Of History", "Daniel Sellings"],
  url: SITE_URL,
  logo: `${SITE_URL}/images/wordmark.png`,
  image: `${SITE_URL}/images/hero-banner.png`,
  description:
    "Daily On This Day history shorts and long-form films from Eastbourne: WW2, Churchill, Airbourne, Romans, Tudors and the British story.",
  foundingLocation: {
    "@type": "Place",
    name: "Eastbourne, East Sussex, England",
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Eastbourne",
    addressRegion: "East Sussex",
    addressCountry: "GB",
  },
  sameAs: [LINKS.youtube, LINKS.x, LINKS.substack, LINKS.coffee, `https://www.youtube.com/channel/${CHANNEL_ID}`],
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "en-GB",
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export function applySeo() {
  const path = location.pathname.replace(/index\.html$/, "") || "/";
  const isHome = path === "/" || path === "";
  const isDay = path.includes("on-this-day");
  const isAbout = path.includes("about");

  const pageUrl = isHome
    ? `${SITE_URL}/`
    : isDay
      ? `${SITE_URL}/on-this-day.html`
      : isAbout
        ? `${SITE_URL}/about.html`
        : `${SITE_URL}/support.html`;

  const webPage = {
    "@type": isAbout ? "AboutPage" : "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: document.title,
    description: document.querySelector('meta[name="description"]')?.content || "",
    inLanguage: "en-GB",
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: isHome
        ? `${SITE_URL}/images/hero-banner.png`
        : isDay
          ? `${SITE_URL}/images/on-this-day.jpg`
          : `${SITE_URL}/images/support.jpg`,
    },
  };

  const graph = [organization, website, webPage];

  if (!isHome) {
    const crumbName = isDay ? "On This Day" : isAbout ? "About" : "Support";
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: crumbName,
          item: pageUrl,
        },
      ],
    });
  }

  if (isAbout) {
    graph.push({
      "@type": "Person",
      "@id": `${SITE_URL}/about.html#person`,
      name: "Daniel Sellings",
      url: `${SITE_URL}/about.html`,
      image: `${SITE_URL}/images/support.jpg`,
      jobTitle: "Historian and filmmaker",
      description:
        "Daniel Sellings films Ripple of History from Eastbourne: daily On This Day shorts, long-form WW2 films, and Eastbourne airshows.",
      homeLocation: {
        "@type": "Place",
        name: "Eastbourne, East Sussex, England",
      },
      sameAs: [LINKS.youtube, LINKS.x, LINKS.substack, LINKS.coffee],
      worksFor: { "@id": `${SITE_URL}/#organization` },
    });
    webPage.mainEntity = { "@id": `${SITE_URL}/about.html#person` };
  }

  if (isHome) {
    const videos = [...AIRSHOWS.filter((v) => v.kind !== "short"), ...FEATURED_LONGFORM, ...DEEP_DIVES];
    const unique = [];
    const seen = new Set();
    for (const video of videos) {
      if (seen.has(video.id)) continue;
      seen.add(video.id);
      unique.push(video);
    }
    graph.push({
      "@type": "ItemList",
      name: "Ripple of History films",
      itemListElement: unique.map((video, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: videoObject(video),
      })),
    });
  }

  inject({ "@context": "https://schema.org", "@graph": graph });
}
