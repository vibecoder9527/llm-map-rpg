import { chromium } from "playwright";
import fs from "node:fs";

const dir = "/workspace/screenshots";
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

await page.goto("http://127.0.0.1:8080/settings", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const titles = await page.locator("h1, [class*='font-display']").allInnerTexts();
console.log("titles", titles);
const cards = await page.locator(".rounded-xl.border").count();
console.log("cards", cards);
const tests = await page.getByRole("button", { name: "測試這份連線" }).count();
console.log("test buttons", tests);
await page.screenshot({ path: `${dir}/settings-desktop.png`, fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
await page.screenshot({ path: `${dir}/settings-mobile.png`, fullPage: true });
await page.screenshot({ path: `${dir}/settings-mobile-fold.png` });

await browser.close();
