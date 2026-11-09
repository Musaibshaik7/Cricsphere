// BowlingScorecard.h - Stores bowling stats for one bowler in one innings
#ifndef BOWLING_SCORECARD_H
#define BOWLING_SCORECARD_H

#include <string>
#include <iostream>
#include <iomanip>
#include "Utils.h"

using namespace std;

class BowlingScorecard {
public:
    string playerName;
    int ballsBowled;
    int maidens;
    int runsConceded;
    int wickets;

    // Default constructor
    BowlingScorecard() {
        playerName = "";
        ballsBowled = 0;
        maidens = 0;
        runsConceded = 0;
        wickets = 0;
    }

    // Constructor with player name
    BowlingScorecard(string name) {
        playerName = name;
        ballsBowled = 0;
        maidens = 0;
        runsConceded = 0;
        wickets = 0;
    }

    // Get overs as string (e.g., "3.4")
    string getOvers() {
        return ballsToOvers(ballsBowled);
    }

    // Calculate economy rate (runs per over)
    double getEconomy() {
        if (ballsBowled == 0) return 0.0;
        return (double)runsConceded / ballsBowled * 6.0;
    }

    // Display one row of the bowling scorecard
    void display() {
        cout << left << setw(18) << playerName
             << right << setw(6) << getOvers()
             << setw(4) << maidens
             << setw(5) << runsConceded
             << setw(4) << wickets
             << setw(8) << fixed << setprecision(2) << getEconomy()
             << endl;
    }
};

#endif
