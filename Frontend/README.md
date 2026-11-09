# CricSim Stadium Night — Cricket Tournament Simulator Front End

An award-style **Stadium Night** React + Three.js front end for a C++ Cricket Tournament Simulator backend.

All cricket calculations—ball-by-ball simulation, toss, batting/bowling scorecards, Net Run Rate (NRR), winner determination, and Orange/Purple Cap rankings—live exclusively inside the **C++ backend server**. This React client strictly displays the exact JSON numbers returned by the C++ REST API with zero client-side recalculation.

---

## Quick Start (Step-by-Step for Viva & Local Evaluation)

### Step 1: Start the C++ Backend Server First

Before launching the React front end, compile and run the C++ API server (`server.cpp`, which uses the project's `.h` files plus `httplib.h` and `json.hpp`) on port `8080`:

```bash
# Windows (MinGW-w64 with POSIX threads)
g++ -std=c++17 server.cpp -o server -lws2_32 -lwsock32
./server

# Linux / macOS
g++ -std=c++17 server.cpp -o server -pthread
./server
```

Verify that your C++ backend is listening at `http://localhost:8080`:

```bash
curl http://localhost:8080/api/teams
```

*(Note: If the C++ server is not running, the React app displays an animated "C++ Backend Server Not Running" state with a Retry button.)*

### Step 2: Install Front-End Dependencies

```bash
npm install
```

### Step 3: Start the Vite Development Server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Configuring the Backend URL (`VITE_API_BASE`)

By default, the front end connects to `http://localhost:8080`. To point it to a different host or port, set `VITE_API_BASE` in a `.env` file:

```env
VITE_API_BASE="http://localhost:8080"
```

---

## C++ Backend REST API Contract (JSON)

| Method & Endpoint | Request / Response Summary |
| :--- | :--- |
| `GET /api/teams` | `[{index, name, shortCode, players:[{name, role, jerseyNo, battingStyle, bowlingStyle}]}]` |
| `POST /api/tournament` | Body: `{name, format, teamIndexes:[..]}` where `format` is `"League" \| "Knockout" \| "LeagueKnockout" \| "Custom"`. Returns `{name, format, teams, matches, champion, isCompleted}`. |
| `GET /api/tournament` | Returns `{name, format, champion, isCompleted, teams:[{index, name, shortCode}]}` (errors before a tournament exists are handled quietly). |
| `POST /api/match` | Body: `{teamA, teamB}` (Custom format only). |
| `POST /api/play` | Plays all pending matches added in Custom format. |
| `GET /api/matches` | `[{matchNumber, team1, team2, isCompleted, result, score1, score2, momName, momTeam, momRuns, momWickets}]` |
| `GET /api/matches/{n}` | Match summary + `tossWinner, tossDecision, firstInnings, secondInnings` (`battingCard`, `didNotBat`, `bowlingCard`). |
| `GET /api/points` | `[{rank, teamName, played, won, lost, tied, points, nrr}]` |
| `GET /api/orange` | Top 10 run-scorers (`rank, name, totalRuns, matchesPlayed, battingStrikeRate, bowlingEconomy`). |
| `GET /api/purple` | Top 10 wicket-takers (`rank, name, totalWickets, matchesPlayed, battingStrikeRate, bowlingEconomy`). |

---

## Codebase Architecture (Viva Walkthrough)

- `src/types/cricket.ts` — Exact TypeScript DTO interfaces matching the C++ API JSON keys 1:1.
- `src/utils/api.ts` — Central `API_BASE` constant (`VITE_API_BASE || "http://localhost:8080"`) and fetch wrappers for all 9 endpoints.
- `src/components/three/SceneCanvas3D.tsx` — Lazy-loaded `@react-three/fiber` + `@react-three/drei` procedural 3D scenes (Rotating Stitched Cricket Ball, Spinning Championship Trophy with Confetti, and Orange/Purple 3D Caps).
- `src/components/CustomCursor.tsx` — Desktop-only cricket ball cursor with lagging ring, contextual labels (`PLAY`, `VIEW`), boundary click bursts, and reduced-motion support.
- `src/screens/SetupScreen.tsx` — Screen 1: Tournament setup, format picker, team selection, and squad inspection modal.
- `src/screens/AddMatchScreen.tsx` — Screen 2: Custom format fixture scheduler (`POST /api/match` & `POST /api/play`).
- `src/screens/MatchesScreen.tsx` — Screen 3: Match cards with scores, results, and Man of the Match badges.
- `src/screens/ScorecardScreen.tsx` — Screen 4: Full two-innings batting & bowling scorecard, toss details, and sweeping Man of the Match spotlight.
- `src/screens/PointsScreen.tsx` — Screen 5: Standings table with champion shimmer and 3D spinning trophy.
- `src/screens/CapsScreen.tsx` — Screen 6: Orange Cap and Purple Cap leaderboards with 3D cap showcase.
