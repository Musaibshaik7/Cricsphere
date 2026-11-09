// Match.h - Match class: toss, two innings, result, and player stat updates
#ifndef MATCH_H
#define MATCH_H

#include <string>
#include <iostream>
#include <iomanip>
#include "Team.h"
#include "Innings.h"
#include "Utils.h"

using namespace std;

class Match {
public:
    Team* team1;
    Team* team2;
    int matchNumber;
    string tossWinner;
    string tossDecision; // "Bat" or "Bowl"
    Innings firstInnings;
    Innings secondInnings;
    Team* winner;        // nullptr if tied
    string result;
    bool isCompleted;
    string momName;      // Man of the Match
    string momTeam;
    int momRuns;
    int momWickets;

    // Default constructor
    Match() {
        team1 = nullptr;
        team2 = nullptr;
        matchNumber = 0;
        tossWinner = "";
        tossDecision = "";
        winner = nullptr;
        result = "";
        isCompleted = false;
        momName = "";
        momTeam = "";
        momRuns = 0;
        momWickets = 0;
    }

    // Constructor with two teams
    Match(Team* t1, Team* t2, int num) {
        team1 = t1;
        team2 = t2;
        matchNumber = num;
        tossWinner = "";
        tossDecision = "";
        winner = nullptr;
        result = "";
        isCompleted = false;
        momName = "";
        momTeam = "";
        momRuns = 0;
        momWickets = 0;
    }

    // Random toss — pick winner and their decision
    void conductToss() {
        // Randomly pick toss winner
        if (rand() % 2 == 0) {
            tossWinner = team1->name;
        } else {
            tossWinner = team2->name;
        }

        // Randomly pick decision
        if (rand() % 2 == 0) {
            tossDecision = "Bat";
        } else {
            tossDecision = "Bowl";
        }

        cout << "\n  TOSS: " << tossWinner << " won the toss and chose to " << tossDecision << endl;
    }

    // Simulate the entire match
    void simulateMatch() {
        cout << "\n";
        printDoubleLine();
        cout << "  MATCH " << matchNumber << ": " << team1->name << " vs " << team2->name << endl;
        printDoubleLine();

        // Conduct toss
        conductToss();

        // Determine who bats first based on toss
        Team* battingFirst;
        Team* bowlingFirst;

        if ((tossWinner == team1->name && tossDecision == "Bat") ||
            (tossWinner == team2->name && tossDecision == "Bowl")) {
            battingFirst = team1;
            bowlingFirst = team2;
        } else {
            battingFirst = team2;
            bowlingFirst = team1;
        }

        // ---- FIRST INNINGS ----
        firstInnings = Innings(battingFirst, bowlingFirst);
        firstInnings.simulate(-1); // No target

        int target = firstInnings.totalRuns + 1;

        cout << "\n  Target for " << bowlingFirst->name << ": " << target << " runs" << endl;

        // ---- SECOND INNINGS ----
        secondInnings = Innings(bowlingFirst, battingFirst);
        secondInnings.simulate(target);

        // Determine the result
        determineResult();
        pickManOfTheMatch();

        // Update player tournament stats
        updatePlayerStats();

        isCompleted = true;

        // Display result
        cout << "\n";
        printDoubleLine();
        cout << "  RESULT: " << result << endl;
        displayManOfTheMatch();
        printDoubleLine();
    }

    // Figure out who won
    void determineResult() {
        int firstScore = firstInnings.totalRuns;
        int secondScore = secondInnings.totalRuns;

        if (secondScore >= firstInnings.totalRuns + 1) {
            // Chasing team won
            winner = secondInnings.battingTeam;
            int wicketsLeft = (int)secondInnings.battingTeam->players.size() - 1 - secondInnings.totalWickets;
            result = winner->name + " won by " + to_string(wicketsLeft) + " wickets";
        } else if (firstScore == secondScore) {
            // Match tied
            winner = nullptr;
            result = "Match Tied!";
        } else {
            // First batting team won
            winner = firstInnings.battingTeam;
            int runDiff = firstScore - secondScore;
            result = winner->name + " won by " + to_string(runDiff) + " runs";
        }
    }

    // Runs scored by one player in this match (looks in both innings)
    int runsInMatch(string playerName) {
        int total = 0;
        for (int i = 0; i < (int)firstInnings.battingCard.size(); i++) {
            if (firstInnings.battingCard[i].playerName == playerName) {
                total += firstInnings.battingCard[i].runs;
            }
        }
        for (int i = 0; i < (int)secondInnings.battingCard.size(); i++) {
            if (secondInnings.battingCard[i].playerName == playerName) {
                total += secondInnings.battingCard[i].runs;
            }
        }
        return total;
    }

    // Wickets taken by one player in this match (looks in both innings)
    int wicketsInMatch(string playerName) {
        int total = 0;
        for (int i = 0; i < (int)firstInnings.bowlingCard.size(); i++) {
            if (firstInnings.bowlingCard[i].playerName == playerName) {
                total += firstInnings.bowlingCard[i].wickets;
            }
        }
        for (int i = 0; i < (int)secondInnings.bowlingCard.size(); i++) {
            if (secondInnings.bowlingCard[i].playerName == playerName) {
                total += secondInnings.bowlingCard[i].wickets;
            }
        }
        return total;
    }

    // A player is eligible for Man of the Match only when they appeared in a
    // batting or bowling card. A batter remains eligible whether dismissed or
    // not out; the dismissal status is never used to choose the award.
    bool playedInMatch(string playerName) {
        for (int i = 0; i < (int)firstInnings.battingCard.size(); i++) {
            BattingScorecard& card = firstInnings.battingCard[i];
            if (card.playerName == playerName && (card.ballsFaced > 0 || card.isOut)) {
                return true;
            }
        }
        for (int i = 0; i < (int)secondInnings.battingCard.size(); i++) {
            BattingScorecard& card = secondInnings.battingCard[i];
            if (card.playerName == playerName && (card.ballsFaced > 0 || card.isOut)) {
                return true;
            }
        }
        for (int i = 0; i < (int)firstInnings.bowlingCard.size(); i++) {
            if (firstInnings.bowlingCard[i].playerName == playerName &&
                firstInnings.bowlingCard[i].ballsBowled > 0) {
                return true;
            }
        }
        for (int i = 0; i < (int)secondInnings.bowlingCard.size(); i++) {
            if (secondInnings.bowlingCard[i].playerName == playerName &&
                secondInnings.bowlingCard[i].ballsBowled > 0) {
                return true;
            }
        }
        return false;
    }

    // Man of the Match = highest points, where points = runs + 25 x wickets
    void pickManOfTheMatch() {
        int bestPoints = -1;
        Team* both[2] = {team1, team2};

        for (int t = 0; t < 2; t++) {
            for (int i = 0; i < (int)both[t]->players.size(); i++) {
                string pName = both[t]->players[i].name;
                if (!playedInMatch(pName)) continue;

                int runs = runsInMatch(pName);
                int wickets = wicketsInMatch(pName);
                int points = runs + 25 * wickets;

                if (points > bestPoints) {
                    bestPoints = points;
                    momName = pName;
                    momTeam = both[t]->name;
                    momRuns = runs;
                    momWickets = wickets;
                }
            }
        }
    }

    // One line describing the Man of the Match
    void displayManOfTheMatch() {
        cout << "  MAN OF THE MATCH: " << momName << " (" << momTeam << ") - "
             << momRuns << " runs, " << momWickets << " wkts" << endl;
    }

    // Update tournament stats for all players who played this match
    void updatePlayerStats() {
        updateInningsStats(firstInnings);
        updateInningsStats(secondInnings);

        // Increment matches played for all players in both teams
        for (int i = 0; i < (int)team1->players.size(); i++) {
            team1->players[i].matchesPlayed++;
        }
        for (int i = 0; i < (int)team2->players.size(); i++) {
            team2->players[i].matchesPlayed++;
        }
    }

    // Update player stats from one innings
    void updateInningsStats(Innings& inn) {
        // Update batting stats
        for (int i = 0; i < (int)inn.battingCard.size(); i++) {
            if (inn.battingCard[i].ballsFaced > 0 || inn.battingCard[i].isOut) {
                // Find this player in the batting team
                for (int j = 0; j < (int)inn.battingTeam->players.size(); j++) {
                    if (inn.battingTeam->players[j].name == inn.battingCard[i].playerName) {
                        Player& p = inn.battingTeam->players[j];
                        p.totalRuns += inn.battingCard[i].runs;
                        p.totalBallsFaced += inn.battingCard[i].ballsFaced;
                        p.totalFours += inn.battingCard[i].fours;
                        p.totalSixes += inn.battingCard[i].sixes;
                        if (inn.battingCard[i].isOut) p.timesOut++;
                        break;
                    }
                }
            }
        }

        // Update bowling stats
        for (int i = 0; i < (int)inn.bowlingCard.size(); i++) {
            if (inn.bowlingCard[i].ballsBowled > 0) {
                // Find this player in the bowling team
                for (int j = 0; j < (int)inn.bowlingTeam->players.size(); j++) {
                    if (inn.bowlingTeam->players[j].name == inn.bowlingCard[i].playerName) {
                        Player& p = inn.bowlingTeam->players[j];
                        p.totalWickets += inn.bowlingCard[i].wickets;
                        p.totalBallsBowled += inn.bowlingCard[i].ballsBowled;
                        p.totalRunsConceded += inn.bowlingCard[i].runsConceded;
                        break;
                    }
                }
            }
        }
    }

    // Display full match summary with both scorecards
    void displayFullScorecard() {
        cout << "\n";
        printDoubleLine();
        cout << "  MATCH " << matchNumber << " SCORECARD" << endl;
        cout << "  " << team1->name << " vs " << team2->name << endl;
        printDoubleLine();
        cout << "  Toss: " << tossWinner << " chose to " << tossDecision << endl;

        firstInnings.displayScorecard();
        secondInnings.displayScorecard();

        cout << "\n  RESULT: " << result << endl;
        displayManOfTheMatch();
        printDoubleLine();
    }

    // Display short match result (one line)
    void displayShortResult() {
        cout << "  Match " << setw(2) << matchNumber << ": "
             << left << setw(20) << team1->name << " vs "
             << setw(20) << team2->name;
        if (isCompleted) {
            cout << " | " << firstInnings.totalRuns << "/" << firstInnings.totalWickets
                 << " vs " << secondInnings.totalRuns << "/" << secondInnings.totalWickets
                 << " | " << result;
        } else {
            cout << " | Not Played";
        }
        cout << endl;
    }
};

#endif
