import puppeteer from "file:///C:/Users/el_de/WW2Hub/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js";

const BASE = "http://127.0.0.1:4177";
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--hide-scrollbars"],
});
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (err) => errors.push(err.message));

await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await page.goto(BASE + "/games.html", { waitUntil: "networkidle0" });
const gamesH1 = await page.$eval("h1", (el) => el.innerText.replace(/\s+/g, " ").trim());
if (!/rip/i.test(gamesH1)) throw new Error("games h1: " + gamesH1);
await page.screenshot({ path: "scripts/shots/desktop-games.png", fullPage: true });

await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle0" }),
  page.click('a.btn-gold[href="/play/"]'),
]);
if (!page.url().includes("/play")) throw new Error("did not reach /play: " + page.url());
await page.waitForSelector("#title-screen.active", { timeout: 20000 });
const playH1 = await page.$eval("h1", (el) => el.innerText.replace(/\s+/g, " ").trim());
if (!playH1.includes("THE RIP")) throw new Error("play title: " + playH1);
if (playH1.includes("CHRONOS")) throw new Error("chronos leaked");
await page.screenshot({ path: "scripts/shots/desktop-play.png" });

await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto(BASE + "/games.html", { waitUntil: "networkidle0" });
await page.screenshot({ path: "scripts/shots/mobile-games.png", fullPage: true });
await page.goto(BASE + "/play/", { waitUntil: "networkidle0" });
await page.waitForSelector("#title-screen.active", { timeout: 20000 });
await page.screenshot({ path: "scripts/shots/mobile-play.png" });

await page.goto(BASE + "/", { waitUntil: "networkidle0" });
const homeGames = await page.$eval('.nav-links a[href="games.html"]', (el) => el.textContent.trim());
if (homeGames !== "Games") throw new Error("home nav: " + homeGames);

await browser.close();
if (errors.length) {
  console.error(errors);
  process.exit(1);
}
console.log("ok", { gamesH1, playH1 });
