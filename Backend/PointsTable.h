// PointsTable.h - Points table entry for league tournaments
#ifndef POINTS_TABLE_H
#define POINTS_TABLE_H

#include <string>
#include <iostream>
#include <iomanip>

using namespace std;

class PointsTableEntry {
public:
    string teamName;
    int played;
    int won;
    int lost;
    int tied;
    int points;

    // NRR calculation data
    int totalRunsScored;
    int totalBallsFaced;
    int totalRunsConceded;
    int totalBallsBowled;
    double nrr; // Net Run Rate

    // Constructor
    PointsTableEntry() {
        teamName = "";
        played = 0;
        won = 0;
        lost = 0;
        tied = 0;
        points = 0;
        totalRunsScored = 0;
        totalBallsFaced = 0;
        totalRunsConceded = 0;
        totalBallsBowled = 0;
        nrr = 0.0;
    }

    PointsTableEntry(string name) {
        teamName = name;
        played = 0;
        won = 0;
        lost = 0;
        tied = 0;
        points = 0;
        totalRunsScored = 0;
        totalBallsFaced = 0;
        totalRunsConceded = 0;
        totalBallsBowled = 0;
        nrr = 0.0;
    }

    // Calculate Net Run Rate
    void calculateNRR() {
        double scoringRate = 0.0;
        double concedingRate = 0.0;

        if (totalBallsFaced > 0) {
            scoringRate = (double)totalRunsScored / totalBallsFaced * 6.0;
        }
        if (totalBallsBowled > 0) {
            concedingRate = (double)totalRunsConceded / totalBallsBowled * 6.0;
        }

        nrr = scoringRate - concedingRate;
    }

    // Display one row of the points table
    void display(int rank) {
        cout << right << setw(3) << rank << ". "
             << left << setw(22) << teamName
             << right << setw(3) << played
             << setw(4) << won
             << setw(4) << lost
             << setw(4) << tied
             << setw(5) << points
             << setw(9) << fixed << setprecision(3) << nrr
             << endl;
    }
};

#endif
