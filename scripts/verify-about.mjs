import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = "http://127.0.0.1:5173";
const OUT = path.resolve("scripts/shots");
const errors = [];

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars"],
});

async function check(width, height, prefix) {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });

  const homeHasAbout = await page.$eval('.nav-links a[href="about.html"]', (el) => !!el);
  const homeHasBio = await page.evaluate(() => document.body.innerText.includes("Daniel Sellings, with a camera"));
  if (!homeHasAbout) errors.push(`${prefix} home missing About nav`);
  if (homeHasBio) errors.push(`${prefix} home still has the old about bio`);

  if (width < 800) {
    await page.click(".menu-toggle");
    await page.waitForSelector("body.nav-open");
    await page.click('.nav-links a[href="about.html"]');
  } else {
    await page.click('.nav-links a[href="about.html"]');
  }
  await page.waitForFunction(() => location.pathname.includes("about"));
  await page.waitForSelector(".about-copy h1");
  await new Promise((r) => setTimeout(r, 400));

  const info = await page.evaluate(() => {
    const h1 = document.querySelector(".about-copy h1");
    const buttons = [...document.querySelectorAll(".about-copy .hero-actions a")].map((n) => n.textContent.trim());
    return {
      title: h1.textContent.trim(),
      overflow: h1.scrollWidth > h1.clientWidth + 2,
      active: document.querySelector(".nav-links a.is-active")?.textContent.trim(),
      buttons,
      person: [...document.querySelectorAll('script[type="application/ld+json"]')].some(
        (s) => s.textContent.includes("Daniel Sellings") && s.textContent.includes("Person"),
      ),
    };
  });
  console.log(prefix, JSON.stringify(info));
  if (!info.title.includes("Daniel Sellings")) errors.push(`${prefix} bad title`);
  if (info.overflow) errors.push(`${prefix} title overflow`);
  if (info.active !== "About") errors.push(`${prefix} nav ${info.active}`);
  if (!info.person) errors.push(`${prefix} jsonld`);
  if (!info.buttons.includes("Subscribe on YouTube") || !info.buttons.includes("Support the channel")) {
    errors.push(`${prefix} missing about buttons`);
  }

  await page.screenshot({ path: path.join(OUT, `${prefix}-about.png`), fullPage: true });

  if (width < 800) {
    await page.click(".menu-toggle");
    await page.waitForSelector("body.nav-open");
    await page.screenshot({ path: path.join(OUT, "mobile-about-menu.png") });
    await page.click('.nav-links a[href="support.html"]');
  } else {
    await page.click('.about-copy .hero-actions a[href="support.html"]');
  }
  await page.waitForFunction(() => location.pathname.includes("support"));
  await page.waitForSelector(".tier-list");
  const supportActive = await page.$eval(".nav-links a.is-active", (el) => el.textContent.trim());
  if (supportActive !== "Support") errors.push(`${prefix} support nav ${supportActive}`);
  await page.close();
}

await check(1440, 900, "desktop");
await check(390, 844, "mobile");
await browser.close();
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("ok");
