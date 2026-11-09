// Innings.h - The heart of the simulation: ball-by-ball innings engine
#ifndef INNINGS_H
#define INNINGS_H

#include <vector>
#include <string>
#include <iostream>
#include <iomanip>
#include "Team.h"
#include "BattingScorecard.h"
#include "BowlingScorecard.h"
#include "Utils.h"

using namespace std;

class Innings {
public:
    Team* battingTeam;
    Team* bowlingTeam;
    int totalRuns;
    int totalWickets;
    int totalBalls;
    int extras;
    vector<BattingScorecard> battingCard;
    vector<BowlingScorecard> bowlingCard;
    vector<int> bowlerPlayerIndices; // Maps bowlingCard index -> bowlingTeam player index

    // The weighted random outcomes array
    // 0 = dot, 1 = single, 2 = double, 4 = four, 6 = six, -1 = wicket
    // A value that appears more times is more likely to be picked.
    // 10 dots, 9 singles, 3 doubles, 1 triple, 3 fours, 2 sixes, 2 wickets (out of 30)
    int outcomes[30] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                        1, 1, 1, 1, 1, 1, 1, 1, 1,
                        2, 2, 2,
                        3,
                        4, 4, 4,
                        6, 6,
                        -1, -1};
    int outcomeSize = 30;

    // Default constructor
    Innings() {
        battingTeam = nullptr;
        bowlingTeam = nullptr;
        totalRuns = 0;
        totalWickets = 0;
        totalBalls = 0;
        extras = 0;
    }

    // Constructor - sets up batting and bowling cards
    Innings(Team* bat, Team* bowl) {
        battingTeam = bat;
        bowlingTeam = bowl;
        totalRuns = 0;
        totalWickets = 0;
        totalBalls = 0;
        extras = 0;

        // Create batting scorecard for each player (in batting order)
        for (int i = 0; i < (int)battingTeam->players.size(); i++) {
            battingCard.push_back(BattingScorecard(battingTeam->players[i].name));
        }

        // Create bowling scorecard only for players who can bowl
        vector<int> bowlerIdx = bowlingTeam->getBowlerIndices();
        for (int i = 0; i < (int)bowlerIdx.size(); i++) {
            bowlingCard.push_back(BowlingScorecard(bowlingTeam->players[bowlerIdx[i]].name));
            bowlerPlayerIndices.push_back(bowlerIdx[i]);
        }
    }

    // Select a random bowler (not same as last over, max 4 overs each)
    int selectBowler(int lastBowlerIdx) {
        vector<int> available;

        // Find bowlers who can still bowl and aren't the last bowler
        for (int i = 0; i < (int)bowlingCard.size(); i++) {
            if (i != lastBowlerIdx && bowlingCard[i].ballsBowled < 24) {
                available.push_back(i);
            }
        }

        // If no one available except last bowler, allow them
        if (available.empty()) {
            for (int i = 0; i < (int)bowlingCard.size(); i++) {
                if (bowlingCard[i].ballsBowled < 24) {
                    available.push_back(i);
                }
            }
        }

        // Safety check
        if (available.empty()) return 0;

        // Pick randomly from available bowlers
        return available[rand() % available.size()];
    }

    // Simulate the entire innings
    // target = -1 for first innings (bat freely)
    // target > 0 for second innings (chasing a target)
    void simulate(int target = -1) {
        int strikerIdx = 0;      // Batting card index of striker
        int nonStrikerIdx = 1;   // Batting card index of non-striker
        int nextBatterIdx = 2;   // Next batter to come in after a wicket
        int lastBowlerIdx = -1;  // Prevent same bowler bowling consecutive overs
        int maxBatters = (int)battingTeam->players.size();
        bool inningsOver = false;

        cout << "\n============================================" << endl;
        cout << "  " << battingTeam->name << " INNINGS";
        if (target > 0) {
            cout << "  (Target: " << target << ")";
        }
        cout << endl;
        cout << "============================================\n" << endl;

        // Simulate 20 overs
        for (int over = 0; over < 20 && !inningsOver; over++) {

            // Pick a random bowler for this over
            int bowlerIdx = selectBowler(lastBowlerIdx);
            int runsThisOver = 0;

            cout << "Over " << setw(2) << (over + 1) << " | "
                 << setw(15) << left << bowlingCard[bowlerIdx].playerName
                 << right << " | ";

            // Bowl 6 balls in this over
            for (int ball = 0; ball < 6 && !inningsOver; ball++) {

                // Pick a random outcome
                int outcome = outcomes[rand() % outcomeSize];

                // Every ball: batter faces it, bowler bowls it
                totalBalls++;
                battingCard[strikerIdx].ballsFaced++;
                bowlingCard[bowlerIdx].ballsBowled++;

                if (outcome == -1) {
                    // ---- WICKET ----
                    totalWickets++;
                    string dismissal = getRandomDismissal();
                    battingCard[strikerIdx].isOut = true;
                    battingCard[strikerIdx].howOut = dismissal;
                    battingCard[strikerIdx].bowlerName = bowlingCard[bowlerIdx].playerName;
                    bowlingCard[bowlerIdx].wickets++;

                    cout << "W ";

                    // Check if innings is over (no more batters)
                    if (nextBatterIdx >= maxBatters) {
                        inningsOver = true;
                    } else {
                        // New batter comes in at striker's end
                        strikerIdx = nextBatterIdx;
                        nextBatterIdx++;
                    }

                } else {
                    // ---- RUNS SCORED ----
                    totalRuns += outcome;
                    battingCard[strikerIdx].runs += outcome;
                    bowlingCard[bowlerIdx].runsConceded += outcome;
                    runsThisOver += outcome;

                    // Track boundaries
                    if (outcome == 4) battingCard[strikerIdx].fours++;
                    if (outcome == 6) battingCard[strikerIdx].sixes++;

                    cout << outcome << " ";

                    // Rotate strike on odd runs (1, 3)
                    if (outcome % 2 == 1) {
                        int temp = strikerIdx;
                        strikerIdx = nonStrikerIdx;
                        nonStrikerIdx = temp;
                    }

                    // Check if target reached (2nd innings)
                    if (target > 0 && totalRuns >= target) {
                        inningsOver = true;
                    }
                }
            }

            // Check for maiden over (0 runs in the over)
            if (runsThisOver == 0 && !inningsOver) {
                bowlingCard[bowlerIdx].maidens++;
            }

            // Display score after each over
            cout << "| " << totalRuns << "/" << totalWickets << endl;

            // Rotate strike at end of over (non-striker faces first ball of next over)
            int temp = strikerIdx;
            strikerIdx = nonStrikerIdx;
            nonStrikerIdx = temp;

            lastBowlerIdx = bowlerIdx;
        }

        // Innings summary
        cout << "\n--------------------------------------------" << endl;
        cout << "  " << battingTeam->name << ": " << totalRuns << "/" << totalWickets
             << " (" << ballsToOvers(totalBalls) << " overs)" << endl;
        cout << "--------------------------------------------" << endl;
    }

    // Display the full detailed scorecard
    void displayScorecard() {
        // ---- BATTING SCORECARD ----
        cout << "\n";
        printDoubleLine();
        cout << "  " << battingTeam->name << " - BATTING" << endl;
        printDoubleLine();

        cout << left << setw(18) << "Batter"
             << left << setw(28) << "Dismissal"
             << right << setw(4) << "R"
             << setw(5) << "B"
             << setw(4) << "4s"
             << setw(4) << "6s"
             << setw(8) << "SR"
             << endl;
        printLongLine();

        for (int i = 0; i < (int)battingCard.size(); i++) {
            if (battingCard[i].ballsFaced > 0 || battingCard[i].isOut) {
                battingCard[i].display();
            }
        }

        // Show "Did not bat" players
        bool dnbStarted = false;
        for (int i = 0; i < (int)battingCard.size(); i++) {
            if (battingCard[i].ballsFaced == 0 && !battingCard[i].isOut) {
                if (!dnbStarted) {
                    cout << "\nDid not bat: ";
                    dnbStarted = true;
                } else {
                    cout << ", ";
                }
                cout << battingCard[i].playerName;
            }
        }
        if (dnbStarted) cout << endl;

        printLongLine();
        cout << "Total: " << totalRuns << "/" << totalWickets
             << " (" << ballsToOvers(totalBalls) << " overs)" << endl;

        // ---- BOWLING SCORECARD ----
        cout << "\n";
        printDoubleLine();
        cout << "  " << bowlingTeam->name << " - BOWLING" << endl;
        printDoubleLine();

        cout << left << setw(18) << "Bowler"
             << right << setw(6) << "O"
             << setw(4) << "M"
             << setw(5) << "R"
             << setw(4) << "W"
             << setw(8) << "Econ"
             << endl;
        cout << string(45, '-') << endl;

        for (int i = 0; i < (int)bowlingCard.size(); i++) {
            if (bowlingCard[i].ballsBowled > 0) {
                bowlingCard[i].display();
            }
        }
        cout << string(45, '-') << endl;
    }
};

#endif
