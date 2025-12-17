export default async function handler(req, res) {
  const USERNAME = "styalo";

  // Fetch recent league match records
  const historyRes = await fetch(
    `https://ch.tetr.io/api/users/${USERNAME}/records/league/recent`
  );
  const historyData = await historyRes.json();

  if (!historyData.success || !historyData.data?.records) {
    return res.status(500).json({ error: "Failed to fetch match history" });
  }

  const matches = historyData.data.records;

  // Map matches to timestamp and TR after match
  const trMatches = matches.map(m => ({
    ts: m.starttime,        // timestamp of the match
    trAfter: m.rated?.tr    // TR after the match
  })).filter(m => m.trAfter !== undefined);

  // Sort by timestamp ascending
  trMatches.sort((a, b) => a.ts - b.ts);

  // Compute delta over last 24 hours
  const now = Date.now();
  const earliest24hMatch = trMatches.find(m => m.ts >= now - 24 * 60 * 60 * 1000) || trMatches[0];
  const latestMatch = trMatches[trMatches.length - 1] || { trAfter: 0 };
  const delta24h = latestMatch.trAfter - earliest24hMatch.trAfter;

  res.json({
    currentTR: latestMatch.trAfter || 0,
    delta24h,
    trMatches
  });
}
