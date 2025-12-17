import fs from "fs";
import path from "path";

const USERNAME = "styalo";
const CACHE_FILE = path.resolve("./data/trHistory.json");
const CACHE_INTERVAL = 24 * 60 * 60 * 1000; // 24h

// Ensure data folder exists
try { fs.mkdirSync(path.resolve("./data")); } catch {}

export default async function handler(req, res) {
  // Read previous history
  let history = [];
  try {
    history = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {}

  const now = Date.now();
  let lastEntry = history[history.length - 1] || { tr: 0, ts: 0 };
  
  // Fetch new TR if more than 24h passed
  if (now - lastEntry.ts > CACHE_INTERVAL) {
    const r = await fetch(`https://ch.tetr.io/api/users/${USERNAME}`);
    const data = await r.json();
    if (data.success) {
      const currentTR = data.data.league?.rating || 0;
      history.push({ ts: now, tr: currentTR });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(history, null, 2));
      lastEntry = { ts: now, tr: currentTR };
    }
  }

  // Compute delta vs previous entry
  const previousTR = history.length > 1 ? history[history.length - 2].tr : lastEntry.tr;
  const delta = lastEntry.tr - previousTR;

  res.setHeader("Content-Type", "application/json");
  res.json({ tr: lastEntry.tr, delta, history });
}
