import {
  LINKS,
  FEATURED_LONGFORM,
  DEEP_DIVES,
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
import { applySeo } from "./seo.js";
import "../css/styles.css";

document.body.classList.add("is-entering");
applySeo();

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
});

function pathKey(pathname) {
  const clean = pathname.replace(/index\.html$/, "").replace(/\/$/, "");
  return clean === "" ? "/" : clean;
}

document.querySelectorAll("[data-nav]").forEach((link) => {
  if (pathKey(link.pathname) === pathKey(location.pathname)) {
    link.classList.add("is-active");
  }
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[data-nav]");
  if (!link || prefersReducedMotion() || event.metaKey || event.ctrlKey) return;
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

function renderVideos() {
  const featuredRoot = document.querySelector("[data-featured]");
  const gridRoot = document.querySelector("[data-videos]");
  if (featuredRoot && FEATURED_LONGFORM[0]) {
    featuredRoot.innerHTML = videoCard(FEATURED_LONGFORM[0], true);
  }
  if (gridRoot) {
    gridRoot.innerHTML = FEATURED_LONGFORM.slice(1).map((video) => videoCard(video)).join("");
  }
  fillRail("[data-deep-dives]", DEEP_DIVES);
  const airshowFeatured = document.querySelector("[data-airshow-featured]");
  if (airshowFeatured && AIRSHOWS[0]) {
    airshowFeatured.innerHTML = videoCard(AIRSHOWS[0], true);
  }
  fillRail("[data-airshows]", AIRSHOWS.slice(1));
  fillRail("[data-latest]", LATEST_VIDEOS);
  loadLatest();
}
renderVideos();

async function loadLatest() {
  const root = document.querySelector("[data-latest]");
  if (!root) return;
  try {
    const response = await fetch("/api/latest-videos.json", { cache: "no-store" });
    if (!response.ok) return;
    const list = await response.json();
    if (Array.isArray(list) && list.length) fillRail("[data-latest]", list);
  } catch {
    /* keep the fallback list already rendered */
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
