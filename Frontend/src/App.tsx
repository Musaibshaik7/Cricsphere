import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Lenis from 'lenis';
import {
  CapPlayerDTO,
  MatchDetailDTO,
  MatchSummaryDTO,
  PointsRowDTO,
  ScreenId,
  TeamDTO,
  TournamentDTO,
  TournamentFormat,
} from './types/cricket';
import {
  API_BASE,
  ApiRejectError,
  BackendOfflineError,
  addCustomMatch,
  createTournament,
  fetchMatchDetail,
  fetchMatches,
  fetchOrangeCap,
  fetchPointsTable,
  fetchPurpleCap,
  fetchTeams,
  fetchTournamentQuietly,
  playPendingMatches,
  resetTournament,
} from './utils/api';
import { CustomCursor } from './components/CustomCursor';
import { BackendOfflineState } from './components/BackendOfflineState';
import { MatchSimulationOverlay, WelcomeIntro } from './components/InteractiveEffects';
import { SetupScreen } from './screens/SetupScreen';
import { AddMatchScreen } from './screens/AddMatchScreen';
import { MatchesScreen } from './screens/MatchesScreen';
import { ScorecardScreen } from './screens/ScorecardScreen';
import { PointsScreen } from './screens/PointsScreen';
import { CapsScreen } from './screens/CapsScreen';

const MINIMUM_MATCH_SIMULATION_MS = 3000;
const MINIMUM_SCORECARD_REVEAL_MS = 2400;

const keepSimulationVisible = async (startedAt: number) => {
  const remaining = MINIMUM_MATCH_SIMULATION_MS - (performance.now() - startedAt);
  if (remaining > 0) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
  }
};

const keepScorecardRevealVisible = async (startedAt: number) => {
  const remaining = MINIMUM_SCORECARD_REVEAL_MS - (performance.now() - startedAt);
  if (remaining > 0) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
  }
};

export function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('setup');
  const [teams, setTeams] = useState<TeamDTO[]>([]);
  const [tournament, setTournament] = useState<TournamentDTO | null>(null);
  const [matches, setMatches] = useState<MatchSummaryDTO[]>([]);
  const [selectedMatchDetail, setSelectedMatchDetail] = useState<MatchDetailDTO | null>(null);
  const [points, setPoints] = useState<PointsRowDTO[]>([]);
  const [orangeCap, setOrangeCap] = useState<CapPlayerDTO[]>([]);
  const [purpleCap, setPurpleCap] = useState<CapPlayerDTO[]>([]);

  const [backendOffline, setBackendOffline] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isMatchSimulation, setIsMatchSimulation] = useState<boolean>(false);
  const [isScorecardLoading, setIsScorecardLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState<boolean>(true);
  const [setupVersion, setSetupVersion] = useState<number>(0);

  const dismissWelcomeIntro = useCallback(() => setShowWelcomeIntro(false), []);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Initialize Lenis smooth scroll when reduced motion is off
  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
    });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reducedMotion]);

  // Synchronize all tournament data (matches, points, orange/purple caps) from the C++ API
  const refreshTournamentData = useCallback(async () => {
    const [tourneyRes, matchesRes, pointsRes, orangeRes, purpleRes] = await Promise.all([
      fetchTournamentQuietly(),
      fetchMatches().catch(() => [] as MatchSummaryDTO[]),
      fetchPointsTable().catch(() => [] as PointsRowDTO[]),
      fetchOrangeCap().catch(() => [] as CapPlayerDTO[]),
      fetchPurpleCap().catch(() => [] as CapPlayerDTO[]),
    ]);

    setTournament(tourneyRes);
    setMatches(matchesRes);
    setPoints(pointsRes);
    setOrangeCap(orangeRes);
    setPurpleCap(purpleRes);
  }, []);

  // Initial bootstrap: GET /api/teams and GET /api/tournament (quietly)
  const bootstrapFromBackend = useCallback(async () => {
    setIsInitialLoading(true);
    setErrorMessage(null);
    try {
      const loadedTeams = await fetchTeams();
      setTeams(loadedTeams);
      setBackendOffline(false);

      const existingTourney = await fetchTournamentQuietly();
      if (existingTourney) {
        setTournament(existingTourney);
        await refreshTournamentData();
      }
    } catch (err) {
      if (err instanceof BackendOfflineError) {
        setBackendOffline(true);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      setIsInitialLoading(false);
    }
  }, [refreshTournamentData]);

  useEffect(() => {
    bootstrapFromBackend();
  }, [bootstrapFromBackend]);

  // Handler: POST /api/tournament
  const handleCreateTournament = async (payload: {
    name: string;
    format: TournamentFormat;
    teamIndexes: number[];
  }) => {
    const simulationStartedAt = performance.now();
    const willSimulateMatches = payload.format !== 'Custom';
    setIsSimulating(true);
    setIsMatchSimulation(willSimulateMatches);
    setErrorMessage(null);
    try {
      const created = await createTournament(payload);
      setTournament(created);
      await refreshTournamentData();
      if (payload.format === 'Custom') {
        setActiveScreen('add-match');
      } else {
        setActiveScreen('matches');
      }
    } catch (err) {
      if (err instanceof BackendOfflineError) {
        setBackendOffline(true);
      } else if (err instanceof ApiRejectError || err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      if (willSimulateMatches) {
        await keepSimulationVisible(simulationStartedAt);
      }
      setIsMatchSimulation(false);
      setIsSimulating(false);
    }
  };

  // Handler: POST /api/match (Custom format only)
  const handleAddCustomMatch = async (teamA: number, teamB: number) => {
    setIsSimulating(true);
    setErrorMessage(null);
    try {
      await addCustomMatch({ teamA, teamB });
      const updatedMatches = await fetchMatches();
      setMatches(updatedMatches);
    } catch (err) {
      if (err instanceof BackendOfflineError) {
        setBackendOffline(true);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: POST /api/play (Custom format only)
  const handlePlayAllMatches = async () => {
    const simulationStartedAt = performance.now();
    setIsSimulating(true);
    setIsMatchSimulation(true);
    setErrorMessage(null);
    try {
      await playPendingMatches();
      await refreshTournamentData();
      setActiveScreen('matches');
    } catch (err) {
      if (err instanceof BackendOfflineError) {
        setBackendOffline(true);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      await keepSimulationVisible(simulationStartedAt);
      setIsMatchSimulation(false);
      setIsSimulating(false);
    }
  };

  // Handler: POST /api/reset
  const handleResetTournament = async () => {
    setIsSimulating(true);
    setErrorMessage(null);
    try {
      await resetTournament();
      setTournament(null);
      setMatches([]);
      setPoints([]);
      setOrangeCap([]);
      setPurpleCap([]);
      setSelectedMatchDetail(null);
      setSetupVersion((version) => version + 1);
      setActiveScreen('setup');
    } catch (err) {
      if (err instanceof BackendOfflineError) {
        setBackendOffline(true);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: GET /api/matches/{n}
  const handleOpenMatchScorecard = async (matchNumber: number) => {
    const revealStartedAt = performance.now();
    setActiveScreen('scorecard');
    setSelectedMatchDetail(null);
    setIsScorecardLoading(true);
    setErrorMessage(null);
    try {
      const detail = await fetchMatchDetail(matchNumber);
      setSelectedMatchDetail(detail);
    } catch (err) {
      if (err instanceof BackendOfflineError) {
        setBackendOffline(true);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      }
    } finally {
      await keepScorecardRevealVisible(revealStartedAt);
      setIsScorecardLoading(false);
    }
  };

  const navItems: { id: ScreenId; label: string }[] = [
    { id: 'setup', label: 'Setup' },
    { id: 'matches', label: 'Matches' },
    { id: 'scorecard', label: 'Scorecard' },
    { id: 'points', label: 'Points' },
    { id: 'caps', label: 'Caps' },
  ];

  return (
    <div className="min-h-screen stadium-floodlight-bg text-slate-100 flex flex-col">
      <CustomCursor
        isSimulating={isSimulating || isScorecardLoading}
        reducedMotion={reducedMotion}
      />
      <AnimatePresence>
        {showWelcomeIntro && (
          <WelcomeIntro reducedMotion={reducedMotion} onComplete={dismissWelcomeIntro} />
        )}
      </AnimatePresence>
      {isMatchSimulation && <MatchSimulationOverlay reducedMotion={reducedMotion} />}

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/80 bg-[#070A12]/90">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#setup"
          onClick={(e) => {
            e.preventDefault();
            setActiveScreen('setup');
          }}
          className="font-display text-2xl font-extrabold tracking-wider text-white whitespace-nowrap shrink-0"
        >
          CRICSIM STADIUM NIGHT
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300"
        >
          {navItems.map((item) => {
            const isActive = activeScreen === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveScreen(item.id);
                }}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
                  isActive
                    ? 'border-amber-400 text-amber-300 font-semibold'
                    : 'border-transparent text-slate-300 hover:text-white hover:border-slate-600'
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

      </header>

      {/* Secondary Mobile Navigation & Custom Format Shortcut Toolbar */}
      <div className="border-b border-slate-800/60 bg-slate-950/60 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex md:hidden items-center gap-4 overflow-x-auto py-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveScreen(item.id)}
              className={`whitespace-nowrap font-semibold ${
                activeScreen === item.id ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span>API Endpoint:</span>
          <code className="font-mono-num text-slate-200">{API_BASE}</code>
          {tournament?.format === 'Custom' && (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setActiveScreen('add-match')}
                className={`font-semibold underline underline-offset-4 ${
                  activeScreen === 'add-match'
                    ? 'text-amber-300'
                    : 'text-sky-300 hover:text-white'
                }`}
              >
                Add / Play Custom Matches
              </button>
            </>
          )}
        </div>

      </div>

      {/* Main Content Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {backendOffline ? (
          <BackendOfflineState
            onRetry={bootstrapFromBackend}
            isRetrying={isInitialLoading}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {activeScreen === 'setup' && (
                <SetupScreen
                  key={setupVersion}
                  teams={teams}
                  currentTournament={tournament}
                  onCreateTournament={handleCreateTournament}
                  onResetTournament={handleResetTournament}
                  isSubmitting={isSimulating}
                  backendError={errorMessage}
                  reducedMotion={reducedMotion}
                  onNavigateMatches={() => setActiveScreen('matches')}
                />
              )}

              {activeScreen === 'add-match' && (
                <AddMatchScreen
                  tournament={tournament}
                  matches={matches}
                  onAddMatch={handleAddCustomMatch}
                  onPlayAllMatches={handlePlayAllMatches}
                  onSelectMatch={handleOpenMatchScorecard}
                  onGoToSetup={() => setActiveScreen('setup')}
                  isSimulating={isSimulating}
                  error={errorMessage}
                  reducedMotion={reducedMotion}
                />
              )}

              {activeScreen === 'matches' && (
                <MatchesScreen
                  matches={matches}
                  teams={teams}
                  tournament={tournament}
                  onSelectMatch={handleOpenMatchScorecard}
                  onGoToSetup={() => setActiveScreen('setup')}
                  onGoToAddMatch={() => setActiveScreen('add-match')}
                  reducedMotion={reducedMotion}
                />
              )}

              {activeScreen === 'scorecard' && (
                <ScorecardScreen
                  matchDetail={selectedMatchDetail}
                  isLoading={isScorecardLoading}
                  teams={teams}
                  onBackToMatches={() => setActiveScreen('matches')}
                  reducedMotion={reducedMotion}
                />
              )}

              {activeScreen === 'points' && (
                <PointsScreen
                  points={points}
                  tournament={tournament}
                  teams={teams}
                  onGoToSetup={() => setActiveScreen('setup')}
                  reducedMotion={reducedMotion}
                />
              )}

              {activeScreen === 'caps' && (
                <CapsScreen
                  orangeCap={orangeCap}
                  purpleCap={purpleCap}
                  onGoToSetup={() => setActiveScreen('setup')}
                  reducedMotion={reducedMotion}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-800/70 px-6 py-6 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            CricSim Stadium Night — Pure React + Three.js Front End for C++ Cricket Tournament
            Simulator ({API_BASE})
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveScreen('setup')}
              className="hover:text-white transition-colors"
            >
              Tournament Setup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
