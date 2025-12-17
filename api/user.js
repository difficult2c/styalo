export default async function handler(req, res) {
  const USERNAME = "styalo";

  // Fetch TETR.IO match history
  const historyRes = await fetch(
    `https://ch.tetr.io/api/records/${encodeURIComponent(USERNAME)}`
  );
  const historyData = await historyRes.json();

  if (!historyData.success) {
    return res.status(500).json({ error: "Failed to fetch match history" });
  }

  const points = historyData.data.points || [];
  // Map matches to objects with timestamp and TR after match
  const trMatches = points.map(p => ({
    ts: historyData.data.startTime + p[0], // actual timestamp
    trAfter: p[2] // TR after match
  }));

  // Compute deltas
  let latest = trMatches[trMatches.length - 1] || { trAfter: 0 };
  let earliestToday = trMatches.find(m =>
    new Date(m.ts) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
  ) || latest;

  const delta24h = latest.trAfter - earliestToday.trAfter;

  res.json({
    currentTR: latest.trAfter,
    delta24h,
    trMatches
  });
}
