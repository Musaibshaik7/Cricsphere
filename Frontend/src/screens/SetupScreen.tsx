import React, { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Users, Trophy, Sparkles, X, ArrowRight, RotateCcw } from 'lucide-react';
import {
  TeamDTO,
  TournamentDTO,
  TournamentFormat,
  getFormatMinTeams,
  getTeamTheme,
  validateTournamentSetup,
} from '../types/cricket';
import { MagneticButton, SimulationLoader, TiltCard } from '../components/InteractiveEffects';

const LazySceneCanvas3D = React.lazy(() => import('../components/three/SceneCanvas3D'));

interface SetupScreenProps {
  teams: TeamDTO[];
  currentTournament: TournamentDTO | null;
  onCreateTournament: (payload: {
    name: string;
    format: TournamentFormat;
    teamIndexes: number[];
  }) => Promise<void>;
  onResetTournament: () => Promise<void>;
  isSubmitting: boolean;
  backendError: string | null;
  reducedMotion: boolean;
  onNavigateMatches: () => void;
}

const FORMAT_OPTIONS: {
  id: TournamentFormat;
  label: string;
  description: string;
  minTeamsLabel: string;
}[] = [
  {
    id: 'League',
    label: 'League',
    description: 'Round-robin stage where all selected teams face each other immediately.',
    minTeamsLabel: 'Min 2 teams',
  },
  {
    id: 'Knockout',
    label: 'Knockout',
    description: 'Direct elimination bracket simulated immediately by the C++ engine.',
    minTeamsLabel: 'Min 2 teams',
  },
  {
    id: 'LeagueKnockout',
    label: 'LeagueKnockout',
    description: 'Full league phase followed by playoffs & championship final.',
    minTeamsLabel: 'Min 4 teams',
  },
  {
    id: 'Custom',
    label: 'Custom',
    description: 'Build your own fixture schedule manually and trigger simulation when ready.',
    minTeamsLabel: 'Min 2 teams',
  },
];

/** A stable dimensional slogan with a cursor-following championship gold highlight. */
const InteractiveSlogan: React.FC<{ reducedMotion: boolean }> = ({ reducedMotion }) => {
  const [highlight, setHighlight] = useState<{ x: number; y: number } | null>(null);

  const moveHighlight = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setHighlight({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const tiltX = highlight ? (50 - highlight.y) * 0.035 : 0;
  const tiltY = highlight ? (highlight.x - 50) * 0.035 : 0;
  const fill = highlight
    ? `radial-gradient(circle 125px at ${highlight.x}% ${highlight.y}%, #fff8df 0%, #facc15 20%, transparent 62%), linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)`
    : 'linear-gradient(180deg, #ffffff 0%, #dbeafe 100%)';

  return (
    <div
      onPointerMove={moveHighlight}
      onPointerLeave={() => setHighlight(null)}
      className="relative max-w-3xl cursor-default select-none rounded-3xl border border-white/10 bg-black/45 px-6 py-6 shadow-[0_0_50px_rgba(2,6,23,0.48)] backdrop-blur-md sm:px-8"
    >
      <h1
        className="font-display text-5xl font-extrabold tracking-wide leading-[0.94] text-transparent transition-transform duration-150 ease-out sm:text-7xl"
        style={{
          backgroundImage: fill,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          transform: reducedMotion
            ? undefined
            : `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          filter: 'drop-shadow(0 2px 0 rgba(148,163,184,0.35)) drop-shadow(0 18px 24px rgba(0,0,0,0.45))',
        }}
      >
        Every Ball. Every Battle. One Champion.
      </h1>
    </div>
  );
};

/**
 * Screen 1: Landing / Tournament Setup
 * Displays the 3D Hero Cricket Ball, tournament configuration form, and team selector.
 */
export const SetupScreen: React.FC<SetupScreenProps> = ({
  teams,
  currentTournament,
  onCreateTournament,
  onResetTournament,
  isSubmitting,
  backendError,
  reducedMotion,
  onNavigateMatches,
}) => {
  const [name, setName] = useState(currentTournament?.name || 'Stadium Night Premier Trophy');
  const [format, setFormat] = useState<TournamentFormat>(
    currentTournament?.format || 'LeagueKnockout'
  );
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>(() =>
    teams.length >= 4 ? teams.slice(0, 4).map((t) => t.index) : teams.map((t) => t.index)
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [inspectSquadTeam, setInspectSquadTeam] = useState<TeamDTO | null>(null);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);

  // Sync default selection when teams load from GET /api/teams
  React.useEffect(() => {
    if (selectedIndexes.length === 0 && teams.length > 0) {
      setSelectedIndexes(teams.slice(0, Math.min(4, teams.length)).map((t) => t.index));
    }
  }, [teams, selectedIndexes.length]);

  const toggleTeamIndex = (idx: number) => {
    setLocalError(null);
    setSelectedIndexes((prev) =>
      prev.includes(idx) ? prev.filter((item) => item !== idx) : [...prev, idx]
    );
  };

  const selectAllTeams = () => {
    setLocalError(null);
    setSelectedIndexes(teams.map((t) => t.index));
  };

  const clearSelectedTeams = () => {
    setLocalError(null);
    setSelectedIndexes([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const validation = validateTournamentSetup(name, format, selectedIndexes);
    if (!validation.valid) {
      setLocalError(validation.error);
      return;
    }

    await onCreateTournament({
      name: name.trim(),
      format,
      teamIndexes: selectedIndexes,
    });
  };

  const minRequired = getFormatMinTeams(format);
  const activeError = backendError || localError;

  const openConfigurator = () => {
    setIsConfiguratorOpen(true);
    window.setTimeout(() => {
      document.getElementById('tournament-configurator')?.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 0);
  };

  return (
    <div className="space-y-12">
      {/* Home: Editorial stadium introduction + 3D rotating stitched cricket ball */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 sm:p-10 relative overflow-hidden">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 z-10">
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/5 px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] text-sky-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.9)]" />
              CRICSIM STADIUM NIGHT
            </p>

            <InteractiveSlogan reducedMotion={reducedMotion} />

            <p className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Build a tournament, choose your squads, and follow every match from the opening toss
              to the final trophy lift.
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-slate-400">
              <span>Live scorecards</span>
              <span className="text-slate-700" aria-hidden="true">•</span>
              <span>Points table</span>
              <span className="text-slate-700" aria-hidden="true">•</span>
              <span>Orange &amp; Purple Caps</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <MagneticButton
                onClick={currentTournament ? onNavigateMatches : openConfigurator}
                cursorLabel={currentTournament ? 'OPEN' : 'SETUP'}
                reducedMotion={reducedMotion}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-xs font-bold text-slate-950 shadow-[0_0_28px_rgba(245,158,11,0.24)] hover:from-amber-300 hover:to-amber-400"
              >
                {currentTournament ? 'Continue Tournament' : 'Build a Tournament'}
                <ArrowRight className="h-4 w-4" />
              </MagneticButton>

              {currentTournament && (
                <>
                  <MagneticButton
                    onClick={openConfigurator}
                    cursorLabel="SETUP"
                    reducedMotion={reducedMotion}
                    className="rounded-xl border border-sky-300/30 bg-sky-400/5 px-5 py-3 text-xs font-bold text-sky-200 transition-colors hover:border-sky-300/60 hover:bg-sky-400/10"
                  >
                    Tournament Setup
                  </MagneticButton>
                  <MagneticButton
                    onClick={onResetTournament}
                    disabled={isSubmitting}
                    cursorLabel="RESET"
                    reducedMotion={reducedMotion}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-400/35 bg-red-500/10 px-5 py-3 text-xs font-bold text-red-200 transition-colors hover:border-red-300/70 hover:bg-red-500/20"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Tournament
                  </MagneticButton>
                </>
              )}
            </div>
          </div>

          {currentTournament ? (
            <div className="rounded-2xl border border-slate-700/80 bg-slate-950/60 p-5 shadow-inner">
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                {currentTournament.isCompleted ? 'LATEST TOURNAMENT' : 'ACTIVE TOURNAMENT'} · {currentTournament.format}
              </div>
              <p className="mt-2 font-display text-2xl font-bold tracking-wide text-white">
                {currentTournament.name}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {currentTournament.champion
                  ? `Champion: ${currentTournament.champion}`
                  : 'Fixtures, scorecards, and standings are ready to follow.'}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/35 p-5 text-sm text-slate-400">
              Your next championship is waiting. Start by selecting a format and your competing squads.
            </div>
          )}
        </div>

        {/* 3D Rotating Cricket Ball Viewport */}
        <div className="lg:col-span-5 min-h-[290px] sm:min-h-[340px] rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-900/90 to-slate-950/90 relative flex items-center justify-center overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 45%, rgba(239, 68, 68, 0.22), rgba(14, 165, 233, 0.08) 55%, transparent 75%)',
            }}
          />
          <Suspense
            fallback={
              <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
                <div className="h-10 w-10 rounded-full bg-red-700/60 animate-pulse" />
                <span>Initializing 3D Stadium Ball...</span>
              </div>
            }
          >
            <LazySceneCanvas3D
              mode="ball"
              reducedMotion={reducedMotion}
              className="w-full h-[300px] sm:h-[340px]"
            />
          </Suspense>
          <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>Stitched Red Leather · Interactive 3D</span>
            <span className="font-mono-num">60 FPS PBR</span>
          </div>
        </div>
      </section>

      {/* The detailed setup stays behind the home call-to-action until requested. */}
      <AnimatePresence initial={false}>
        {isConfiguratorOpen && (
          <motion.section
            id="tournament-configurator"
            initial={reducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="scroll-mt-8 space-y-5"
          >
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/90 bg-slate-950/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold tracking-wide text-amber-400">TOURNAMENT WORKSPACE</p>
                <h2 className="font-display text-3xl font-bold tracking-wide text-white">Build Your Championship</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsConfiguratorOpen(false)}
                className="text-left text-xs font-semibold text-slate-400 transition hover:text-white sm:text-right"
              >
                ← Back to home
              </button>
            </div>

      {/* Tournament Setup Form */}
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Step 1 & 2: Name & Format Picker */}
          <div className="lg:col-span-5 space-y-6 rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 sm:p-8">
            <div className="space-y-1">
              <p className="text-xs font-medium text-sky-400">01. Tournament Configuration</p>
              <h2 className="font-display text-3xl font-bold tracking-wide text-white">
                Name &amp; Format
              </h2>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="tournament-name-input"
                className="block text-xs font-semibold text-slate-300"
              >
                Tournament Name
              </label>
              <input
                id="tournament-name-input"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setLocalError(null);
                }}
                placeholder="e.g. Champions Night Trophy"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <span className="block text-xs font-semibold text-slate-300">
                Tournament Format
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Tournament Format">
                {FORMAT_OPTIONS.map((opt) => {
                  const isSelected = format === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      data-cursor="button"
                      data-cursor-label="SELECT"
                      onClick={() => {
                        setFormat(opt.id);
                        setLocalError(null);
                      }}
                      className={`text-left rounded-xl border p-4 transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-xl font-bold tracking-wide text-white">
                          {opt.label}
                        </span>
                        <span className="font-mono-num text-[11px] text-amber-300">
                          {opt.minTeamsLabel}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                        {opt.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3: Team Selector Grid */}
          <div className="lg:col-span-7 space-y-6 rounded-2xl border border-slate-800/90 bg-slate-900/50 p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-sky-400">
                    02. Select Participating Squads
                  </p>
                  <h2 className="font-display text-3xl font-bold tracking-wide text-white">
                    Tick {minRequired}+ Teams ({selectedIndexes.length} Selected)
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllTeams}
                    className="rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    Select All ({teams.length})
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedTeams}
                    className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 whitespace-nowrap shrink-0"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {teams.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-400">
                  No teams loaded from <code className="font-mono-num">GET /api/teams</code>.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {teams.map((team) => {
                    const isChecked = selectedIndexes.includes(team.index);
                    const theme = getTeamTheme(team.shortCode || team.name);

                    return (
                      <TiltCard
                        key={team.index}
                        reducedMotion={reducedMotion}
                        className={`border transition-colors ${
                          isChecked
                            ? 'border-amber-400/70 bg-slate-900/95'
                            : 'border-slate-800/90 bg-slate-950/60'
                        }`}
                      >
                        <div
                          className="p-4 flex items-center justify-between gap-2.5"
                          style={{
                            background: isChecked
                              ? `linear-gradient(135deg, ${theme.bgTint}, rgba(15,23,42,0.92))`
                              : undefined,
                          }}
                        >
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isChecked}
                            aria-label={`Select ${team.name}`}
                            onClick={() => toggleTeamIndex(team.index)}
                            className="flex items-center gap-3 text-left flex-1 min-w-0 focus:outline-none"
                          >
                            <div
                              className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center font-display text-base font-extrabold text-white shadow-inner border"
                              style={{
                                backgroundColor: theme.primary,
                                borderColor: theme.borderTint,
                              }}
                            >
                              {team.shortCode}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-display text-lg sm:text-xl font-bold tracking-wide text-white leading-tight">
                                {team.name}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                #{team.index} · {team.players?.length ?? 0} Players
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {team.players && team.players.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setInspectSquadTeam(team)}
                                aria-label={`Inspect ${team.name} squad`}
                                className="rounded-md border border-slate-700/80 bg-slate-900/90 px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white hover:border-slate-500 whitespace-nowrap"
                              >
                                Squad
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleTeamIndex(team.index)}
                              aria-label={`Toggle ${team.name}`}
                              className={`h-6 w-6 rounded-md flex items-center justify-center border transition-colors ${
                                isChecked
                                  ? 'bg-amber-400 border-amber-300 text-slate-950'
                                  : 'bg-slate-900 border-slate-700 text-transparent'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </button>
                          </div>
                        </div>
                      </TiltCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Alert & Create Action */}
            <div className="pt-6 border-t border-slate-800/80 space-y-4">
              <AnimatePresence>
                {activeError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    role="alert"
                    className="rounded-xl border border-red-500/40 bg-red-950/40 p-3.5 flex items-center gap-3 text-xs text-red-200"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <span>{activeError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {isSubmitting ? (
                <SimulationLoader label="Creating tournament & running C++ simulations..." />
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-slate-400">
                    {format === 'Custom'
                      ? 'Custom mode creates the tournament shell so you can schedule individual matches next.'
                      : `Non-Custom mode (${format}) simulates all matches immediately on POST /api/tournament.`}
                  </div>

                  <MagneticButton
                    type="submit"
                    disabled={isSubmitting}
                    cursorLabel="CREATE"
                    reducedMotion={reducedMotion}
                    className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:from-amber-300 hover:to-amber-400"
                  >
                    <Trophy className="h-4 w-4" />
                    <span>Create Tournament</span>
                  </MagneticButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Squad Modal Drawer */}
      <AnimatePresence>
        {inspectSquadTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            onClick={() => setInspectSquadTeam(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`${inspectSquadTeam.name} Roster`}
              className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[82vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-amber-400" />
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white">
                      {inspectSquadTeam.name} ({inspectSquadTeam.shortCode})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Official C++ Backend Roster · {inspectSquadTeam.players?.length || 0} Players
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectSquadTeam(null)}
                  aria-label="Close squad modal"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 overflow-y-auto divide-y divide-slate-800/70">
                {inspectSquadTeam.players?.map((p, i) => (
                  <div
                    key={`${p.name}-${i}`}
                    className="py-2.5 px-2 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono-num w-8 text-right text-amber-400 font-semibold">
                        #{p.jerseyNo}
                      </span>
                      <span className="font-semibold text-white truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 shrink-0">
                      <span className="text-sky-300">{p.role}</span>
                      <span aria-hidden="true">·</span>
                      <span>{p.battingStyle}</span>
                      {p.bowlingStyle && p.bowlingStyle !== 'N/A' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{p.bowlingStyle}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
