import {
  CapPlayerDTO,
  MatchDetailDTO,
  MatchSummaryDTO,
  PointsRowDTO,
  TeamDTO,
  TournamentDTO,
  TournamentFormat,
} from '../types/cricket';

/**
 * Single constant API_BASE read from VITE_API_BASE (defaults to http://localhost:8080).
 * All cricket calculations happen inside the C++ server.
 */
export const API_BASE: string =
  (typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE) ||
  'http://localhost:8080';

export function buildApiUrl(path: string, base: string = API_BASE): string {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

export class BackendOfflineError extends Error {
  constructor(message = 'Cannot reach C++ backend server at ' + API_BASE) {
    super(message);
    this.name = 'BackendOfflineError';
  }
}

export class ApiRejectError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRejectError';
    this.status = status;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildApiUrl(path);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new BackendOfflineError(`Could not connect to C++ backend at ${API_BASE}`);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON response (e.g. HTML error page when C++ server is not listening)
      throw new BackendOfflineError(`C++ backend at ${API_BASE} is not responding with JSON`);
    }
  }

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    throw new BackendOfflineError(`C++ backend at ${API_BASE} is unreachable (${response.status})`);
  }

  if (!response.ok) {
    const errObj = data as Record<string, unknown> | null;
    const msg =
      (errObj &&
        (typeof errObj.error === 'string'
          ? errObj.error
          : typeof errObj.message === 'string'
          ? errObj.message
          : null)) ||
      `Backend returned HTTP ${response.status}`;
    throw new ApiRejectError(msg, response.status);
  }

  return data as T;
}

/**
 * GET /api/teams
 * Returns [{index,name,shortCode,players:[{name,role,jerseyNo,battingStyle,bowlingStyle}]}]
 */
export async function fetchTeams(): Promise<TeamDTO[]> {
  const data = await requestJson<unknown>('/api/teams');
  if (!Array.isArray(data)) {
    throw new BackendOfflineError(`C++ server at ${API_BASE}/api/teams did not return a teams array`);
  }
  return data as TeamDTO[];
}

/**
 * GET /api/tournament
 * Returns {name,format,champion,isCompleted,teams:[{index,name,shortCode}]}
 * Quietly returns null if no tournament exists yet.
 */
export async function fetchTournamentQuietly(): Promise<TournamentDTO | null> {
  try {
    const data = await requestJson<unknown>('/api/tournament');
    if (!data || typeof data !== 'object' || !('name' in data)) {
      return null;
    }
    return data as TournamentDTO;
  } catch (err) {
    if (err instanceof BackendOfflineError) {
      throw err;
    }
    // Before a tournament exists, GET /api/tournament returns an error — handle quietly
    return null;
  }
}

/**
 * POST /api/tournament
 * body: {name, format, teamIndexes:[..]}
 */
export async function createTournament(payload: {
  name: string;
  format: TournamentFormat;
  teamIndexes: number[];
}): Promise<TournamentDTO> {
  return requestJson<TournamentDTO>('/api/tournament', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** POST /api/reset — clears the current in-memory tournament. */
export async function resetTournament(): Promise<void> {
  await requestJson<{ reset: boolean }>('/api/reset', { method: 'POST' });
}

/**
 * POST /api/match (Custom format only)
 * body: {teamA, teamB}
 */
export async function addCustomMatch(payload: { teamA: number; teamB: number }): Promise<unknown> {
  return requestJson<unknown>('/api/match', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * POST /api/play
 * Plays all added matches still pending
 */
export async function playPendingMatches(): Promise<unknown> {
  return requestJson<unknown>('/api/play', {
    method: 'POST',
  });
}

/**
 * GET /api/matches
 */
export async function fetchMatches(): Promise<MatchSummaryDTO[]> {
  const data = await requestJson<unknown>('/api/matches');
  return Array.isArray(data) ? (data as MatchSummaryDTO[]) : [];
}

/**
 * GET /api/matches/{n}
 */
export async function fetchMatchDetail(matchNumber: number): Promise<MatchDetailDTO> {
  return requestJson<MatchDetailDTO>(`/api/matches/${matchNumber}`);
}

/**
 * GET /api/points
 */
export async function fetchPointsTable(): Promise<PointsRowDTO[]> {
  const data = await requestJson<unknown>('/api/points');
  return Array.isArray(data) ? (data as PointsRowDTO[]) : [];
}

/**
 * GET /api/orange
 */
export async function fetchOrangeCap(): Promise<CapPlayerDTO[]> {
  const data = await requestJson<unknown>('/api/orange');
  return Array.isArray(data) ? (data as CapPlayerDTO[]) : [];
}

/**
 * GET /api/purple
 */
export async function fetchPurpleCap(): Promise<CapPlayerDTO[]> {
  const data = await requestJson<unknown>('/api/purple');
  return Array.isArray(data) ? (data as CapPlayerDTO[]) : [];
}
