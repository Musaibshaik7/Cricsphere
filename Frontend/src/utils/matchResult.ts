interface MatchResultTeams {
  team1: string;
  team2: string;
  isCompleted: boolean;
  result: string;
}

/** Returns the named winner when a completed result starts with one of the teams. */
export const getWinningTeam = ({
  team1,
  team2,
  isCompleted,
  result,
}: MatchResultTeams): string | null => {
  if (!isCompleted || !result) return null;

  const normalisedResult = result.toLowerCase();
  if (normalisedResult.startsWith(team1.toLowerCase())) return team1;
  if (normalisedResult.startsWith(team2.toLowerCase())) return team2;
  return null;
};
