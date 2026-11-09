// Tournament.h - Tournament management with League, Knockout, and League+Knockout formats
#ifndef TOURNAMENT_H
#define TOURNAMENT_H

#include <string>
#include <vector>
#include <iostream>
#include <iomanip>
#include <algorithm>
#include "Team.h"
#include "Match.h"
#include "MatchList.h"
#include "StatsList.h"
#include "PointsTable.h"
#include "Utils.h"

using namespace std;

class Tournament {
public:
    string name;
    string format; // "League", "Knockout", "LeagueKnockout"
    vector<Team> teams;
    MatchList matches;   // linked list of all matches
    vector<PointsTableEntry> pointsTable;
    string champion;
    bool isCompleted;

    // Default constructor
    Tournament() {
        name = "";
        format = "";
        champion = "";
        isCompleted = false;
    }

    // Constructor with name and format
    Tournament(string n, string f) {
        name = n;
        format = f;
        champion = "";
        isCompleted = false;
    }

    // Start a fresh tournament (used instead of copying a Tournament)
    void setup(string n, string f) {
        name = n;
        format = f;
        champion = "";
        isCompleted = false;
        matches.clear();
        pointsTable.clear();
        teams.clear();
    }

    // Add a team to the tournament (add ALL teams before adding matches)
    void addTeam(Team t) {
        teams.push_back(t);
    }

    // ========== CUSTOM FORMAT: YOU ADD THE MATCHES ==========

    // Add one match between team a and team b (positions in the teams list)
    bool addMatch(int a, int b) {
        if (a < 0 || b < 0 || a >= (int)teams.size() || b >= (int)teams.size()) {
            cout << "  Invalid team number." << endl;
            return false;
        }
        if (a == b) {
            cout << "  A team cannot play against itself." << endl;
            return false;
        }
        if (teams[a].getBowlerCount() < 5 || teams[b].getBowlerCount() < 5) {
            cout << "  Each team needs at least 5 bowlers/all-rounders." << endl;
            return false;
        }
        matches.addAtEnd(Match(&teams[a], &teams[b], matches.size() + 1));
        cout << "  Match " << matches.size() << " added: " << teams[a].name
             << " vs " << teams[b].name << endl;
        return true;
    }

    // Play every match that has not been played yet
    int playPendingMatches() {
        if (pointsTable.empty()) initPointsTable();
        int played = 0;
        for (int i = 0; i < matches.size(); i++) {
            Match& m = matches.get(i);
            if (!m.isCompleted) {
                m.simulateMatch();
                updatePointsTable(m);
                played++;
            }
        }
        return played;
    }

    // How many matches have been played so far
    int countPlayed() {
        int played = 0;
        for (int i = 0; i < matches.size(); i++) {
            if (matches.get(i).isCompleted) played++;
        }
        return played;
    }

    // ========== SCHEDULE GENERATION ==========

    // Generate schedule based on format
    void generateSchedule() {
        matches.clear();
        if (format == "League") {
            generateLeagueSchedule();
        } else if (format == "Knockout") {
            // Knockout matches are generated round by round during simulation
            cout << "  Knockout schedule will be generated during simulation." << endl;
        } else if (format == "LeagueKnockout") {
            generateLeagueSchedule(); // League phase first
        }
    }

    // League: every team plays every other team once
    void generateLeagueSchedule() {
        int matchNum = 1;
        for (int i = 0; i < (int)teams.size(); i++) {
            for (int j = i + 1; j < (int)teams.size(); j++) {
                matches.addAtEnd(Match(&teams[i], &teams[j], matchNum));
                matchNum++;
            }
        }
        cout << "  Schedule generated: " << matches.size() << " matches" << endl;
    }

    // ========== POINTS TABLE ==========

    // Initialize points table for all teams
    void initPointsTable() {
        pointsTable.clear();
        for (int i = 0; i < (int)teams.size(); i++) {
            pointsTable.push_back(PointsTableEntry(teams[i].name));
        }
    }

    // Update points table after a match
    void updatePointsTable(Match& m) {
        // Find entries for both teams
        int idx1 = -1, idx2 = -1;
        for (int i = 0; i < (int)pointsTable.size(); i++) {
            if (pointsTable[i].teamName == m.team1->name) idx1 = i;
            if (pointsTable[i].teamName == m.team2->name) idx2 = i;
        }

        if (idx1 == -1 || idx2 == -1) return;

        // Update matches played
        pointsTable[idx1].played++;
        pointsTable[idx2].played++;

        // Update wins/losses/ties
        if (m.winner == nullptr) {
            // Tie
            pointsTable[idx1].tied++;
            pointsTable[idx2].tied++;
            pointsTable[idx1].points += 1;
            pointsTable[idx2].points += 1;
        } else if (m.winner->name == m.team1->name) {
            pointsTable[idx1].won++;
            pointsTable[idx2].lost++;
            pointsTable[idx1].points += 2;
        } else {
            pointsTable[idx2].won++;
            pointsTable[idx1].lost++;
            pointsTable[idx2].points += 2;
        }

        // Update NRR data for team1
        // Team1's batting innings and bowling innings
        if (m.firstInnings.battingTeam->name == m.team1->name) {
            pointsTable[idx1].totalRunsScored += m.firstInnings.totalRuns;
            pointsTable[idx1].totalBallsFaced += m.firstInnings.totalBalls;
            pointsTable[idx1].totalRunsConceded += m.secondInnings.totalRuns;
            pointsTable[idx1].totalBallsBowled += m.secondInnings.totalBalls;

            pointsTable[idx2].totalRunsScored += m.secondInnings.totalRuns;
            pointsTable[idx2].totalBallsFaced += m.secondInnings.totalBalls;
            pointsTable[idx2].totalRunsConceded += m.firstInnings.totalRuns;
            pointsTable[idx2].totalBallsBowled += m.firstInnings.totalBalls;
        } else {
            pointsTable[idx1].totalRunsScored += m.secondInnings.totalRuns;
            pointsTable[idx1].totalBallsFaced += m.secondInnings.totalBalls;
            pointsTable[idx1].totalRunsConceded += m.firstInnings.totalRuns;
            pointsTable[idx1].totalBallsBowled += m.firstInnings.totalBalls;

            pointsTable[idx2].totalRunsScored += m.firstInnings.totalRuns;
            pointsTable[idx2].totalBallsFaced += m.firstInnings.totalBalls;
            pointsTable[idx2].totalRunsConceded += m.secondInnings.totalRuns;
            pointsTable[idx2].totalBallsBowled += m.secondInnings.totalBalls;
        }

        // Recalculate NRR for both
        pointsTable[idx1].calculateNRR();
        pointsTable[idx2].calculateNRR();
    }

    // Sort points table (by points, then NRR)
    void sortPointsTable() {
        // Simple bubble sort (good enough for small number of teams)
        for (int i = 0; i < (int)pointsTable.size() - 1; i++) {
            for (int j = 0; j < (int)pointsTable.size() - 1 - i; j++) {
                bool shouldSwap = false;
                if (pointsTable[j].points < pointsTable[j + 1].points) {
                    shouldSwap = true;
                } else if (pointsTable[j].points == pointsTable[j + 1].points) {
                    if (pointsTable[j].nrr < pointsTable[j + 1].nrr) {
                        shouldSwap = true;
                    }
                }
                if (shouldSwap) {
                    PointsTableEntry temp = pointsTable[j];
                    pointsTable[j] = pointsTable[j + 1];
                    pointsTable[j + 1] = temp;
                }
            }
        }
    }

    // Display points table
    void displayPointsTable() {
        sortPointsTable();

        cout << "\n";
        printDoubleLine();
        cout << "  " << name << " - POINTS TABLE" << endl;
        printDoubleLine();

        cout << right << setw(3) << "#" << "  "
             << left << setw(22) << "Team"
             << right << setw(3) << "P"
             << setw(4) << "W"
             << setw(4) << "L"
             << setw(4) << "T"
             << setw(5) << "Pts"
             << setw(9) << "NRR"
             << endl;
        cout << string(54, '-') << endl;

        for (int i = 0; i < (int)pointsTable.size(); i++) {
            pointsTable[i].display(i + 1);
        }
        cout << string(54, '-') << endl;
    }

    // ========== TOURNAMENT SIMULATION ==========

    // Simulate based on format
    void simulateTournament() {
        cout << "\n";
        printDoubleLine();
        cout << "  TOURNAMENT: " << name << endl;
        cout << "  Format: " << format << " | Teams: " << teams.size() << endl;
        printDoubleLine();

        // Custom format: just play the matches the user added
        if (format == "Custom") {
            int played = playPendingMatches();
            cout << "\n  " << played << " match(es) played." << endl;
            if (played > 0) displayPointsTable();
            return;
        }

        // Reset all player stats before tournament
        for (int i = 0; i < (int)teams.size(); i++) {
            teams[i].resetAllStats();
        }

        if (format == "League") {
            simulateLeague();
        } else if (format == "Knockout") {
            simulateKnockout();
        } else if (format == "LeagueKnockout") {
            simulateLeagueKnockout();
        }

        isCompleted = true;
    }

    // ---- LEAGUE SIMULATION ----
    void simulateLeague() {
        initPointsTable();
        generateLeagueSchedule();

        for (int i = 0; i < matches.size(); i++) {
            matches.get(i).simulateMatch();
            updatePointsTable(matches.get(i));
        }

        // Display final standings
        displayPointsTable();

        // Champion is the team at the top of the table
        sortPointsTable();
        champion = pointsTable[0].teamName;

        cout << "\n  CHAMPION: " << champion << "!" << endl;
        printDoubleLine();
    }

    // ---- KNOCKOUT SIMULATION ----
    void simulateKnockout() {
        // Create list of team pointers
        vector<Team*> currentTeams;
        for (int i = 0; i < (int)teams.size(); i++) {
            currentTeams.push_back(&teams[i]);
        }

        int round = 1;
        int matchNum = 1;
        string roundNames[] = {"Round 1", "Quarter Finals", "Semi Finals", "FINAL"};

        while ((int)currentTeams.size() > 1) {
            // Determine round name
            string roundName;
            if ((int)currentTeams.size() == 2) {
                roundName = "FINAL";
            } else if ((int)currentTeams.size() <= 4) {
                roundName = "Semi Finals";
            } else if ((int)currentTeams.size() <= 8) {
                roundName = "Quarter Finals";
            } else {
                roundName = "Round " + to_string(round);
            }

            cout << "\n\n";
            printDoubleLine();
            cout << "  === " << roundName << " ===" << endl;
            printDoubleLine();

            vector<Team*> winners;

            for (int i = 0; i < (int)currentTeams.size(); i += 2) {
                if (i + 1 < (int)currentTeams.size()) {
                    Match m(currentTeams[i], currentTeams[i + 1], matchNum);
                    m.simulateMatch();
                    matchNum++;

                    // In knockout, ties go to coin toss (for prototype)
                    if (m.winner == nullptr) {
                        // Tiebreaker: random winner
                        cout << "  TIE BREAKER (Super Over): ";
                        if (rand() % 2 == 0) {
                            m.winner = currentTeams[i];
                        } else {
                            m.winner = currentTeams[i + 1];
                        }
                        m.result = m.winner->name + " won in Super Over!";
                        cout << m.result << endl;
                    }
                    matches.addAtEnd(m);

                    winners.push_back(m.winner);
                } else {
                    // Odd team gets a bye
                    cout << "\n  " << currentTeams[i]->name << " gets a BYE" << endl;
                    winners.push_back(currentTeams[i]);
                }
            }

            currentTeams = winners;
            round++;
        }

        champion = currentTeams[0]->name;

        cout << "\n\n";
        printDoubleLine();
        cout << "  TOURNAMENT CHAMPION: " << champion << "!" << endl;
        printDoubleLine();
    }

    // ---- LEAGUE + KNOCKOUT SIMULATION ----
    void simulateLeagueKnockout() {
        // Phase 1: League stage
        cout << "\n\n  ====== LEAGUE STAGE ======\n" << endl;
        initPointsTable();
        generateLeagueSchedule();

        for (int i = 0; i < matches.size(); i++) {
            matches.get(i).simulateMatch();
            updatePointsTable(matches.get(i));
        }

        displayPointsTable();

        // Phase 2: Top 4 qualify for knockouts
        sortPointsTable();

        cout << "\n  QUALIFIED FOR PLAYOFFS:" << endl;
        for (int i = 0; i < 4 && i < (int)pointsTable.size(); i++) {
            cout << "  " << (i + 1) << ". " << pointsTable[i].teamName << endl;
        }

        // Find team pointers for top 4
        vector<Team*> qualifiedTeams;
        for (int i = 0; i < 4 && i < (int)pointsTable.size(); i++) {
            for (int j = 0; j < (int)teams.size(); j++) {
                if (teams[j].name == pointsTable[i].teamName) {
                    qualifiedTeams.push_back(&teams[j]);
                    break;
                }
            }
        }

        // Phase 3: Semi Finals (1st vs 4th, 2nd vs 3rd)
        int matchNum = matches.size() + 1;

        cout << "\n\n  ====== SEMI FINALS ======\n" << endl;

        // Semi Final 1: 1st vs 4th
        Match semi1(qualifiedTeams[0], qualifiedTeams[3], matchNum++);
        semi1.simulateMatch();
        if (semi1.winner == nullptr) {
            semi1.winner = qualifiedTeams[0]; // Higher rank wins tie
            semi1.result = semi1.winner->name + " won (better league position)";
        }
        matches.addAtEnd(semi1);

        // Semi Final 2: 2nd vs 3rd
        Match semi2(qualifiedTeams[1], qualifiedTeams[2], matchNum++);
        semi2.simulateMatch();
        if (semi2.winner == nullptr) {
            semi2.winner = qualifiedTeams[1];
            semi2.result = semi2.winner->name + " won (better league position)";
        }
        matches.addAtEnd(semi2);

        // Phase 4: FINAL
        cout << "\n\n  ====== GRAND FINAL ======\n" << endl;

        Match final_match(semi1.winner, semi2.winner, matchNum);
        final_match.simulateMatch();

        if (final_match.winner == nullptr) {
            // In case of tie in final, pick semi1 winner (higher rank)
            final_match.winner = semi1.winner;
            final_match.result = final_match.winner->name + " won (Super Over)!";
        }
        matches.addAtEnd(final_match);

        champion = final_match.winner->name;

        cout << "\n\n";
        printDoubleLine();
        cout << "  TOURNAMENT CHAMPION: " << champion << "!" << endl;
        printDoubleLine();
    }

    // ========== STATS DISPLAY ==========

    // Display Orange Cap — Top 10 run scorers
    // Each node in the StatsList holds a pointer to one Player, sorted
    // from highest to lowest totalRuns.
    void displayOrangeCap() {
        // Build a sorted linked list of all players by runs
        StatsList ranked;
        for (int i = 0; i < (int)teams.size(); i++) {
            for (int j = 0; j < (int)teams[i].players.size(); j++) {
                ranked.insertSorted(&teams[i].players[j], true);
            }
        }

        cout << "\n";
        printDoubleLine();
        cout << "  ORANGE CAP - Top Run Scorers" << endl;
        printDoubleLine();

        cout << left << setw(18) << "Player"
             << right << setw(5) << "Runs"
             << setw(6) << "Mat"
             << setw(6) << "Outs"
             << setw(5) << "4s"
             << setw(5) << "6s"
             << setw(9) << "Avg"
             << setw(9) << "SR"
             << endl;
        cout << string(63, '-') << endl;

        int count = 0;
        StatNode* cur = ranked.getHead();
        while (cur != nullptr && count < 10) {
            if (cur->player->totalRuns > 0) {
                cur->player->displayBattingStats();
                count++;
            }
            cur = cur->next;
        }
        cout << string(63, '-') << endl;
    }

    // Display Purple Cap — Top 10 wicket takers
    // Each node in the StatsList holds a pointer to one Player, sorted
    // from highest to lowest totalWickets.
    void displayPurpleCap() {
        // Build a sorted linked list of all players by wickets
        StatsList ranked;
        for (int i = 0; i < (int)teams.size(); i++) {
            for (int j = 0; j < (int)teams[i].players.size(); j++) {
                ranked.insertSorted(&teams[i].players[j], false);
            }
        }

        cout << "\n";
        printDoubleLine();
        cout << "  PURPLE CAP - Top Wicket Takers" << endl;
        printDoubleLine();

        cout << left << setw(18) << "Player"
             << right << setw(5) << "Wkts"
             << setw(6) << "Mat"
             << setw(8) << "Runs"
             << setw(8) << "Balls"
             << setw(9) << "Avg"
             << setw(9) << "Econ"
             << endl;
        cout << string(63, '-') << endl;

        int count = 0;
        StatNode* cur = ranked.getHead();
        while (cur != nullptr && count < 10) {
            if (cur->player->totalWickets > 0) {
                cur->player->displayBowlingStats();
                count++;
            }
            cur = cur->next;
        }
        cout << string(63, '-') << endl;
    }

    // Display all match results (short format)
    void displayAllResults() {
        cout << "\n";
        printDoubleLine();
        cout << "  " << name << " - MATCH RESULTS" << endl;
        printDoubleLine();

        for (int i = 0; i < matches.size(); i++) {
            matches.get(i).displayShortResult();
        }
        cout << string(80, '-') << endl;
    }
};

#endif
