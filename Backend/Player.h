// Player.h - Player class with all attributes and tournament stats
#ifndef PLAYER_H
#define PLAYER_H

#include <string>
#include <iostream>
#include <iomanip>

using namespace std;

class Player {
public:
    string name;
    int jerseyNo;
    string role;         // "Batter", "Bowler", "AllRounder", "WicketKeeper"
    string battingStyle; // "Right Hand", "Left Hand"
    string bowlingStyle; // "Fast", "Medium", "Off Spin", "Leg Spin", "Left Arm", "None"

    // Tournament stats (accumulated across matches)
    int totalRuns;
    int totalBallsFaced;
    int totalFours;
    int totalSixes;
    int totalWickets;
    int totalBallsBowled;
    int totalRunsConceded;
    int matchesPlayed;
    int timesOut;

    // Default constructor
    Player() {
        name = "";
        jerseyNo = 0;
        role = "";
        battingStyle = "Right Hand";
        bowlingStyle = "None";
        resetStats();
    }

    // Parameterized constructor
    Player(string n, int j, string r, string bat, string bowl) {
        name = n;
        jerseyNo = j;
        role = r;
        battingStyle = bat;
        bowlingStyle = bowl;
        resetStats();
    }

    // Reset all tournament stats to zero
    void resetStats() {
        totalRuns = 0;
        totalBallsFaced = 0;
        totalFours = 0;
        totalSixes = 0;
        totalWickets = 0;
        totalBallsBowled = 0;
        totalRunsConceded = 0;
        matchesPlayed = 0;
        timesOut = 0;
    }

    // Check if this player can bowl
    bool canBowl() {
        return (role == "Bowler" || role == "AllRounder");
    }

    // Calculate batting average (runs per dismissal)
    double getBattingAverage() {
        if (timesOut == 0) return (double)totalRuns;
        return (double)totalRuns / timesOut;
    }

    // Calculate batting strike rate (runs per 100 balls)
    double getBattingStrikeRate() {
        if (totalBallsFaced == 0) return 0.0;
        return (double)totalRuns / totalBallsFaced * 100.0;
    }

    // Calculate bowling average (runs per wicket)
    double getBowlingAverage() {
        if (totalWickets == 0) return 0.0;
        return (double)totalRunsConceded / totalWickets;
    }

    // Calculate bowling economy (runs per over)
    double getBowlingEconomy() {
        if (totalBallsBowled == 0) return 0.0;
        return (double)totalRunsConceded / totalBallsBowled * 6.0;
    }

    // Display basic player info
    void displayInfo() {
        cout << "  #" << left << setw(3) << jerseyNo
             << setw(18) << name
             << setw(14) << role
             << "| Bat: " << setw(11) << battingStyle
             << "| Bowl: " << bowlingStyle << endl;
    }

    // Display detailed batting stats
    void displayBattingStats() {
        cout << left << setw(18) << name
             << right << setw(5) << totalRuns
             << setw(6) << matchesPlayed
             << setw(6) << timesOut
             << setw(5) << totalFours
             << setw(5) << totalSixes
             << setw(9) << fixed << setprecision(2) << getBattingAverage()
             << setw(9) << fixed << setprecision(2) << getBattingStrikeRate()
             << endl;
    }

    // Display detailed bowling stats
    void displayBowlingStats() {
        cout << left << setw(18) << name
             << right << setw(5) << totalWickets
             << setw(6) << matchesPlayed
             << setw(8) << totalRunsConceded
             << setw(8) << totalBallsBowled
             << setw(9) << fixed << setprecision(2) << getBowlingAverage()
             << setw(9) << fixed << setprecision(2) << getBowlingEconomy()
             << endl;
    }
};

#endif
