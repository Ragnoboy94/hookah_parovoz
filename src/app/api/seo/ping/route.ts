import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getContent } from "@/lib/content";
import { getSeo, getSiteUrl } from "@/lib/seo";

async function pingIndexNow(siteUrl: string, key: string, urls: string[]) {
  const host = new URL(siteUrl).hostname;
  const body = { host, key, urlList: urls };
  const results: { endpoint: string; status: number }[] = [];

  for (const endpoint of [
    "https://yandex.com/indexnow",
    "https://api.indexnow.org/indexnow",
  ]) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    results.push({ endpoint, status: res.status });
  }

  return results;
}

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const content = await getContent();
  const seo = getSeo(content);
  const siteUrl = getSiteUrl(content);
  const key = process.env.INDEXNOW_KEY?.trim() || seo.indexNowKey?.trim();

  if (!key) {
    return NextResponse.json(
      { error: "Задайте IndexNow ключ в SEO-настройках" },
      { status: 400 },
    );
  }

  const urls = [siteUrl, `${siteUrl}/booking`];
  const indexNow = await pingIndexNow(siteUrl, key, urls);

  let googleStatus = 0;
  try {
    const res = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(`${siteUrl}/sitemap.xml`)}`,
    );
    googleStatus = res.status;
  } catch {
    googleStatus = 0;
  }

  return NextResponse.json({
    ok: true,
    urls,
    indexNow,
    googleSitemapPing: googleStatus,
    indexNowFile: `${siteUrl}/${key}.txt`,
  });
}
