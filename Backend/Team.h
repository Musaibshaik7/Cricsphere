// Team.h - Team class with squad management
#ifndef TEAM_H
#define TEAM_H

#include <string>
#include <vector>
#include <iostream>
#include "Player.h"

using namespace std;

class Team {
public:
    string name;
    string shortCode;
    vector<Player> players;

    // Default constructor
    Team() {
        name = "";
        shortCode = "";
    }

    // Constructor with name and short code
    Team(string n, string code) {
        name = n;
        shortCode = code;
    }

    // Add a player to the team
    void addPlayer(Player p) {
        players.push_back(p);
    }

    // Get indices of players who can bowl (Bowler or AllRounder)
    vector<int> getBowlerIndices() {
        vector<int> bowlers;
        for (int i = 0; i < (int)players.size(); i++) {
            if (players[i].canBowl()) {
                bowlers.push_back(i);
            }
        }
        return bowlers;
    }

    // Count how many players can bowl
    int getBowlerCount() {
        int count = 0;
        for (int i = 0; i < (int)players.size(); i++) {
            if (players[i].canBowl()) count++;
        }
        return count;
    }

    // Reset all player stats (for new tournament)
    void resetAllStats() {
        for (int i = 0; i < (int)players.size(); i++) {
            players[i].resetStats();
        }
    }

    // Display team info with all players
    void displayTeam() {
        cout << "\n  Team: " << name << " (" << shortCode << ")" << endl;
        cout << "  Players (" << players.size() << "):" << endl;
        cout << string(65, '-') << endl;
        for (int i = 0; i < (int)players.size(); i++) {
            players[i].displayInfo();
        }
        cout << string(65, '-') << endl;
    }
};

#endif
