import { chromium } from "playwright";
import fs from "node:fs";

const dir = "/workspace/screenshots";
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

await page.goto("http://127.0.0.1:8080/new?sample=true", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "踏進北風亭" }).click();
await page.waitForURL("**/play");
await page.waitForTimeout(700);

await page.getByRole("button", { name: "阿秋" }).first().click();
await page.waitForTimeout(500);
const dlg = page.getByRole("dialog");
console.log("qiu visible", await dlg.isVisible());
console.log("qiu text", (await dlg.innerText()).replace(/\n/g, " | ").slice(0, 280));
const imgs = await dlg.locator("img").evaluateAll((els) =>
  els.map((e) => ({ alt: e.getAttribute("alt"), src: (e.getAttribute("src") || "").slice(0, 80) })),
);
console.log("qiu imgs", imgs);
await page.screenshot({ path: `${dir}/portrait-far.png` });
await page.getByRole("button", { name: "關閉" }).click();
await page.waitForTimeout(250);

await page.getByRole("button", { name: "阿青" }).first().click();
await page.waitForTimeout(800);
console.log("qing text", (await page.getByRole("dialog").innerText()).replace(/\n/g, " | ").slice(0, 280));
await page.screenshot({ path: `${dir}/portrait-near.png` });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(400);
await page.screenshot({ path: `${dir}/portrait-near-mobile.png` });

await browser.close();
