import fs from "fs";
import path from "path";

const CACHE_FILE = path.resolve("./data/tr.json");
const USERNAME = "styalo";
const CACHE_INTERVAL = 24 * 60 * 60 * 1000; // 1 day

export default async function handler(req, res) {
  // Read previous TR
  let previousData = { tr: 0, ts: 0 };
  try {
    previousData = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {}

  const now = Date.now();

  // If last cached over 24h ago, refresh TR
  let currentTR = previousData.tr;
  if (now - previousData.ts > CACHE_INTERVAL) {
    const response = await fetch(`https://ch.tetr.io/api/users/${USERNAME}`);
    const data = await response.json();
    if (data.success) {
      currentTR = data.data.league?.rating || 0; // TR value
      fs.writeFileSync(CACHE_FILE, JSON.stringify({ tr: currentTR, ts: now }));
    }
  }

  const delta = currentTR - previousData.tr;
  res.setHeader("Content-Type", "application/json");
  res.json({ tr: currentTR, delta });
}
