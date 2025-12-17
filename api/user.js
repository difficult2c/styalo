export default async function handler(req, res) {
  const USERNAME = "styalo";

  // Fetch the recent matches record
  const r = await fetch(
    `https://ch.tetr.io/api/users/${USERNAME}/records/league/recent`
  );
  const json = await r.json();

  if (!json.success || !Array.isArray(json.data?.entries)) {
    return res.status(500).json({ error: "No match history found" });
  }

  const entries = json.data.entries;

  // Build TR history from extra league info
  const trMatches = [];

  for (const entry of entries) {
    const leaderboard = entry.results?.leaderboard || [];
    const player = leaderboard.find(p => p.username === USERNAME);
    if (!player) continue;

    const userId = player.id;
    const leagueInfo = entry.extras?.league?.[userId];
    if (!leagueInfo || leagueInfo.tr === undefined) continue;

    trMatches.push({
      ts: new Date(entry.ts).getTime(),
      trAfter: leagueInfo.tr
    });
  }

  if (trMatches.length === 0) {
    return res.json({
      currentTR: 0,
      delta24h: 0,
      trMatches: []
    });
  }

  // Sort by time
  trMatches.sort((a, b) => a.ts - b.ts);

  // Compute 24h delta
  const now = Date.now();
  const earliest24h = trMatches.find(m => m.ts >= now - 24 * 60 * 60 * 1000) || trMatches[0];
  const latestMatch = trMatches[trMatches.length - 1];
  const delta24h = latestMatch.trAfter - earliest24h.trAfter;

  res.json({
    currentTR: latestMatch.trAfter,
    delta24h,
    trMatches
  });
}
