import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Table2 } from 'lucide-react';
import {
  PointsRowDTO,
  TeamDTO,
  TournamentDTO,
  getTeamShortBadge,
  getTeamTheme,
} from '../types/cricket';
import { MagneticButton, ScoreboardValue } from '../components/InteractiveEffects';
import { formatNRR } from '../utils/formatters';

const LazySceneCanvas3D = React.lazy(() => import('../components/three/SceneCanvas3D'));

interface PointsScreenProps {
  points: PointsRowDTO[];
  tournament: TournamentDTO | null;
  teams: TeamDTO[];
  onGoToSetup: () => void;
  reducedMotion: boolean;
}

/**
 * Screen 5: Points Table & Champion Showcase
 * Displays the 3D spinning Trophy with confetti & light rays alongside the
 * animated rank-ordered points table with the champion row highlighted.
 */
export const PointsScreen: React.FC<PointsScreenProps> = ({
  points,
  tournament,
  teams,
  onGoToSetup,
  reducedMotion,
}) => {
  const championName = tournament?.champion || '';

  if (!tournament && points.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-4">
        <Table2 className="h-10 w-10 text-amber-400 mx-auto" />
        <h2 className="font-display text-3xl font-bold text-white">Points Table Not Available Yet</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Create and simulate a tournament to view official team standings and Net Run Rate from{' '}
          <code className="font-mono-num">GET /api/points</code>.
        </p>
        <MagneticButton
          onClick={onGoToSetup}
          className="rounded-xl bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950"
        >
          Go to Tournament Setup
        </MagneticButton>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Top Split: 3D Championship Trophy Showcase + Champion Spotlight */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-2xl border border-amber-500/30 bg-slate-900/65 p-6 sm:p-8 relative overflow-hidden">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Crown className="h-4 w-4" />
              <span>{tournament?.name || 'Tournament Standings'}</span>
              {tournament?.format && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{tournament.format}</span>
                </>
              )}
            </div>

            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-wide text-white">
              {championName
                ? `Champion: ${championName}`
                : 'Official Points Table & Standings'}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Every rank, win, tie, points tally, and Net Run Rate (NRR) below is rendered directly
              from <code className="font-mono-num text-amber-300">GET /api/points</code> with zero
              client-side recalculation.
            </p>
          </div>

          {championName && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-500/15 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-300">
                  Crowned Tournament Champion
                </p>
                <p className="font-display text-2xl font-extrabold text-white tracking-wide">
                  {championName}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3D Spinning Trophy with Confetti & Light Rays */}
        <div className="lg:col-span-5 min-h-[270px] rounded-xl border border-amber-500/25 bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-950 relative overflow-hidden flex items-center justify-center">
          {/* Light rays radial backdrop */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(245, 158, 11, 0.26), transparent 72%)',
            }}
          />
          <Suspense
            fallback={
              <div className="text-xs text-amber-300 animate-pulse">
                Loading 3D Championship Trophy...
              </div>
            }
          >
            <LazySceneCanvas3D
              mode="trophy"
              reducedMotion={reducedMotion}
              className="w-full h-[270px]"
            />
          </Suspense>
        </div>
      </section>

      {/* Rank-Ordered Points Table */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/60 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-wide text-white">
            Team Standings ({points.length} Teams)
          </h2>
          <span className="text-xs text-slate-400 font-mono-num">GET /api/points</span>
        </div>

        {points.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            No standings returned yet for this tournament.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                  <th className="py-3.5 pl-6 pr-3">Rank</th>
                  <th className="py-3.5 px-4">Team</th>
                  <th className="py-3.5 px-4 text-right">P</th>
                  <th className="py-3.5 px-4 text-right">W</th>
                  <th className="py-3.5 px-4 text-right">L</th>
                  <th className="py-3.5 px-4 text-right">T</th>
                  <th className="py-3.5 px-4 text-right">PTS</th>
                  <th className="py-3.5 pl-4 pr-6 text-right">NRR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {points.map((row, idx) => {
                  const isChampion =
                    (championName &&
                      row.teamName.toLowerCase() === championName.toLowerCase()) ||
                    (!championName && row.rank === 1);
                  const theme = getTeamTheme(row.teamName);
                  const shortCode = getTeamShortBadge(row.teamName, teams);

                  return (
                    <motion.tr
                      key={row.teamName}
                      initial={reducedMotion ? false : { opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      className={`transition-colors ${
                        isChampion
                          ? 'champion-row-shimmer'
                          : 'hover:bg-slate-800/45'
                      }`}
                    >
                      <td className="py-4 pl-6 pr-3 font-mono-num font-bold text-slate-200">
                        #{row.rank}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-8 w-8 rounded-lg flex items-center justify-center font-display text-xs font-extrabold text-white shrink-0"
                            style={{ backgroundColor: theme.primary }}
                          >
                            {shortCode}
                          </span>
                          <span className="font-display text-xl font-bold tracking-wide text-white">
                            {row.teamName}
                          </span>
                          {isChampion && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                              <Trophy className="h-3.5 w-3.5 text-amber-400" />
                              <span>Champion</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right font-mono-num text-slate-300">
                        {row.played}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-num text-emerald-400 font-semibold">
                        {row.won}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-num text-red-300">
                        {row.lost}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-num text-slate-400">
                        {row.tied}
                      </td>
                      <td className="py-4 px-4 text-right font-mono-num text-base font-extrabold text-amber-300">
                        <ScoreboardValue value={row.points} reducedMotion={reducedMotion} />
                      </td>
                      <td className="py-4 pl-4 pr-6 text-right font-mono-num font-semibold text-sky-300">
                        {formatNRR(row.nrr)}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
