import { chromium } from "playwright";
import fs from "node:fs";

const dir = "/workspace/screenshots";
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});

await page.goto("http://127.0.0.1:8080/new?sample=true", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "踏進北風亭" }).click();
await page.waitForURL("**/play");
await page.waitForTimeout(600);

const turnsBefore = await page.locator("header").innerText();
console.log("header", turnsBefore.replace(/\n/g, " | "));

await page.getByRole("button", { name: "阿秋" }).first().click();
await page.waitForTimeout(400);
const dialog = page.getByRole("dialog");
console.log("dialog visible", await dialog.isVisible());
console.log("dialog text", (await dialog.innerText()).replace(/\n/g, " | ").slice(0, 300));
await page.screenshot({ path: `${dir}/menu-npc.png` });

await page.getByRole("button", { name: "關閉" }).click();
await page.waitForTimeout(300);
const still0 = await page.locator("header").innerText();
console.log("after cancel", still0.includes("第 0 回"), still0.replace(/\n/g, " | "));

await page.getByRole("button", { name: "阿青" }).first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: `${dir}/menu-npc-near.png` });
await page.getByRole("button", { name: "關閉" }).click();

const map = page.locator("img[alt='北風亭·一樓']");
const box = await map.boundingBox();
if (box) {
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.55);
  await page.waitForTimeout(350);
  console.log("floor dialog", (await page.getByRole("dialog").innerText().catch(() => "none")).toString().replace(/\n/g, " | ").slice(0, 250));
  await page.screenshot({ path: `${dir}/menu-floor.png` });
}

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
if (await page.getByRole("dialog").isVisible()) {
  await page.getByRole("button", { name: "關閉" }).click().catch(() => {});
  await page.waitForTimeout(200);
}
await page.getByRole("button", { name: "老侯" }).first().click();
await page.waitForTimeout(350);
await page.screenshot({ path: `${dir}/menu-mobile.png` });

await browser.close();
