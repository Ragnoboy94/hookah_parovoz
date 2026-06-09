/**
 * Уведомляет поисковики об обновлении сайта (IndexNow + sitemap ping).
 * Ключ IndexNow: content.seo.indexNowKey или INDEXNOW_KEY в .env.local
 */
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

async function loadConfig() {
  const raw = await readFile(path.join(root, "data/content.json"), "utf-8");
  const content = JSON.parse(raw);
  const siteUrl = (
    content.seo?.siteUrl ||
    process.env.SITE_URL ||
    "https://parovoz39.ru"
  ).replace(/\/$/, "");
  const key =
    process.env.INDEXNOW_KEY?.trim() ||
    content.seo?.indexNowKey?.trim() ||
    "";
  return { siteUrl, key };
}

async function pingIndexNow(siteUrl, key, urls) {
  if (!key) {
    console.log("IndexNow: ключ не задан (seo.indexNowKey или INDEXNOW_KEY)");
    return;
  }

  const host = new URL(siteUrl).hostname;
  const body = { host, key, urlList: urls };

  for (const endpoint of [
    "https://yandex.com/indexnow",
    "https://api.indexnow.org/indexnow",
  ]) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
      console.log(`IndexNow ${endpoint}: ${res.status}`);
    } catch (err) {
      console.warn(`IndexNow ${endpoint} failed:`, err.message);
    }
  }
}

async function pingSitemap(siteUrl) {
  const sitemap = `${siteUrl}/sitemap.xml`;
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemap)}`;
  try {
    const res = await fetch(pingUrl);
    console.log(`Google sitemap ping: ${res.status}`);
  } catch (err) {
    console.warn("Google sitemap ping failed:", err.message);
  }
}

const { siteUrl, key } = await loadConfig();
const urls = [siteUrl, `${siteUrl}/booking`];

console.log("Ping:", siteUrl);
await pingIndexNow(siteUrl, key, urls);
await pingSitemap(siteUrl);
