/**
 * Format match scores as set-by-set display (e.g. "6-2 / 4-6 / 6-3")
 */
export function formatSetScore(match: {
  set1_team1?: number;
  set1_team2?: number;
  set2_team1?: number;
  set2_team2?: number;
  set3_team1?: number | null;
  set3_team2?: number | null;
  team1_score?: number;
  team2_score?: number;
}): string {
  const parts: string[] = [];

  if (match.set1_team1 != null && match.set1_team2 != null) {
    parts.push(`${match.set1_team1}-${match.set1_team2}`);
  }
  if (match.set2_team1 != null && match.set2_team2 != null) {
    parts.push(`${match.set2_team1}-${match.set2_team2}`);
  }
  if (match.set3_team1 != null && match.set3_team2 != null) {
    parts.push(`${match.set3_team1}-${match.set3_team2}`);
  }

  if (parts.length > 0) return parts.join(" / ");

  // Fallback for old matches without set data
  return `${match.team1_score ?? 0}-${match.team2_score ?? 0}`;
}
