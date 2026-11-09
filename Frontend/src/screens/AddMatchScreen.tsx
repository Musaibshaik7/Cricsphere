import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Swords, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  MatchSummaryDTO,
  TournamentDTO,
  getTeamShortBadge,
  getTeamTheme,
} from '../types/cricket';
import { MagneticButton, SimulationLoader, TiltCard } from '../components/InteractiveEffects';

interface AddMatchScreenProps {
  tournament: TournamentDTO | null;
  matches: MatchSummaryDTO[];
  onAddMatch: (teamA: number, teamB: number) => Promise<void>;
  onPlayAllMatches: () => Promise<void>;
  onSelectMatch: (matchNumber: number) => void;
  onGoToSetup: () => void;
  isSimulating: boolean;
  error: string | null;
  reducedMotion: boolean;
}

/**
 * Screen 2: Add Match (Custom format only)
 * Provides two team pickers, an Add Match button (POST /api/match),
 * a list of added matches, and a big "Play all matches" button (POST /api/play).
 */
export const AddMatchScreen: React.FC<AddMatchScreenProps> = ({
  tournament,
  matches,
  onAddMatch,
  onPlayAllMatches,
  onSelectMatch,
  onGoToSetup,
  isSimulating,
  error,
  reducedMotion,
}) => {
  const teams = tournament?.teams || [];
  const [teamAIndex, setTeamAIndex] = useState<number>(teams[0]?.index ?? 0);
  const [teamBIndex, setTeamBIndex] = useState<number>(teams[1]?.index ?? 1);
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    if (teams.length >= 2) {
      setTeamAIndex(teams[0].index);
      setTeamBIndex(teams[1].index);
    }
  }, [teams]);

  if (!tournament) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-4">
        <h2 className="font-display text-3xl font-bold text-white">No Active Tournament</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Create a tournament in Custom format first to schedule manual matchups.
        </p>
        <MagneticButton
          onClick={onGoToSetup}
          className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950"
        >
          Go to Tournament Setup
        </MagneticButton>
      </div>
    );
  }

  if (tournament.format !== 'Custom') {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center space-y-4">
        <p className="text-xs font-medium text-amber-400">
          Current Format: {tournament.format}
        </p>
        <h2 className="font-display text-3xl font-bold text-white">
          Manual Match Builder Is For Custom Format Only
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Non-Custom formats ({tournament.format}) automatically schedule and simulate all fixtures
          when created. Switch to Custom format on the Setup screen to add individual matches.
        </p>
        <MagneticButton
          onClick={onGoToSetup}
          className="rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950"
        >
          Configure New Custom Tournament
        </MagneticButton>
      </div>
    );
  }

  const handleAddFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalValidationError(null);
    if (teamAIndex === teamBIndex) {
      setLocalValidationError('Please select two distinct teams for a fixture.');
      return;
    }
    await onAddMatch(teamAIndex, teamBIndex);
  };

  const pendingCount = matches.filter((m) => !m.isCompleted).length;
  const activeError = error || localValidationError;

  return (
    <div className="space-y-10">
      {/* Header & Big Play All Matches CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-slate-800/90 bg-slate-900/60 p-6 sm:p-8">
        <div>
          <p className="text-xs font-medium text-amber-400">
            Custom Fixture Builder · {tournament.name}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-wide text-white mt-1">
            Schedule &amp; Simulate Custom Matches
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Queue matchups via <code className="font-mono-num text-slate-300">POST /api/match</code>{' '}
            and execute all pending fixtures via{' '}
            <code className="font-mono-num text-slate-300">POST /api/play</code>.
          </p>
        </div>

        <MagneticButton
          onClick={onPlayAllMatches}
          disabled={isSimulating || matches.length === 0}
          cursorLabel="PLAY"
          reducedMotion={reducedMotion}
          className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 px-8 py-4 text-base font-extrabold text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.35)] hover:from-amber-300 hover:to-orange-400"
        >
          <Play className="h-5 w-5 fill-slate-950" />
          <span>
            Play All Matches {pendingCount > 0 ? `(${pendingCount} Pending)` : ''}
          </span>
        </MagneticButton>
      </div>

      {isSimulating && <SimulationLoader label="C++ Engine executing custom fixture queue..." />}

      {/* Two Team Pickers + Add Match Form */}
      <form
        onSubmit={handleAddFixture}
        className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
          <Swords className="h-4 w-4" />
          <span>Select Competing Teams (Indexes from GET /api/tournament)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
          {/* Team A Picker */}
          <div className="md:col-span-5 space-y-2">
            <label htmlFor="picker-team-a" className="block text-xs font-semibold text-slate-300">
              Team A (Home / First Named)
            </label>
            <select
              id="picker-team-a"
              value={teamAIndex}
              onChange={(e) => {
                setTeamAIndex(Number(e.target.value));
                setLocalValidationError(null);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.index} value={t.index}>
                  [{t.shortCode}] {t.name} (index: {t.index})
                </option>
              ))}
            </select>
          </div>

          {/* VS Divider */}
          <div className="md:col-span-1 flex items-center justify-center">
            <span className="font-display text-2xl font-extrabold text-amber-400">VS</span>
          </div>

          {/* Team B Picker */}
          <div className="md:col-span-5 space-y-2">
            <label htmlFor="picker-team-b" className="block text-xs font-semibold text-slate-300">
              Team B (Visitor / Challenger)
            </label>
            <select
              id="picker-team-b"
              value={teamBIndex}
              onChange={(e) => {
                setTeamBIndex(Number(e.target.value));
                setLocalValidationError(null);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none"
            >
              {teams.map((t) => (
                <option key={t.index} value={t.index}>
                  [{t.shortCode}] {t.name} (index: {t.index})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeError && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/40 bg-red-950/40 p-3.5 flex items-center gap-2.5 text-xs text-red-200"
          >
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{activeError}</span>
          </div>
        )}

        <div className="flex justify-end">
          <MagneticButton
            type="submit"
            disabled={isSimulating}
            cursorLabel="ADD"
            reducedMotion={reducedMotion}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/15 px-6 py-3 text-sm font-bold text-amber-300 hover:bg-amber-500/25"
          >
            <Plus className="h-4 w-4" />
            <span>Add Match to Queue</span>
          </MagneticButton>
        </div>
      </form>

      {/* Added Matches Queue List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-wide text-white">
            Added Matches ({matches.length})
          </h2>
          <span className="text-xs text-slate-400">
            Click any completed match to inspect its full scorecard
          </span>
        </div>

        {matches.length === 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-10 text-center text-sm text-slate-400">
            No custom matches added yet. Pick Team A and Team B above and click &ldquo;Add Match to
            Queue&rdquo;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((match, idx) => {
              const t1Theme = getTeamTheme(match.team1);
              const t2Theme = getTeamTheme(match.team2);
              return (
                <motion.div
                  key={match.matchNumber}
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <TiltCard
                    reducedMotion={reducedMotion}
                    onClick={
                      match.isCompleted ? () => onSelectMatch(match.matchNumber) : undefined
                    }
                    className="border border-slate-800 bg-slate-900/75 p-5"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800/80">
                      <span className="font-mono-num font-semibold text-amber-400">
                        Match #{match.matchNumber}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        {match.isCompleted ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-300">Completed</span>
                          </>
                        ) : (
                          <span className="text-amber-300">Pending Simulation</span>
                        )}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-7 w-7 rounded-md flex items-center justify-center font-display text-xs font-bold text-white"
                            style={{ backgroundColor: t1Theme.primary }}
                          >
                            {getTeamShortBadge(match.team1, teams)}
                          </span>
                          <span className="font-semibold text-white">{match.team1}</span>
                        </div>
                        <span className="font-mono-num text-sm font-bold text-slate-200">
                          {match.score1 || '—'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-7 w-7 rounded-md flex items-center justify-center font-display text-xs font-bold text-white"
                            style={{ backgroundColor: t2Theme.primary }}
                          >
                            {getTeamShortBadge(match.team2, teams)}
                          </span>
                          <span className="font-semibold text-white">{match.team2}</span>
                        </div>
                        <span className="font-mono-num text-sm font-bold text-slate-200">
                          {match.score2 || '—'}
                        </span>
                      </div>
                    </div>

                    {match.result && (
                      <p className="mt-3 pt-3 border-t border-slate-800/70 text-xs text-sky-300">
                        {match.result}
                      </p>
                    )}
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
