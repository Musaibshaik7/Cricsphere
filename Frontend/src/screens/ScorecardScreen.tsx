import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, Coins, ShieldAlert } from 'lucide-react';
import {
  InningsDTO,
  MatchDetailDTO,
  TeamDTO,
  getTeamShortBadge,
  getTeamTheme,
} from '../types/cricket';
import {
  MagneticButton,
  ScoreboardValue,
  CoinTossReveal,
} from '../components/InteractiveEffects';
import { WinnerBadge, WinnerCelebration } from '../components/WinnerCelebration';
import { formatRate } from '../utils/formatters';
import { getWinningTeam } from '../utils/matchResult';

interface ScorecardScreenProps {
  matchDetail: MatchDetailDTO | null;
  isLoading: boolean;
  teams: TeamDTO[];
  onBackToMatches: () => void;
  reducedMotion: boolean;
}

const TopScorerBurst: React.FC<{ reducedMotion: boolean; color: string }> = ({
  reducedMotion,
  color,
}) => {
  const pieces = [
    { x: -22, y: -26, rotate: -40, color },
    { x: 8, y: -34, rotate: 55, color: '#FACC15' },
    { x: 28, y: -17, rotate: 105, color: '#38BDF8' },
    { x: 24, y: 20, rotate: 160, color: '#F472B6' },
    { x: -9, y: 27, rotate: 220, color: '#34D399' },
    { x: -30, y: 10, rotate: 280, color: '#FBBF24' },
  ];

  return (
    <span aria-hidden="true" className="pointer-events-none absolute left-16 top-1/2 z-0">
      <span className="absolute -inset-5 rounded-full bg-amber-300/15 blur-md" />
      {!reducedMotion &&
        pieces.map((piece, index) => (
          <motion.span
            key={`${piece.color}-${index}`}
            className="absolute h-1.5 w-1 rounded-sm"
            style={{ backgroundColor: piece.color }}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 0.9, 0.45],
              x: [0, piece.x * 0.55, piece.x, piece.x * 1.15],
              y: [0, piece.y * 0.55, piece.y, piece.y * 1.15],
              rotate: [0, piece.rotate * 0.55, piece.rotate, piece.rotate * 1.3],
            }}
            transition={{ duration: 3.4, delay: index * 0.06, ease: 'easeOut' }}
          />
        ))}
    </span>
  );
};

/**
 * Renders one innings block (batting table + didNotBat list + bowling table)
 * using the exact fields returned by GET /api/matches/{n}.
 */
const InningsCardBlock: React.FC<{
  innings: InningsDTO;
  inningsLabel: string;
  teams: TeamDTO[];
  reducedMotion: boolean;
}> = ({ innings, inningsLabel, teams, reducedMotion }) => {
  const batTheme = getTeamTheme(innings.battingTeam);
  const shortCode = getTeamShortBadge(innings.battingTeam, teams);
  const highestRuns = Math.max(0, ...innings.battingCard.map((row) => row.runs));

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 overflow-hidden">
      {/* Innings Header */}
      <div
        className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{
          background: `linear-gradient(90deg, ${batTheme.bgTint}, rgba(15, 23, 42, 0.9))`,
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center font-display text-lg font-extrabold text-white border"
            style={{
              backgroundColor: batTheme.primary,
              borderColor: batTheme.borderTint,
            }}
          >
            {shortCode}
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">
              {inningsLabel} · Bowling: {innings.bowlingTeam}
            </p>
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-white">
              {innings.battingTeam}
            </h3>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="font-mono-num text-2xl sm:text-3xl font-extrabold text-white">
            <ScoreboardValue value={innings.totalRuns} reducedMotion={reducedMotion} />/
            <ScoreboardValue value={innings.totalWickets} reducedMotion={reducedMotion} />{' '}
            <span className="text-base font-medium text-slate-300">
              ({innings.overs} ov)
            </span>
          </div>
        </div>
      </div>

      {/* Batting Card Table */}
      <div className="p-5 sm:p-6 space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                <th className="py-2.5 pr-4">Batter</th>
                <th className="py-2.5 px-3">Dismissal</th>
                <th className="py-2.5 px-3 text-right">R</th>
                <th className="py-2.5 px-3 text-right">B</th>
                <th className="py-2.5 px-3 text-right">4s</th>
                <th className="py-2.5 px-3 text-right">6s</th>
                <th className="py-2.5 pl-3 text-right">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {innings.battingCard.map((row, i) => {
                const isNotOut = row.dismissal.toLowerCase().includes('not out');
                const hasBoundaryBurst = row.sixes > 0 || row.fours >= 4;
                const isTopScorer = highestRuns > 0 && row.runs === highestRuns;
                return (
                  <tr
                    key={`${row.playerName}-${i}`}
                    className={`transition-colors ${
                      isTopScorer ? 'bg-amber-400/[0.055] hover:bg-amber-400/[0.09]' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="relative py-3 pr-4 font-semibold text-white whitespace-nowrap">
                      {isTopScorer && <TopScorerBurst reducedMotion={reducedMotion} color={batTheme.primary} />}
                      <span className="relative z-10">
                        {row.playerName}
                        {isNotOut ? ' *' : ''}
                        {isTopScorer && (
                          <span className="ml-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-amber-200">
                            TOP SCORE
                          </span>
                        )}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 text-xs ${
                        isNotOut ? 'text-emerald-400 font-medium' : 'text-red-300/85'
                      }`}
                    >
                      {row.dismissal}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono-num font-bold ${
                        hasBoundaryBurst ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      <ScoreboardValue value={row.runs} reducedMotion={reducedMotion} />
                    </td>
                    <td className="py-3 px-3 text-right font-mono-num text-slate-300">
                      {row.ballsFaced}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono-num ${
                        row.fours > 0 ? 'text-sky-300 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      {row.fours}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono-num ${
                        row.sixes > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {row.sixes}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono-num text-slate-300">
                      {formatRate(row.strikeRate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Did Not Bat */}
        {innings.didNotBat && innings.didNotBat.length > 0 && (
          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5 text-xs text-slate-300">
            <span className="font-semibold text-slate-400">Did Not Bat: </span>
            <span>{innings.didNotBat.join(' · ')}</span>
          </div>
        )}

        {/* Bowling Card Table */}
        <div className="pt-2">
          <h4 className="font-display text-lg font-bold tracking-wide text-slate-200 mb-2">
            Bowling — {innings.bowlingTeam}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 pr-4">Bowler</th>
                  <th className="py-2.5 px-3 text-right">O</th>
                  <th className="py-2.5 px-3 text-right">M</th>
                  <th className="py-2.5 px-3 text-right">R</th>
                  <th className="py-2.5 px-3 text-right">W</th>
                  <th className="py-2.5 pl-3 text-right">ECON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                {innings.bowlingCard.map((b, i) => {
                  const hasWickets = b.wickets > 0;
                  return (
                    <tr
                      key={`${b.playerName}-${i}`}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pr-4 font-semibold text-white whitespace-nowrap">
                        {b.playerName}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-slate-300">
                        {b.overs}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-slate-400">
                        {b.maidens}
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num text-slate-200">
                        {b.runsConceded}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono-num font-bold ${
                          hasWickets ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        <ScoreboardValue value={b.wickets} reducedMotion={reducedMotion} />
                      </td>
                      <td className="py-3 pl-3 text-right font-mono-num text-slate-300">
                        {formatRate(b.economy)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Screen 4: Scorecard
 * Shows toss winner/decision, result, Man of the Match spotlight with sweeping beam,
 * and full batting & bowling tables for both innings.
 */
export const ScorecardScreen: React.FC<ScorecardScreenProps> = ({
  matchDetail,
  isLoading,
  teams,
  onBackToMatches,
  reducedMotion,
}) => {
  const [activeInningsFilter, setActiveInningsFilter] = useState<'both' | 'first' | 'second'>('both');

  if (isLoading) {
    return (
      <CoinTossReveal
        tossWinner={matchDetail?.tossWinner}
        tossDecision={matchDetail?.tossDecision}
        reducedMotion={reducedMotion}
      />
    );
  }

  if (!matchDetail) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-4">
        <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto" />
        <h2 className="font-display text-3xl font-bold text-white">No Match Selected</h2>
        <p className="text-sm text-slate-400">
          Select a completed match from the Matches list to view its scorecard.
        </p>
        <MagneticButton
          onClick={onBackToMatches}
          className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950"
        >
          Back to Matches
        </MagneticButton>
      </div>
    );
  }

  const theme1 = getTeamTheme(matchDetail.team1);
  const theme2 = getTeamTheme(matchDetail.team2);
  const winningTeam = getWinningTeam(matchDetail);
  const team1Won = winningTeam === matchDetail.team1;
  const team2Won = winningTeam === matchDetail.team2;

  return (
    <div className="space-y-8">
      {/* Top Navigation & Innings View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <MagneticButton
          onClick={onBackToMatches}
          cursorLabel="BACK"
          reducedMotion={reducedMotion}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Matches</span>
        </MagneticButton>

        <div className="flex items-center gap-1 p-1 rounded-xl border border-slate-800 bg-slate-900/90">
          {(
            [
              { id: 'both', label: 'Both Innings' },
              { id: 'first', label: '1st Innings' },
              { id: 'second', label: '2nd Innings' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveInningsFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeInningsFilter === tab.id
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match Summary Banner + Toss + Result */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-6 sm:p-8 space-y-6 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono-num font-bold text-amber-400">
              Match #{matchDetail.matchNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span>Official C++ Scorecard</span>
          </div>

          {matchDetail.tossWinner && (
            <div className="flex items-center gap-2 text-sky-300">
              <Coins className="h-3.5 w-3.5 text-amber-400" />
              <span>
                Toss: <strong>{matchDetail.tossWinner}</strong> elected to{' '}
                <strong>{matchDetail.tossDecision}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Scoreboard Faceoff */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
          <div className={`relative isolate overflow-hidden md:col-span-5 flex items-center justify-between gap-4 rounded-xl bg-slate-950/70 border p-4 ${team1Won ? 'border-amber-300/50' : 'border-slate-800/80'}`}>
            {team1Won && <WinnerCelebration theme={theme1} reducedMotion={reducedMotion} />}
            <div className="relative z-10 flex items-center gap-3 min-w-0">
              <div
                className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center font-display text-lg font-extrabold text-white"
                style={{ backgroundColor: theme1.primary }}
              >
                {getTeamShortBadge(matchDetail.team1, teams)}
              </div>
              <span className="font-display text-2xl sm:text-3xl font-bold text-white truncate">
                {matchDetail.team1}
              </span>
            </div>
            <div className="relative z-10 flex flex-col items-end gap-1.5">
              {team1Won && <WinnerBadge />}
              <ScoreboardValue
                value={matchDetail.score1}
                reducedMotion={reducedMotion}
                className="text-xl sm:text-2xl font-extrabold text-white shrink-0"
              />
            </div>
          </div>

          <div className="md:col-span-1 text-center font-display text-2xl font-bold text-slate-500">
            VS
          </div>

          <div className={`relative isolate overflow-hidden md:col-span-5 flex items-center justify-between gap-4 rounded-xl bg-slate-950/70 border p-4 ${team2Won ? 'border-amber-300/50' : 'border-slate-800/80'}`}>
            {team2Won && <WinnerCelebration theme={theme2} reducedMotion={reducedMotion} />}
            <div className="relative z-10 flex items-center gap-3 min-w-0">
              <div
                className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center font-display text-lg font-extrabold text-white"
                style={{ backgroundColor: theme2.primary }}
              >
                {getTeamShortBadge(matchDetail.team2, teams)}
              </div>
              <span className="font-display text-2xl sm:text-3xl font-bold text-white truncate">
                {matchDetail.team2}
              </span>
            </div>
            <div className="relative z-10 flex flex-col items-end gap-1.5">
              {team2Won && <WinnerBadge />}
              <ScoreboardValue
                value={matchDetail.score2}
                reducedMotion={reducedMotion}
                className="text-xl sm:text-2xl font-extrabold text-white shrink-0"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 text-center">
          <p className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-emerald-400">
            {matchDetail.result}
          </p>
        </div>
      </section>

      {/* Man of the Match Spotlight with Sweeping Stadium Beam */}
      {matchDetail.momName && (
        <motion.section
          initial={reducedMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/90 p-6 sm:p-8"
        >
          {/* Sweeping floodlight beam */}
          {!reducedMotion && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
              className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent"
            />
          )}

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                <Award className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-400">
                  Man of the Match Spotlight · {matchDetail.momTeam}
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wide text-white">
                  {matchDetail.momName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-6 font-mono-num">
              <div>
                <p className="text-xs text-slate-400">Runs Scored</p>
                <p className="text-2xl font-extrabold text-amber-300">{matchDetail.momRuns}</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div>
                <p className="text-xs text-slate-400">Wickets Taken</p>
                <p className="text-2xl font-extrabold text-sky-300">{matchDetail.momWickets}</p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* First & Second Innings Tables */}
      <div className="space-y-8">
        {(activeInningsFilter === 'both' || activeInningsFilter === 'first') &&
          matchDetail.firstInnings && (
            <InningsCardBlock
              innings={matchDetail.firstInnings}
              inningsLabel="1st Innings"
              teams={teams}
              reducedMotion={reducedMotion}
            />
          )}

        {(activeInningsFilter === 'both' || activeInningsFilter === 'second') &&
          matchDetail.secondInnings && (
            <InningsCardBlock
              innings={matchDetail.secondInnings}
              inningsLabel="2nd Innings"
              teams={teams}
              reducedMotion={reducedMotion}
            />
          )}
      </div>
    </div>
  );
};
