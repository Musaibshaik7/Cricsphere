// BattingScorecard.h - Stores batting stats for one player in one innings
#ifndef BATTING_SCORECARD_H
#define BATTING_SCORECARD_H

#include <string>
#include <iostream>
#include <iomanip>

using namespace std;

class BattingScorecard {
public:
    string playerName;
    int runs;
    int ballsFaced;
    int fours;
    int sixes;
    bool isOut;
    string howOut;     // "Not Out", "Bowled", "Caught", "LBW", etc.
    string bowlerName; // Name of the bowler who took the wicket

    // Default constructor
    BattingScorecard() {
        playerName = "";
        runs = 0;
        ballsFaced = 0;
        fours = 0;
        sixes = 0;
        isOut = false;
        howOut = "Not Out";
        bowlerName = "";
    }

    // Constructor with player name
    BattingScorecard(string name) {
        playerName = name;
        runs = 0;
        ballsFaced = 0;
        fours = 0;
        sixes = 0;
        isOut = false;
        howOut = "Not Out";
        bowlerName = "";
    }

    // Calculate strike rate
    double getStrikeRate() {
        if (ballsFaced == 0) return 0.0;
        return (double)runs / ballsFaced * 100.0;
    }

    // Display one row of the batting scorecard
    void display() {
        cout << left << setw(18) << playerName;

        if (isOut) {
            string dismissal = howOut;
            if (bowlerName != "" && howOut != "Run Out") {
                dismissal += " (" + bowlerName + ")";
            }
            cout << left << setw(28) << dismissal;
        } else {
            cout << left << setw(28) << "Not Out";
        }

        cout << right << setw(4) << runs
             << setw(5) << ballsFaced
             << setw(4) << fours
             << setw(4) << sixes
             << setw(8) << fixed << setprecision(2) << getStrikeRate()
             << endl;
    }
};

#endif
