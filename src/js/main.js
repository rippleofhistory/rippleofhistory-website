import {
  LINKS,
  FEATURED_LONGFORM,
  DEEP_DIVES,
  VIDEOS,
  AIRSHOWS,
  LATEST_VIDEOS,
  youtubeThumb,
  youtubeShortThumb,
  youtubeWatch,
  youtubeEmbed,
  pad,
  monthName,
  todayParts,
  prefersReducedMotion,
} from "./site.js";
import { eventsFor } from "./events.js";
import { SHOP_UNBOXINGS } from "./shop-unboxings.js";
import { applySeo, applyShopUnboxings } from "./seo.js";
import { inject } from "@vercel/analytics";
import "../css/styles.css";

document.body.classList.add("is-entering");
applySeo();
inject();

const header = document.querySelector(".site-header");
const toggle = document.querySelector(".menu-toggle");
const yearEl = document.querySelector("[data-year]");
const lightbox = document.querySelector("[data-lightbox]");
const lightboxFrame = document.querySelector("[data-lightbox-frame]");

if (yearEl) yearEl.textContent = String(new Date().getFullYear());

const onScroll = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

toggle?.addEventListener("click", () => {
  const open = document.body.classList.toggle("nav-open");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});

function pathKey(pathname) {
  const clean = pathname.replace(/index\.html$/, "").replace(/\/$/, "");
  return clean === "" ? "/" : clean;
}

function markNav() {
  const here = pathKey(location.pathname);
  const hash = location.hash.replace(/^#/, "");
  document.querySelectorAll("a[data-nav]").forEach((link) => {
    const section = link.dataset.section || "";
    const same = pathKey(link.pathname) === here;
    const active = section
      ? same && hash === section
      : same && !link.hash && hash !== "airshows" && hash !== "deep-dives";
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

markNav();
window.addEventListener("hashchange", markNav);

function closeNav() {
  if (!document.body.classList.contains("nav-open")) return;
  document.body.classList.remove("nav-open");
  toggle?.setAttribute("aria-expanded", "false");
  toggle?.setAttribute("aria-label", "Open menu");
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-nav]");
  if (!link) return;
  closeNav();
  if (prefersReducedMotion() || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  if (link.target === "_blank") return;
  const samePage = pathKey(link.pathname) === pathKey(location.pathname);
  if (samePage && link.hash) return;
  event.preventDefault();
  document.body.classList.add("is-leaving");
  window.setTimeout(() => {
    location.href = link.href;
  }, 240);
});

function seedParticles() {
  const layer = document.querySelector("[data-particles]");
  if (!layer || prefersReducedMotion()) return;
  for (let i = 0; i < 22; i += 1) {
    const mote = document.createElement("span");
    mote.style.left = `${Math.random() * 100}%`;
    mote.style.top = `${Math.random() * 100}%`;
    mote.style.animationDelay = `${Math.random() * 12}s`;
    mote.style.animationDuration = `${10 + Math.random() * 10}s`;
    layer.append(mote);
  }
}
seedParticles();

function bindHeroRipples() {
  const hero = document.querySelector(".hero, .page-hero");
  if (!hero || prefersReducedMotion()) return;
  const canvas = document.createElement("canvas");
  canvas.className = "ripple-layer";
  canvas.setAttribute("aria-hidden", "true");
  hero.append(canvas);
  const ctx = canvas.getContext("2d");
  const ripples = [];

  const resize = () => {
    canvas.width = hero.clientWidth;
    canvas.height = hero.clientHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const spawn = (x, y) => {
    ripples.push({ x, y, r: 8, a: 0.35 });
  };

  hero.addEventListener("pointerdown", (event) => {
    const box = hero.getBoundingClientRect();
    spawn(event.clientX - box.left, event.clientY - box.top);
  });

  let last = 0;
  const tick = (time) => {
    if (time - last > 2400) {
      spawn(canvas.width * (0.35 + Math.random() * 0.3), canvas.height * (0.74 + Math.random() * 0.14));
      last = time;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = ripples.length - 1; i >= 0; i -= 1) {
      const ripple = ripples[i];
      ripple.r += 1.6;
      ripple.a *= 0.985;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(230, 204, 122, ${ripple.a})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.r * 0.62, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(78, 196, 209, ${ripple.a * 0.45})`;
      ctx.stroke();
      if (ripple.a < 0.02 || ripple.r > 280) ripples.splice(i, 1);
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
bindHeroRipples();

function renderToday() {
  const root = document.querySelector("[data-today]");
  if (!root) return;
  const { month, day } = todayParts();
  const events = eventsFor(month, day);
  const featured = events[0];
  if (!featured) return;
  root.innerHTML = `
    <div class="today-date">
      <b>${pad(day)}</b>
      <span>${monthName(month, false)}</span>
    </div>
    <div class="today-copy">
      <small>On this day · ${featured.y < 0 ? `${Math.abs(featured.y)} BC` : featured.y}</small>
      <h3>${featured.title}</h3>
      <p>${featured.blurb}</p>
    </div>
    <a class="btn btn-ghost" data-nav href="on-this-day.html#${pad(month)}-${pad(day)}">Open the calendar</a>
  `;
}
renderToday();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function videoCard(video, large = false) {
  const isShort = video.kind === "short";
  const fallback = youtubeThumb(video.id);
  const src = isShort ? youtubeShortThumb(video.id) : youtubeThumb(video.id, large);
  const kindAttr = isShort ? ` data-kind="short"` : "";
  const meta = [video.tag, video.length].filter(Boolean).join(" · ");
  const title = escapeHtml(video.title);
  return `
    <article class="video-card${large ? " is-featured" : ""}${isShort ? " is-short" : ""}">
      <button class="thumb" data-play="${video.id}"${kindAttr} aria-label="Play ${title}">
        <img src="${src}" alt="${title}" width="${isShort ? 480 : large ? 1280 : 640}" height="${isShort ? 854 : large ? 720 : 400}" onerror="this.onerror=null;this.src='${fallback}'">
        <span class="play" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5v11l10-5.5L3 1.5z"/></svg>
        </span>
      </button>
      <div class="video-meta">
        <span class="tag">${escapeHtml(meta)}</span>
        <h3>${title}</h3>
        ${video.blurb && large ? `<p>${escapeHtml(video.blurb)}</p>` : ""}
        ${large ? `<button class="btn btn-gold play-inline" type="button" data-play="${video.id}">Play episode</button>` : ""}
      </div>
    </article>
  `;
}

function fillRail(selector, list) {
  const root = document.querySelector(selector);
  if (!root) return;
  root.innerHTML = list.map((video) => videoCard(video)).join("");
}

function withBlurb(video) {
  if (!video) return video;
  const longer = VIDEOS.find((item) => item.id === video.id);
  if (!longer?.blurb) return video;
  return { ...video, blurb: longer.blurb };
}

function spotMark(compact) {
  const size = compact ? 8 : 11;
  return `<span class="spot-mark${compact ? " is-compact" : ""}" aria-hidden="true"><svg width="${size}" height="${size}" viewBox="0 0 12 12" fill="currentColor"><path d="M2.2 1.1v9.8L10.6 6 2.2 1.1z"/></svg></span>`;
}

function spotStill(video, large) {
  const src = youtubeThumb(video.id, large);
  const fallback = youtubeThumb(video.id, false);
  return `
    <span class="spot-still">
      <img src="${src}" alt="" width="${large ? 1280 : 480}" height="${large ? 720 : 270}" onerror="this.onerror=null;this.src='${fallback}'">
      ${spotMark(!large)}
    </span>
  `;
}

function spotMeta(video) {
  return escapeHtml([video.tag, video.length].filter(Boolean).join(" · "));
}

function renderSpotlight(selector, lead, related) {
  const root = document.querySelector(selector);
  if (!root || !lead) return;
  const title = escapeHtml(lead.title);
  const blurb = escapeHtml(lead.blurb || "");
  const rows = related.filter(Boolean).map((video) => {
    const label = escapeHtml(video.title);
    return `
      <li>
        <button class="spot-hit" type="button" data-play="${video.id}" aria-label="Play ${label}">
          ${spotStill(video, false)}
          <span class="spot-row-copy">
            <span class="spot-meta">${spotMeta(video)}</span>
            <span class="spot-row-title">${label}</span>
          </span>
        </button>
      </li>
    `;
  }).join("");
  root.innerHTML = `
    <div class="spotlight">
      <article class="spotlight-lead">
        <button class="spot-hit" type="button" data-play="${lead.id}" aria-label="Play ${title}">
          ${spotStill(lead, true)}
        </button>
        <p class="spot-kicker">${spotMeta(lead)}</p>
        <h3>${title}</h3>
        ${blurb ? `<p class="spot-blurb">${blurb}</p>` : ""}
      </article>
      <ul class="spotlight-list">${rows}</ul>
    </div>
  `;
}

function renderVideos() {
  const longLead = withBlurb(FEATURED_LONGFORM.find((video) => video.id === "BcU5deW_Nys"));
  const longRelated = ["KtxDaEX3-Sc", "NZzgGn0Icx8", "4H6sNVihsQw"].map((id) =>
    FEATURED_LONGFORM.find((video) => video.id === id),
  );
  renderSpotlight("[data-long-films]", longLead, longRelated);

  const voiceLead = withBlurb(DEEP_DIVES.find((video) => video.id === "K-Y2gQodq6I"));
  const voiceRelated = ["3Cd0_aBSK8w", "QVxGPC4LUT8", "O7klZ8fY2MA"].map((id) =>
    DEEP_DIVES.find((video) => video.id === id),
  );
  renderSpotlight("[data-voices]", voiceLead, voiceRelated);
  const airshowFeatured = document.querySelector("[data-airshow-featured]");
  if (airshowFeatured && AIRSHOWS[0]) {
    airshowFeatured.innerHTML = videoCard(AIRSHOWS[0], true);
  }
  fillRail("[data-airshows]", AIRSHOWS.slice(1));
  fillRail("[data-latest]", LATEST_VIDEOS);
  loadLatest();
  loadShopUnboxings();
}
renderVideos();

async function loadLatest() {
  const root = document.querySelector("[data-latest]");
  if (!root) return;
  const urls = ["/api/latest-videos", "/api/latest-videos.json"];
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;
      const list = await response.json();
      if (Array.isArray(list) && list.length) {
        fillRail("[data-latest]", list);
        return;
      }
    } catch {
      /* try the next feed */
    }
  }
}

async function loadShopUnboxings() {
  const root = document.querySelector("[data-shop-unboxings]");
  if (!root) return;
  fillRail("[data-shop-unboxings]", SHOP_UNBOXINGS);
  const urls = ["/api/shop-unboxings", "/api/shop-unboxings.json"];
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) continue;
      const list = await response.json();
      if (Array.isArray(list) && list.length) {
        fillRail("[data-shop-unboxings]", list);
        applyShopUnboxings(list);
        return;
      }
    } catch {
      /* try the next feed */
    }
  }
}

function openLightbox(id, kind = "video") {
  if (!lightbox || !lightboxFrame) {
    window.open(youtubeWatch(id), "_blank", "noopener");
    return;
  }
  const isShort = kind === "short";
  lightbox.classList.toggle("is-short", isShort);
  lightboxFrame.classList.toggle("is-short", isShort);
  lightboxFrame.innerHTML = `<iframe src="${youtubeEmbed(id)}" allow="autoplay; encrypted-media" allowfullscreen title="YouTube video"></iframe>`;
  lightbox.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox || !lightboxFrame) return;
  lightbox.classList.remove("is-open", "is-short");
  lightboxFrame.classList.remove("is-short");
  lightboxFrame.innerHTML = "";
  document.body.style.overflow = "";
}

document.addEventListener("click", (event) => {
  const play = event.target.closest("[data-play]");
  if (play) {
    event.preventDefault();
    openLightbox(play.getAttribute("data-play"), play.getAttribute("data-kind") || "video");
  }
  if (event.target.closest("[data-lightbox-close]") || event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLightbox();
});

document.querySelectorAll("[data-external]").forEach((node) => {
  const key = node.getAttribute("data-external");
  if (LINKS[key]) node.setAttribute("href", LINKS[key]);
});
