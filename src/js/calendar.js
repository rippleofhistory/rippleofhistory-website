import { pad, monthName, formatOrdinal, todayParts, youtubeShortThumb, youtubeThumb } from "./site.js";
import { ERAS, eventsFor, hasVideo, eraLabel, randomEvent } from "./events.js";
import { shortFor, hasShort, hydrateShorts } from "./shorts.js";

const state = {
  month: todayParts().month,
  day: todayParts().day,
  era: "all",
};

const monthTitle = document.querySelector("[data-month-title]");
const daysRoot = document.querySelector("[data-days]");
const detailRoot = document.querySelector("[data-detail]");
const filtersRoot = document.querySelector("[data-filters]");
const todayRoot = document.querySelector("[data-todays-ripple]");
const jumpInput = document.querySelector("[data-jump]");
const monthPills = document.querySelector("[data-month-pills]");
const dateLabel = document.querySelector("[data-date-label]");

function daysInMonth(month) {
  return new Date(2024, month, 0).getDate();
}

function firstWeekday(month) {
  const day = new Date(2024, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function parseHash() {
  const era = new URLSearchParams(location.search).get("era");
  if (era && ERAS.some((item) => item.id === era)) state.era = era;

  const match = location.hash.match(/^#(\d{1,2})-(\d{1,2})$/);
  if (!match) return;
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(month)) {
    state.month = month;
    state.day = day;
  }
}

function writeHash() {
  const next = `#${pad(state.month)}-${pad(state.day)}`;
  if (location.hash !== next) history.replaceState(null, "", next);
}

function yearLabel(year) {
  if (year < 0) return `${Math.abs(year)} BC`;
  return String(year);
}

function headingFor(month, day) {
  return `${formatOrdinal(day)} ${monthName(month)}`;
}

function renderFilters() {
  if (!filtersRoot) return;
  filtersRoot.innerHTML = ERAS.map(
    (era) => `
      <button class="chip ${state.era === era.id ? "is-on" : ""}" data-era="${era.id}" type="button">${era.label}</button>
    `,
  ).join("");
}

function renderMonthPills() {
  if (!monthPills) return;
  monthPills.innerHTML = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return `<button class="chip ${month === state.month ? "is-on" : ""}" type="button" data-month-jump="${month}">${monthName(month, false)}</button>`;
  }).join("");
}

function renderCalendar() {
  if (!monthTitle || !daysRoot) return;
  monthTitle.textContent = monthName(state.month);
  const lead = firstWeekday(state.month);
  const count = daysInMonth(state.month);
  const today = todayParts();
  const cells = [];

  for (let i = 0; i < lead; i += 1) cells.push(`<span class="day is-empty"></span>`);

  for (let day = 1; day <= count; day += 1) {
    const classes = ["day"];
    const matchesEra =
      state.era === "all"
        ? eventsFor(state.month, day).length > 0
        : eventsFor(state.month, day).some((event) => event.era === state.era);
    if (matchesEra) classes.push("has-event");
    if ((hasShort(state.month, day) || hasVideo(state.month, day)) && (state.era === "all" || matchesEra)) {
      classes.push("has-video");
    }
    if (day === state.day) classes.push("is-selected");
    if (state.month === today.month && day === today.day) classes.push("is-today");
    cells.push(
      `<button class="${classes.join(" ")}" type="button" data-day="${day}" aria-pressed="${day === state.day}" aria-label="${headingFor(state.month, day)}">${day}</button>`,
    );
  }

  daysRoot.innerHTML = cells.join("");
  if (dateLabel) dateLabel.textContent = headingFor(state.month, state.day);
  if (jumpInput) {
    const y = new Date().getFullYear();
    jumpInput.value = `${y}-${pad(state.month)}-${pad(state.day)}`;
  }
}

function shortBlock(month, day) {
  const short = shortFor(month, day);
  if (!short) {
    return `
      <div class="short-empty">
        <p>No daily short for this date — yet. The chapter in the book still runs. When a new brief goes up, it will live here.</p>
        <a class="btn btn-ghost" href="https://www.youtube.com/@RippleOfHistory/shorts" target="_blank" rel="noreferrer">Watch the shorts</a>
      </div>
    `;
  }
  const thumb = youtubeShortThumb(short.id);
  const fallback = youtubeThumb(short.id);
  return `
    <article class="short-card">
      <button class="thumb" type="button" data-play="${short.id}" data-kind="short" aria-label="Play ${short.title}">
        <img src="${thumb}" alt="" width="1080" height="1920" onerror="this.onerror=null;this.src='${fallback}'">
        <span class="play" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.5v11l10-5.5L3 1.5z"/></svg>
        </span>
      </button>
      <div class="short-copy">
        <span class="tag">Daily short</span>
        <h3>${short.title}</h3>
        <p>The brief for ${headingFor(month, day)}.</p>
        <div class="short-actions">
          <button class="btn btn-gold" type="button" data-play="${short.id}" data-kind="short">Play</button>
          <a class="btn btn-ghost" href="https://www.youtube.com/shorts/${short.id}" target="_blank" rel="noreferrer">YouTube</a>
        </div>
      </div>
    </article>
  `;
}

function timeline(events) {
  return `
    <ol class="timeline">
      ${events
        .map(
          (event, index) => `
            <li class="tl-item" style="--i:${index}">
              <span class="tl-year">${yearLabel(event.y)}</span>
              <article class="tl-card ${event.more ? "has-more" : ""}">
                <div class="meta">${event.loc} · ${eraLabel(event.era)}</div>
                <h3>${event.title}</h3>
                <p>${event.blurb}</p>
                ${
                  event.more
                    ? `<button class="more-btn" type="button" data-toggle-more>Read more</button>
                       <p class="tl-more">${event.more}</p>`
                    : ""
                }
                ${
                  event.video
                    ? `<a class="watch-link" href="https://www.youtube.com/watch?v=${event.video}" target="_blank" rel="noreferrer">Watch the long-form take</a>`
                    : ""
                }
              </article>
            </li>
          `,
        )
        .join("")}
    </ol>
  `;
}

function renderDetail(animate = true) {
  if (!detailRoot) return;
  const all = eventsFor(state.month, state.day);
  const events = state.era === "all" ? all : all.filter((event) => event.era === state.era);
  const heading = headingFor(state.month, state.day);

  const html = `
    <div class="detail-kicker">The living book · ${events.length} ripples</div>
    <h2>${heading}</h2>
    ${shortBlock(state.month, state.day)}
    <h3 class="tl-heading">Across the centuries</h3>
    ${
      events.length
        ? timeline(events)
        : `<p>The archives are quiet for this filter. Lift it, or try another date. The pond is never actually empty.</p>`
    }
  `;

  if (!animate) {
    detailRoot.innerHTML = html;
    return;
  }

  detailRoot.classList.add("is-leaving");
  window.setTimeout(() => {
    detailRoot.innerHTML = html;
    detailRoot.classList.remove("is-leaving");
    detailRoot.classList.add("is-entering");
    window.setTimeout(() => detailRoot.classList.remove("is-entering"), 420);
  }, 160);
}

function renderTodayRipple() {
  if (!todayRoot) return;
  const { month, day } = todayParts();
  const events = eventsFor(month, day);
  const lead = events[0];
  const short = shortFor(month, day);
  todayRoot.innerHTML = `
    <div class="today-date">
      <b>${pad(day)}</b>
      <span>${monthName(month, false)}</span>
    </div>
    <div class="today-copy">
      <small>Today’s Ripple${short ? " · short on YouTube" : ""}</small>
      <h3>${lead ? lead.title : headingFor(month, day)}</h3>
      <p>${lead ? lead.blurb : "Open the book. The day always has a chapter."}</p>
    </div>
    <button class="btn btn-gold" type="button" data-open-today>Read today’s chapter</button>
  `;
}

function render(animate = true) {
  renderFilters();
  renderMonthPills();
  renderCalendar();
  renderDetail(animate);
  writeHash();
}

document.querySelector("[data-prev-month]")?.addEventListener("click", () => {
  state.month = state.month === 1 ? 12 : state.month - 1;
  state.day = Math.min(state.day, daysInMonth(state.month));
  render();
});

document.querySelector("[data-next-month]")?.addEventListener("click", () => {
  state.month = state.month === 12 ? 1 : state.month + 1;
  state.day = Math.min(state.day, daysInMonth(state.month));
  render();
});

daysRoot?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-day]");
  if (!button) return;
  state.day = Number(button.getAttribute("data-day"));
  render();
});

filtersRoot?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-era]");
  if (!chip) return;
  state.era = chip.getAttribute("data-era");
  render();
});

monthPills?.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-month-jump]");
  if (!chip) return;
  state.month = Number(chip.getAttribute("data-month-jump"));
  state.day = Math.min(state.day, daysInMonth(state.month));
  render();
});

document.querySelector("[data-today-btn]")?.addEventListener("click", () => {
  const today = todayParts();
  state.month = today.month;
  state.day = today.day;
  render();
});

todayRoot?.addEventListener("click", (event) => {
  if (!event.target.closest("[data-open-today]")) return;
  const today = todayParts();
  state.month = today.month;
  state.day = today.day;
  render();
  document.querySelector("#daybook")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("[data-random]")?.addEventListener("click", () => {
  const event = randomEvent();
  state.month = event.m;
  state.day = event.d;
  render();
});

jumpInput?.addEventListener("change", () => {
  if (!jumpInput.value) return;
  const [, month, day] = jumpInput.value.split("-").map(Number);
  if (month >= 1 && month <= 12) {
    state.month = month;
    state.day = Math.min(day, daysInMonth(month));
    render();
  }
});

detailRoot?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-toggle-more]");
  if (!button) return;
  button.closest(".tl-card")?.classList.toggle("is-open");
  button.textContent = button.closest(".tl-card")?.classList.contains("is-open") ? "Show less" : "Read more";
});

window.addEventListener("hashchange", () => {
  parseHash();
  render();
});

parseHash();
renderTodayRipple();
render();

async function loadLiveShorts() {
  try {
    const response = await fetch("/api/on-this-day-shorts.json", { cache: "no-store" });
    if (!response.ok) return;
    const map = await response.json();
    if (!map || typeof map !== "object") return;
    hydrateShorts(map);
    renderTodayRipple();
    render(false);
  } catch {
    /* keep the built-in shorts map */
  }
}

loadLiveShorts();
