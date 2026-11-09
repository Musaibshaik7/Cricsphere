// Utils.h - Utility functions for the Cricket Tournament System
#ifndef UTILS_H
#define UTILS_H

#include <iostream>
#include <string>
#include <cstdlib>
#include <ctime>
#include <iomanip>

using namespace std;

// Seed random number generator (call once in main)
void initRandom() {
    srand(time(0));
}

// Get random number between min and max (inclusive)
int getRandomNumber(int min, int max) {
    return min + rand() % (max - min + 1);
}

// Print separator line
void printLine() {
    cout << "========================================" << endl;
}

// Print double separator line
void printDoubleLine() {
    cout << "==========================================" << endl;
}

// Print long separator
void printLongLine() {
    cout << string(74, '-') << endl;
}

// Convert balls count to overs string (e.g., 25 balls = "4.1")
string ballsToOvers(int balls) {
    int overs = balls / 6;
    int remaining = balls % 6;
    return to_string(overs) + "." + to_string(remaining);
}

// Get random dismissal type (weighted — caught is most common)
string getRandomDismissal() {
    string types[] = {"Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket"};
    int weights[] = {20, 40, 15, 15, 5, 5};

    int r = rand() % 100;
    int cumulative = 0;

    for (int i = 0; i < 6; i++) {
        cumulative += weights[i];
        if (r < cumulative) return types[i];
    }
    return "Caught"; // fallback
}

// Pause and wait for user to press Enter
void pressEnterToContinue() {
    cout << "\nPress Enter to continue...";
    cin.ignore();
    cin.get();
}

#endif
