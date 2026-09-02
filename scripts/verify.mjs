import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = "http://127.0.0.1:5173";
const OUT = path.resolve("scripts/shots");
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars"],
});

async function shot(page, name) {
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage: true,
  });
}

async function run(width, height, prefix) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });

  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await page.waitForSelector("[data-today] h3");
  await page.waitForSelector("[data-videos] .video-card");
  const homeActive = await page.$eval(".nav-links a.is-active", (el) => el.textContent.trim());
  if (homeActive !== "Home") throw new Error(`${prefix} home nav not active: ${homeActive}`);
  const homeHasBio = await page.evaluate(() => document.body.innerText.includes("Daniel Sellings, with a camera"));
  if (homeHasBio) throw new Error(`${prefix} home still has the about bio`);
  const homeButtons = await page.$$eval(".home-cta .hero-actions a", (els) => els.map((el) => el.textContent.trim()));
  if (!homeButtons.includes("Subscribe on YouTube") || !homeButtons.includes("Support the channel")) {
    throw new Error(`${prefix} home missing bottom buttons`);
  }
  await shot(page, `${prefix}-home`);

  if (width >= 800) {
    await page.click("[data-play]");
    await page.waitForSelector(".lightbox.is-open iframe");
    await page.screenshot({ path: path.join(OUT, `${prefix}-lightbox.png`) });
    await page.click("[data-lightbox-close]");
    await page.waitForFunction(() => !document.querySelector(".lightbox.is-open"));
  }

  if (width < 800) {
    await page.click(".menu-toggle");
    await page.waitForSelector("body.nav-open");
    await page.screenshot({
      path: path.join(OUT, `${prefix}-home-menu.png`),
    });
    await page.click(".menu-toggle");
  }

  await page.goto(`${BASE}/on-this-day.html?era=tudors#08-22`, { waitUntil: "networkidle0" });
  await page.waitForSelector("[data-days] .day.is-selected");
  await page.waitForSelector("[data-detail] h2");
  const eraOn = await page.$eval(".chip.is-on", (el) => el.textContent.trim());
  const heading = await page.$eval("[data-detail] h2", (el) => el.textContent.trim());
  if (eraOn !== "Tudors") throw new Error(`${prefix} era filter failed: ${eraOn}`);
  if (!heading.includes("August")) throw new Error(`${prefix} date heading failed: ${heading}`);
  await shot(page, `${prefix}-calendar`);

  const chips = await page.$$("[data-era]");
  if (chips[3]) await chips[3].click();
  await page.waitForSelector(".chip.is-on");
  await page.click("[data-random]");
  await new Promise((r) => setTimeout(r, 250));
  await shot(page, `${prefix}-calendar-random`);

  await page.goto(`${BASE}/about.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".about-copy h1");
  const aboutTitle = await page.$eval(".about-copy h1", (el) => el.textContent.trim());
  if (!aboutTitle.includes("Daniel Sellings")) throw new Error(`${prefix} about title failed: ${aboutTitle}`);
  const aboutClipped = await page.$eval(".about-copy h1", (el) => el.scrollWidth > el.clientWidth + 2);
  if (aboutClipped) throw new Error(`${prefix} about title overflows`);
  await shot(page, `${prefix}-about`);

  await page.goto(`${BASE}/support.html`, { waitUntil: "networkidle0" });
  await page.waitForSelector(".tier-list");
  await shot(page, `${prefix}-support`);

  await page.close();
}

await run(1440, 900, "desktop");
await run(390, 844, "mobile");

const errors = [];
const page = await browser.newPage();
page.on("pageerror", (err) => errors.push(String(err)));
page.on("console", (msg) => {
  if (msg.type() !== "error") return;
  const text = msg.text();
  if (/youtube|googletag|playback\.svta|Failed to load resource/i.test(text)) return;
  errors.push(text);
});
for (const url of ["/", "/on-this-day.html", "/about.html", "/support.html"]) {
  await page.goto(`${BASE}${url}`, { waitUntil: "networkidle0" });
}
await page.close();
await browser.close();

if (errors.length) {
  console.error("JS errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("ok");
