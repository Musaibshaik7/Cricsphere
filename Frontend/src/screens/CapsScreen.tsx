import React, { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Award } from 'lucide-react';
import { CapPlayerDTO } from '../types/cricket';
import { MagneticButton, ScoreboardValue } from '../components/InteractiveEffects';
import { formatRate } from '../utils/formatters';

const LazySceneCanvas3D = React.lazy(() => import('../components/three/SceneCanvas3D'));

interface CapsScreenProps {
  orangeCap: CapPlayerDTO[];
  purpleCap: CapPlayerDTO[];
  onGoToSetup: () => void;
  reducedMotion: boolean;
}

/**
 * Screen 6: Caps (Orange Cap and Purple Cap tabs)
 * Features a 3D Cap & glowing orbital halo behind the #1 player and displays the
 * top 10 leaderboard exactly as returned by GET /api/orange and GET /api/purple.
 */
export const CapsScreen: React.FC<CapsScreenProps> = ({
  orangeCap,
  purpleCap,
  onGoToSetup,
  reducedMotion,
}) => {
  const [activeTab, setActiveTab] = useState<'orange' | 'purple'>('orange');

  const isOrange = activeTab === 'orange';
  const activeList = isOrange ? orangeCap : purpleCap;
  const leader = activeList[0] || null;

  return (
    <div className="space-y-8">
      {/* Header & Orange / Purple Cap Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <p
            className={`text-xs font-semibold ${
              isOrange ? 'text-orange-400' : 'text-purple-400'
            }`}
          >
            Top 10 Tournament Performers · {isOrange ? 'GET /api/orange' : 'GET /api/purple'}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-wide text-white mt-1">
            {isOrange ? 'Orange Cap — Most Runs' : 'Purple Cap — Most Wickets'}
          </h1>
        </div>

        {/* Interactive Tab Selector */}
        <div
          role="tablist"
          aria-label="Cap Leaderboards"
          className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-800 bg-slate-900/90"
        >
          <button
            type="button"
            role="tab"
            aria-selected={isOrange}
            onClick={() => setActiveTab('orange')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              isOrange
                ? 'bg-orange-500 text-slate-950 shadow-[0_0_24px_rgba(249,115,22,0.45)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span>Orange Cap</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={!isOrange}
            onClick={() => setActiveTab('purple')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              !isOrange
                ? 'bg-purple-500 text-white shadow-[0_0_24px_rgba(168,85,247,0.45)]'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Purple Cap</span>
          </button>
        </div>
      </div>

      {activeList.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center space-y-4">
          <Award className="h-10 w-10 text-orange-400 mx-auto" />
          <h2 className="font-display text-3xl font-bold text-white">
            No Leaderboard Stats Recorded Yet
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Simulate matches first so the C++ backend populates the Orange and Purple Cap
            leaderboards.
          </p>
          <MagneticButton
            onClick={onGoToSetup}
            className="rounded-xl bg-amber-400 px-6 py-3 text-xs font-bold text-slate-950"
          >
            Go to Tournament Setup
          </MagneticButton>
        </div>
      ) : (
        <>
          {/* #1 Player Spotlight with 3D Cap / Glowing Orb Behind */}
          {leader && (
            <section
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-2xl border p-6 sm:p-8 relative overflow-hidden ${
                isOrange
                  ? 'border-orange-500/40 bg-gradient-to-br from-orange-950/35 via-slate-900/90 to-slate-950 shadow-[0_0_45px_rgba(249,115,22,0.12)]'
                  : 'border-purple-500/40 bg-gradient-to-br from-purple-950/35 via-slate-900/90 to-slate-950 shadow-[0_0_45px_rgba(168,85,247,0.12)]'
              }`}
            >
              <div className="lg:col-span-7 space-y-6 z-10">
                <div className="space-y-2">
                  <span
                    className={`text-xs font-bold tracking-wider ${
                      isOrange ? 'text-orange-400' : 'text-purple-400'
                    }`}
                  >
                    RANK #1 LEADER · {isOrange ? 'ORANGE CAP HOLDER' : 'PURPLE CAP HOLDER'}
                  </span>
                  <h2 className="font-display text-4xl sm:text-6xl font-extrabold tracking-wide text-white">
                    {leader.name}
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4 border-t border-slate-800/80">
                  <div>
                    <p className="text-xs text-slate-400">
                      {isOrange ? 'Total Runs' : 'Total Wickets'}
                    </p>
                    <p
                      className={`font-mono-num text-3xl font-extrabold mt-1 ${
                        isOrange ? 'text-orange-400' : 'text-purple-400'
                      }`}
                    >
                      <ScoreboardValue
                        value={
                          isOrange
                            ? leader.totalRuns ?? 0
                            : leader.totalWickets ?? 0
                        }
                        reducedMotion={reducedMotion}
                      />
                    </p>
                  </div>

                  <div className="sm:border-l sm:border-slate-800/80 sm:pl-6">
                    <p className="text-xs text-slate-400">Matches Played</p>
                    <p className="font-mono-num text-2xl font-bold text-white mt-1">
                      {leader.matchesPlayed}
                    </p>
                  </div>

                  <div className="sm:border-l sm:border-slate-800/80 sm:pl-6">
                    <p className="text-xs text-slate-400">Batting SR</p>
                    <p className="font-mono-num text-2xl font-bold text-sky-300 mt-1">
                      {formatRate(leader.battingStrikeRate)}
                    </p>
                  </div>

                  <div className="sm:border-l sm:border-slate-800/80 sm:pl-6">
                    <p className="text-xs text-slate-400">Bowling Econ</p>
                    <p className="font-mono-num text-2xl font-bold text-emerald-300 mt-1">
                      {formatRate(leader.bowlingEconomy)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3D Procedural Cap & Glowing Halo Behind #1 Player */}
              <div className="lg:col-span-5 min-h-[250px] rounded-xl border border-slate-800/80 bg-slate-950/60 relative flex items-center justify-center overflow-hidden">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: isOrange
                      ? 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.28), transparent 70%)'
                      : 'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.28), transparent 70%)',
                  }}
                />
                <Suspense
                  fallback={
                    <div className="text-xs text-slate-400 animate-pulse">
                      Loading 3D Cap Showcase...
                    </div>
                  }
                >
                  <LazySceneCanvas3D
                    mode={isOrange ? 'orange-cap' : 'purple-cap'}
                    reducedMotion={reducedMotion}
                    className="w-full h-[250px]"
                  />
                </Suspense>
              </div>
            </section>
          )}

          {/* Top 10 Leaderboard Table */}
          <section className="rounded-2xl border border-slate-800/90 bg-slate-900/60 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold tracking-wide text-white">
                Top 10 Leaderboard
              </h3>
              <span className="font-mono-num text-xs text-slate-400">
                {isOrange ? 'Sorted by totalRuns' : 'Sorted by totalWickets'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400">
                    <th className="py-3.5 pl-6 pr-3">Rank</th>
                    <th className="py-3.5 px-4">Player Name</th>
                    <th className="py-3.5 px-4 text-right">Matches</th>
                    <th className="py-3.5 px-4 text-right">
                      {isOrange ? 'Total Runs' : 'Total Wickets'}
                    </th>
                    <th className="py-3.5 px-4 text-right">Batting SR</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Bowling Econ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {activeList.map((player, idx) => {
                    const isTop = player.rank === 1;
                    const primaryStat = isOrange
                      ? player.totalRuns ?? 0
                      : player.totalWickets ?? 0;

                    return (
                      <motion.tr
                        key={`${player.name}-${player.rank}`}
                        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.03 }}
                        className={`transition-colors ${
                          isTop
                            ? isOrange
                              ? 'bg-orange-500/10'
                              : 'bg-purple-500/10'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-4 pl-6 pr-3 font-mono-num font-bold text-slate-200">
                          #{player.rank}
                        </td>
                        <td className="py-4 px-4 font-display text-xl font-bold tracking-wide text-white">
                          {player.name}
                        </td>
                        <td className="py-4 px-4 text-right font-mono-num text-slate-300">
                          {player.matchesPlayed}
                        </td>
                        <td
                          className={`py-4 px-4 text-right font-mono-num text-lg font-extrabold ${
                            isOrange ? 'text-orange-400' : 'text-purple-400'
                          }`}
                        >
                          <ScoreboardValue value={primaryStat} reducedMotion={reducedMotion} />
                        </td>
                        <td className="py-4 px-4 text-right font-mono-num text-slate-300">
                          {formatRate(player.battingStrikeRate)}
                        </td>
                        <td className="py-4 pl-4 pr-6 text-right font-mono-num text-slate-300">
                          {formatRate(player.bowlingEconomy)}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
