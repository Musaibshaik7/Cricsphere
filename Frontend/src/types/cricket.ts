/**
 * Exact data contracts returned by the C++ Cricket Tournament Simulator API.
 * All field names match the C++ JSON serializer 1:1 with zero reshaping.
 */

export type TournamentFormat = 'League' | 'Knockout' | 'LeagueKnockout' | 'Custom';

export interface PlayerDTO {
  name: string;
  role: string;
  jerseyNo: number;
  battingStyle: string;
  bowlingStyle: string;
}

export interface TeamDTO {
  index: number;
  name: string;
  shortCode: string;
  players?: PlayerDTO[];
}

export interface MatchSummaryDTO {
  matchNumber: number;
  team1: string;
  team2: string;
  isCompleted: boolean;
  result: string;
  score1: string;
  score2: string;
  momName: string;
  momTeam: string;
  momRuns: number;
  momWickets: number;
}

export interface BattingCardEntryDTO {
  playerName: string;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  dismissal: string;
  strikeRate: number | string;
}

export interface BowlingCardEntryDTO {
  playerName: string;
  overs: number | string;
  maidens: number;
  runsConceded: number;
  wickets: number;
  economy: number | string;
}

export interface InningsDTO {
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  totalWickets: number;
  overs: number | string;
  battingCard: BattingCardEntryDTO[];
  didNotBat: string[];
  bowlingCard: BowlingCardEntryDTO[];
}

export interface MatchDetailDTO extends MatchSummaryDTO {
  tossWinner: string;
  tossDecision: string;
  firstInnings?: InningsDTO;
  secondInnings?: InningsDTO;
}

export interface TournamentDTO {
  name: string;
  format: TournamentFormat;
  champion: string;
  isCompleted: boolean;
  teams: TeamDTO[];
  matches?: MatchSummaryDTO[];
}

export interface PointsRowDTO {
  rank: number;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  nrr: number | string;
}

export interface CapPlayerDTO {
  rank: number;
  name: string;
  totalRuns?: number;
  totalWickets?: number;
  matchesPlayed: number;
  battingStrikeRate: number | string;
  bowlingEconomy: number | string;
}

export type ScreenId = 'setup' | 'add-match' | 'matches' | 'scorecard' | 'points' | 'caps';

export interface TeamVisualTheme {
  primary: string;
  secondary: string;
  glow: string;
  bgTint: string;
  borderTint: string;
  textAccent: string;
}

const TEAM_THEMES: Record<string, TeamVisualTheme> = {
  MI: {
    primary: '#0284C7',
    secondary: '#F59E0B',
    glow: 'rgba(2, 132, 199, 0.35)',
    bgTint: 'rgba(2, 132, 199, 0.12)',
    borderTint: 'rgba(56, 189, 248, 0.35)',
    textAccent: '#38BDF8',
  },
  CSK: {
    primary: '#EAB308',
    secondary: '#2563EB',
    glow: 'rgba(234, 179, 8, 0.35)',
    bgTint: 'rgba(234, 179, 8, 0.12)',
    borderTint: 'rgba(250, 204, 21, 0.35)',
    textAccent: '#FACC15',
  },
  RCB: {
    primary: '#DC2626',
    secondary: '#D97706',
    glow: 'rgba(220, 38, 38, 0.35)',
    bgTint: 'rgba(220, 38, 38, 0.12)',
    borderTint: 'rgba(248, 113, 113, 0.35)',
    textAccent: '#F87171',
  },
  KKR: {
    primary: '#7C3AED',
    secondary: '#F59E0B',
    glow: 'rgba(124, 58, 237, 0.35)',
    bgTint: 'rgba(124, 58, 237, 0.12)',
    borderTint: 'rgba(167, 139, 250, 0.35)',
    textAccent: '#C084FC',
  },
  DC: {
    primary: '#2563EB',
    secondary: '#EF4444',
    glow: 'rgba(37, 99, 235, 0.35)',
    bgTint: 'rgba(37, 99, 235, 0.12)',
    borderTint: 'rgba(96, 165, 250, 0.35)',
    textAccent: '#60A5FA',
  },
  RR: {
    primary: '#DB2777',
    secondary: '#3B82F6',
    glow: 'rgba(219, 39, 119, 0.35)',
    bgTint: 'rgba(219, 39, 119, 0.12)',
    borderTint: 'rgba(244, 114, 182, 0.35)',
    textAccent: '#F472B6',
  },
  SRH: {
    primary: '#EA580C',
    secondary: '#1E293B',
    glow: 'rgba(234, 88, 12, 0.35)',
    bgTint: 'rgba(234, 88, 12, 0.12)',
    borderTint: 'rgba(251, 146, 60, 0.35)',
    textAccent: '#FB923C',
  },
  GT: {
    primary: '#0D9488',
    secondary: '#F59E0B',
    glow: 'rgba(13, 148, 136, 0.35)',
    bgTint: 'rgba(13, 148, 136, 0.12)',
    borderTint: 'rgba(45, 212, 191, 0.35)',
    textAccent: '#2DD4BF',
  },
  LSG: {
    primary: '#06B6D4',
    secondary: '#F97316',
    glow: 'rgba(6, 182, 212, 0.35)',
    bgTint: 'rgba(6, 182, 212, 0.12)',
    borderTint: 'rgba(34, 211, 238, 0.35)',
    textAccent: '#22D3EE',
  },
  PBKS: {
    primary: '#E11D48',
    secondary: '#FBBF24',
    glow: 'rgba(225, 29, 72, 0.35)',
    bgTint: 'rgba(225, 29, 72, 0.12)',
    borderTint: 'rgba(251, 113, 133, 0.35)',
    textAccent: '#FB7185',
  },
};

const FALLBACK_PALETTES: TeamVisualTheme[] = [
  TEAM_THEMES.MI,
  TEAM_THEMES.CSK,
  TEAM_THEMES.RCB,
  TEAM_THEMES.KKR,
  TEAM_THEMES.SRH,
  TEAM_THEMES.GT,
  TEAM_THEMES.RR,
  TEAM_THEMES.DC,
];

/**
 * Pure visual helper to map a team name or shortCode to stadium floodlight colors.
 * Does not perform any cricket logic.
 */
export function getTeamTheme(nameOrCode?: string): TeamVisualTheme {
  if (!nameOrCode) return TEAM_THEMES.MI;
  const upper = nameOrCode.trim().toUpperCase();
  if (TEAM_THEMES[upper]) return TEAM_THEMES[upper];

  if (upper.includes('MUMBAI')) return TEAM_THEMES.MI;
  if (upper.includes('CHENNAI') || upper.includes('SUPER KINGS')) return TEAM_THEMES.CSK;
  if (upper.includes('BANGALORE') || upper.includes('BENGALURU') || upper.includes('ROYAL')) return TEAM_THEMES.RCB;
  if (upper.includes('KOLKATA') || upper.includes('KNIGHT')) return TEAM_THEMES.KKR;
  if (upper.includes('DELHI')) return TEAM_THEMES.DC;
  if (upper.includes('RAJASTHAN')) return TEAM_THEMES.RR;
  if (upper.includes('HYDERABAD') || upper.includes('SUNRISERS')) return TEAM_THEMES.SRH;
  if (upper.includes('GUJARAT') || upper.includes('TITANS')) return TEAM_THEMES.GT;
  if (upper.includes('LUCKNOW')) return TEAM_THEMES.LSG;
  if (upper.includes('PUNJAB')) return TEAM_THEMES.PBKS;

  let hash = 0;
  for (let i = 0; i < upper.length; i++) {
    hash = (hash * 31 + upper.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_PALETTES[hash % FALLBACK_PALETTES.length];
}

/**
 * Extracts a short 2-4 letter badge code from team name or shortCode for UI avatars.
 */
export function getTeamShortBadge(teamName: string, teamsList?: TeamDTO[]): string {
  if (!teamName) return 'TM';
  const matched = teamsList?.find(
    (t) => t.name.toLowerCase() === teamName.toLowerCase() || t.shortCode.toLowerCase() === teamName.toLowerCase()
  );
  if (matched?.shortCode) return matched.shortCode;

  const words = teamName.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join('').slice(0, 4).toUpperCase();
}

/**
 * Minimum number of teams required per tournament format for UI form guidance.
 */
export function getFormatMinTeams(format: TournamentFormat): number {
  return format === 'LeagueKnockout' ? 4 : 2;
}

/**
 * UI form validation before calling POST /api/tournament.
 */
export function validateTournamentSetup(
  name: string,
  format: TournamentFormat,
  selectedTeamIndexes: number[]
): { valid: boolean; error: string | null } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Please enter a tournament name.' };
  }
  const minTeams = getFormatMinTeams(format);
  if (selectedTeamIndexes.length < minTeams) {
    return {
      valid: false,
      error:
        format === 'LeagueKnockout'
          ? 'LeagueKnockout format requires at least 4 teams.'
          : `Please select at least ${minTeams} teams.`,
    };
  }
  return { valid: true, error: null };
}
