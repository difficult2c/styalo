export default async function handler(req, res) {
  const USERNAME = "styalo";

  // Fetch Styalo's recent ranked matches
  const r = await fetch(`https://ch.tetr.io/api/users/${USERNAME}/records/league/recent`);
  const data = await r.json();

  if (!data.success || !data.data?.entries) {
    return res.status(500).json({ error: "Failed to fetch match records" });
  }

  const entries = data.data.entries;

  // Extract TR snapshots for Styalo
  const trMatches = entries.map(e => {
    const userId = Object.keys(data.data.extras.league).find(id =>
      data.data.extras.league[id] && id === e.results.leaderboard.find(p => p.username === USERNAME)?.id
    );

    const leagueArray = data.data.extras.league[userId];
    const tr = leagueArray?.[leagueArray.length - 1]?.tr || 0; // latest TR snapshot for this match
    return {
      ts: new Date(e.ts).getTime(),
      trAfter: tr
    };
  }).filter(m => m.trAfter !== undefined);

  // Sort ascending by timestamp
  trMatches.sort((a, b) => a.ts - b.ts);

  // Compute delta in last 24h
  const now = Date.now();
  const earliest24h = trMatches.find(m => m.ts >= now - 24 * 60 * 60 * 1000) || trMatches[0];
  const latestMatch = trMatches[trMatches.length - 1] || { trAfter: 0 };
  const delta24h = latestMatch.trAfter - earliest24h.trAfter;

  res.json({
    currentTR: latestMatch.trAfter,
    delta24h,
    trMatches
  });
}
