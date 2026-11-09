import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, ChevronRight, Search, Calendar } from 'lucide-react';
import {
  MatchSummaryDTO,
  TeamDTO,
  TournamentDTO,
  getTeamShortBadge,
  getTeamTheme,
} from '../types/cricket';
import { WinnerCelebration } from '../components/WinnerCelebration';
import { getWinningTeam } from '../utils/matchResult';
import {
  MagneticButton,
  ScoreboardValue,
  TiltCard,
} from '../components/InteractiveEffects';

interface MatchesScreenProps {
  matches: MatchSummaryDTO[];
  teams: TeamDTO[];
  tournament: TournamentDTO | null;
  onSelectMatch: (matchNumber: number) => void;
  onGoToSetup: () => void;
  onGoToAddMatch: () => void;
  reducedMotion: boolean;
}

/**
 * Screen 3: Matches List
 * Displays a card per match with both scores, the result, and a Man of the Match spotlight.
 * Clicking any match card opens its detailed scorecard (GET /api/matches/{n}).
 */
export const MatchesScreen: React.FC<MatchesScreenProps> = ({
  matches,
  teams,
  tournament,
  onSelectMatch,
  onGoToSetup,
  onGoToAddMatch,
  reducedMotion,
}) => {
  const [searchFilter, setSearchFilter] = useState('');

  const filteredMatches = matches.filter((m) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      m.team1.toLowerCase().includes(q) ||
      m.team2.toLowerCase().includes(q) ||
      (m.momName && m.momName.toLowerCase().includes(q)) ||
      (m.result && m.result.toLowerCase().includes(q)) ||
      String(m.matchNumber) === q
    );
  });

  if (!tournament && matches.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-4">
        <Calendar className="h-10 w-10 text-amber-400 mx-auto" />
        <h2 className="font-display text-3xl font-bold text-white">No Matches Played Yet</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Create a tournament on the Setup screen to simulate matches on the C++ backend.
        </p>
        <MagneticButton
          onClick={onGoToSetup}
          className="rounded-xl bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950"
        >
          Create Tournament
        </MagneticButton>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <span>{tournament?.name || 'Tournament Fixtures'}</span>
            {tournament?.format && (
              <>
                <span aria-hidden="true">·</span>
                <span>{tournament.format}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{matches.length} Matches</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-wide text-white mt-1">
            Match Results &amp; Scoreboards
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by team or player..."
              aria-label="Filter matches by team or player"
              className="w-64 rounded-xl border border-slate-800 bg-slate-900/90 pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {tournament?.format === 'Custom' && (
            <MagneticButton
              onClick={onGoToAddMatch}
              cursorLabel="ADD"
              reducedMotion={reducedMotion}
              className="rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25"
            >
              + Add / Play Custom Matches
            </MagneticButton>
          )}
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center space-y-3">
          <p className="text-sm text-slate-400">
            {matches.length === 0
              ? 'No matches have been added or simulated yet.'
              : 'No matches match your current search filter.'}
          </p>
          {tournament?.format === 'Custom' && matches.length === 0 && (
            <MagneticButton
              onClick={onGoToAddMatch}
              className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950"
            >
              Schedule Custom Matches
            </MagneticButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMatches.map((match, idx) => {
            const theme1 = getTeamTheme(match.team1);
            const theme2 = getTeamTheme(match.team2);
            const short1 = getTeamShortBadge(match.team1, teams);
            const short2 = getTeamShortBadge(match.team2, teams);
            const winningTeam = getWinningTeam(match);
            const team1Won = winningTeam === match.team1;
            const team2Won = winningTeam === match.team2;

            return (
              <motion.div
                key={match.matchNumber}
                initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.35) }}
              >
                <TiltCard
                  onClick={() => onSelectMatch(match.matchNumber)}
                  ariaLabel={`Open scorecard for Match ${match.matchNumber}: ${match.team1} vs ${match.team2}`}
                  cursorLabel="VIEW"
                  reducedMotion={reducedMotion}
                  className="border border-slate-800/90 bg-slate-900/75 hover:border-amber-400/50 transition-colors"
                >
                  <div className="p-6 space-y-5">
                    {/* Top Metadata Line (unboxed zero-pill discipline) */}
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-bold text-amber-400">
                          Match #{match.matchNumber}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{match.isCompleted ? 'Full Time' : 'Scheduled'}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sky-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                        <span>Full Scorecard</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    {/* Both Teams & Scores */}
                    <div className="space-y-3.5">
                      {/* Team 1 Row */}
                      <div className={`relative flex items-center justify-between gap-4 rounded-xl px-2 py-2 -mx-2 ${team1Won ? 'isolate' : ''}`}>
                        {team1Won && <WinnerCelebration theme={theme1} reducedMotion={reducedMotion} />}
                        <div className="relative z-10 flex items-center gap-3 min-w-0">
                          <div
                            className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center font-display text-base font-extrabold text-white border"
                            style={{
                              backgroundColor: theme1.primary,
                              borderColor: theme1.borderTint,
                            }}
                          >
                            {short1}
                          </div>
                          <span className="font-display text-2xl font-bold tracking-wide text-white truncate">
                            {match.team1}
                          </span>
                        </div>
                        <ScoreboardValue
                          value={match.score1 || '—'}
                          reducedMotion={reducedMotion}
                          className={`relative z-10 text-xl sm:text-2xl font-bold shrink-0 ${team1Won ? 'text-amber-100' : 'text-white'}`}
                        />
                      </div>

                      {/* Team 2 Row */}
                      <div className={`relative flex items-center justify-between gap-4 rounded-xl px-2 py-2 -mx-2 ${team2Won ? 'isolate' : ''}`}>
                        {team2Won && <WinnerCelebration theme={theme2} reducedMotion={reducedMotion} />}
                        <div className="relative z-10 flex items-center gap-3 min-w-0">
                          <div
                            className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center font-display text-base font-extrabold text-white border"
                            style={{
                              backgroundColor: theme2.primary,
                              borderColor: theme2.borderTint,
                            }}
                          >
                            {short2}
                          </div>
                          <span className="font-display text-2xl font-bold tracking-wide text-white truncate">
                            {match.team2}
                          </span>
                        </div>
                        <ScoreboardValue
                          value={match.score2 || '—'}
                          reducedMotion={reducedMotion}
                          className={`relative z-10 text-xl sm:text-2xl font-bold shrink-0 ${team2Won ? 'text-amber-100' : 'text-white'}`}
                        />
                      </div>
                    </div>

                    {/* Result & Man of the Match Footer */}
                    <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-emerald-300">
                        {match.result || 'Match Pending'}
                      </p>

                      {match.momName && (
                        <div className="flex items-center gap-2 text-xs text-amber-200">
                          <Award className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>
                            MoM: <strong className="text-white">{match.momName}</strong> (
                            {match.momTeam}) ·{' '}
                            <span className="font-mono-num">
                              {match.momRuns}r / {match.momWickets}w
                            </span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
