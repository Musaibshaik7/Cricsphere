// main.cpp - Cricket Tournament Management System
// Entry point with menu system and preset IPL teams
#include <iostream>
#include <string>
#include <vector>
#include <cstdlib>
#include "Utils.h"
#include "Player.h"
#include "Team.h"
#include "Match.h"
#include "Tournament.h"

using namespace std;

// Read a whole number safely (asks again if the user types letters)
int readNumber() {
    int x;
    while (!(cin >> x)) {
        if (cin.eof()) {          // input ended (Ctrl+D / Ctrl+Z), stop the program
            cout << "\nInput ended. Bye!" << endl;
            exit(0);
        }
        cin.clear();
        cin.ignore(1000, '\n');
        cout << "  Please enter a number: ";
    }
    return x;
}

// ============ PRESET IPL TEAMS ============

// Create Chennai Super Kings
Team createCSK() {
    Team t("Chennai Super Kings", "CSK");
    t.addPlayer(Player("Ruturaj Gaikwad", 31, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Devon Conway", 88, "Batter", "Left Hand", "None"));
    t.addPlayer(Player("Moeen Ali", 18, "AllRounder", "Left Hand", "Off Spin"));
    t.addPlayer(Player("Ambati Rayudu", 5, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("MS Dhoni", 7, "WicketKeeper", "Right Hand", "None"));
    t.addPlayer(Player("Ravindra Jadeja", 8, "AllRounder", "Left Hand", "Left Arm"));
    t.addPlayer(Player("Shivam Dube", 25, "AllRounder", "Left Hand", "Medium"));
    t.addPlayer(Player("Deepak Chahar", 90, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Tushar Deshpande", 22, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Maheesh Theekshana", 39, "Bowler", "Right Hand", "Off Spin"));
    t.addPlayer(Player("Matheesha Pathirana", 34, "Bowler", "Right Hand", "Fast"));
    return t;
}

// Create Mumbai Indians
Team createMI() {
    Team t("Mumbai Indians", "MI");
    t.addPlayer(Player("Rohit Sharma", 45, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Ishan Kishan", 23, "WicketKeeper", "Left Hand", "None"));
    t.addPlayer(Player("Suryakumar Yadav", 63, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Tilak Varma", 9, "Batter", "Left Hand", "None"));
    t.addPlayer(Player("Hardik Pandya", 33, "AllRounder", "Right Hand", "Fast"));
    t.addPlayer(Player("Tim David", 55, "AllRounder", "Right Hand", "Medium"));
    t.addPlayer(Player("Dewald Brevis", 78, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Jasprit Bumrah", 93, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Piyush Chawla", 29, "Bowler", "Right Hand", "Leg Spin"));
    t.addPlayer(Player("Akash Madhwal", 17, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Arjun Tendulkar", 35, "Bowler", "Left Hand", "Left Arm"));
    return t;
}

// Create Royal Challengers Bengaluru
Team createRCB() {
    Team t("Royal Challengers", "RCB");
    t.addPlayer(Player("Virat Kohli", 18, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Faf du Plessis", 13, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Glenn Maxwell", 32, "AllRounder", "Right Hand", "Off Spin"));
    t.addPlayer(Player("Rajat Patidar", 65, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Dinesh Karthik", 21, "WicketKeeper", "Right Hand", "None"));
    t.addPlayer(Player("Shahbaz Ahmed", 80, "AllRounder", "Left Hand", "Left Arm"));
    t.addPlayer(Player("Wanindu Hasaranga", 99, "AllRounder", "Right Hand", "Leg Spin"));
    t.addPlayer(Player("Harshal Patel", 37, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Mohammed Siraj", 73, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Josh Hazlewood", 38, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Yuzvendra Chahal", 3, "Bowler", "Right Hand", "Leg Spin"));
    return t;
}

// Create Kolkata Knight Riders
Team createKKR() {
    Team t("Kolkata Knight Riders", "KKR");
    t.addPlayer(Player("Shreyas Iyer", 41, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Venkatesh Iyer", 44, "AllRounder", "Left Hand", "Medium"));
    t.addPlayer(Player("Nitish Rana", 27, "Batter", "Left Hand", "None"));
    t.addPlayer(Player("Rinku Singh", 35, "Batter", "Left Hand", "None"));
    t.addPlayer(Player("Andre Russell", 12, "AllRounder", "Right Hand", "Fast"));
    t.addPlayer(Player("Shardul Thakur", 10, "AllRounder", "Right Hand", "Fast"));
    t.addPlayer(Player("Rahmanullah Gurbaz", 19, "WicketKeeper", "Right Hand", "None"));
    t.addPlayer(Player("Varun Chakravarthy", 29, "Bowler", "Right Hand", "Off Spin"));
    t.addPlayer(Player("Umesh Yadav", 15, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Tim Southee", 38, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Harshit Rana", 64, "Bowler", "Right Hand", "Fast"));
    return t;
}

// Create Delhi Capitals
Team createDC() {
    Team t("Delhi Capitals", "DC");
    t.addPlayer(Player("David Warner", 31, "Batter", "Left Hand", "None"));
    t.addPlayer(Player("Prithvi Shaw", 1, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Rishabh Pant", 17, "WicketKeeper", "Left Hand", "None"));
    t.addPlayer(Player("Sarfaraz Khan", 42, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Mitchell Marsh", 8, "AllRounder", "Right Hand", "Fast"));
    t.addPlayer(Player("Axar Patel", 20, "AllRounder", "Left Hand", "Left Arm"));
    t.addPlayer(Player("Lalit Yadav", 38, "AllRounder", "Right Hand", "Off Spin"));
    t.addPlayer(Player("Kuldeep Yadav", 23, "Bowler", "Left Hand", "Left Arm"));
    t.addPlayer(Player("Anrich Nortje", 72, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Khaleel Ahmed", 13, "Bowler", "Left Hand", "Left Arm"));
    t.addPlayer(Player("Ishant Sharma", 33, "Bowler", "Right Hand", "Fast"));
    return t;
}

// Create Sunrisers Hyderabad
Team createSRH() {
    Team t("Sunrisers Hyderabad", "SRH");
    t.addPlayer(Player("Travis Head", 5, "Batter", "Left Hand", "None"));
    t.addPlayer(Player("Abhishek Sharma", 4, "AllRounder", "Left Hand", "Left Arm"));
    t.addPlayer(Player("Heinrich Klaasen", 69, "WicketKeeper", "Right Hand", "None"));
    t.addPlayer(Player("Aiden Markram", 11, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Abdul Samad", 88, "Batter", "Right Hand", "None"));
    t.addPlayer(Player("Washington Sundar", 55, "AllRounder", "Left Hand", "Off Spin"));
    t.addPlayer(Player("Marco Jansen", 27, "AllRounder", "Left Hand", "Left Arm"));
    t.addPlayer(Player("Bhuvneshwar Kumar", 15, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("T Natarajan", 77, "Bowler", "Left Hand", "Left Arm"));
    t.addPlayer(Player("Umran Malik", 36, "Bowler", "Right Hand", "Fast"));
    t.addPlayer(Player("Pat Cummins", 30, "Bowler", "Right Hand", "Fast"));
    return t;
}

// Get all preset teams
vector<Team> getAllPresetTeams() {
    vector<Team> allTeams;
    allTeams.push_back(createCSK());
    allTeams.push_back(createMI());
    allTeams.push_back(createRCB());
    allTeams.push_back(createKKR());
    allTeams.push_back(createDC());
    allTeams.push_back(createSRH());
    return allTeams;
}

// ============ MENU HELPER FUNCTIONS ============

// Let user pick teams from the preset list
vector<Team> selectTeams(vector<Team>& available) {
    vector<Team> selected;

    cout << "\n  Available Teams:" << endl;
    for (int i = 0; i < (int)available.size(); i++) {
        cout << "  " << (i + 1) << ". " << available[i].name
             << " (" << available[i].shortCode << ")" << endl;
    }

    cout << "\n  How many teams? (4-" << available.size() << "): ";
    int count;
    count = readNumber();

    if (count < 4) count = 4;
    if (count > (int)available.size()) count = (int)available.size();

    cout << "  Enter team numbers (one by one):" << endl;
    vector<int> picked;
    for (int i = 0; i < count; i++) {
        int choice;
        cout << "  Team " << (i + 1) << ": ";
        choice = readNumber();

        // Don't allow the same team twice
        bool alreadyPicked = false;
        for (int k = 0; k < (int)picked.size(); k++) {
            if (picked[k] == choice) alreadyPicked = true;
        }

        if (alreadyPicked) {
            cout << "  Already picked. Choose another team." << endl;
            i--; // Retry
        } else if (choice >= 1 && choice <= (int)available.size()) {
            picked.push_back(choice);
            selected.push_back(available[choice - 1]);
        } else {
            cout << "  Invalid choice. Skipping." << endl;
            i--; // Retry
        }
    }

    return selected;
}

// Let user pick tournament format
string selectFormat() {
    cout << "\n  Select Tournament Format:" << endl;
    cout << "  1. League (Round Robin)" << endl;
    cout << "  2. Knockout" << endl;
    cout << "  3. League + Knockout (IPL Style)" << endl;
    cout << "  4. Custom (I add the matches myself)" << endl;
    cout << "  Choice: ";

    int choice;
    choice = readNumber();

    if (choice == 1) return "League";
    if (choice == 2) return "Knockout";
    if (choice == 3) return "LeagueKnockout";
    if (choice == 4) return "Custom";
    return "League"; // default
}

// ============ MAIN MENU ============

int main() {
    initRandom();

    Tournament tournament;
    bool tournamentCreated = false;

    int choice;

    do {
        cout << "\n\n";
        printDoubleLine();
        cout << "  CRICKET TOURNAMENT MANAGEMENT SYSTEM" << endl;
        printDoubleLine();
        cout << "  1. Quick Start (IPL Teams Demo)" << endl;
        cout << "  2. Create Custom Tournament" << endl;
        cout << "  3. View Teams" << endl;
        cout << "  4. Simulate Tournament" << endl;
        cout << "  5. View Points Table" << endl;
        cout << "  6. View All Match Results" << endl;
        cout << "  7. View Match Scorecard" << endl;
        cout << "  8. Orange Cap (Top Batters)" << endl;
        cout << "  9. Purple Cap (Top Bowlers)" << endl;
        cout << "  10. Add a Match (Custom format)" << endl;
        cout << "  0. Exit" << endl;
        printDoubleLine();
        cout << "  Enter choice: ";
        choice = readNumber();

        switch (choice) {
            case 1: {
                // QUICK START — preset IPL teams
                cout << "\n  --- QUICK START ---" << endl;
                vector<Team> allTeams = getAllPresetTeams();
                vector<Team> selected = selectTeams(allTeams);
                string format = selectFormat();

                string tName;
                cout << "  Tournament Name: ";
                cin >> ws;
                getline(cin, tName);

                tournament.setup(tName, format);
                for (int i = 0; i < (int)selected.size(); i++) {
                    tournament.addTeam(selected[i]);
                }

                tournamentCreated = true;
                cout << "\n  Tournament '" << tName << "' created with "
                     << selected.size() << " teams!" << endl;
                break;
            }

            case 2: {
                // CREATE CUSTOM TOURNAMENT
                string tName, format;
                cout << "\n  Tournament Name: ";
                cin >> ws;
                getline(cin, tName);

                format = selectFormat();
                tournament.setup(tName, format);

                // Add teams manually
                cout << "  How many teams? ";
                int numTeams;
                numTeams = readNumber();

                for (int t = 0; t < numTeams; t++) {
                    string teamName, shortCode;
                    cout << "\n  --- Team " << (t + 1) << " ---" << endl;
                    cout << "  Team Name: ";
                    cin >> ws;
                    getline(cin, teamName);
                    cout << "  Short Code: ";
                    getline(cin, shortCode);

                    Team team(teamName, shortCode);

                    cout << "  Number of players (min 11): ";
                    int numPlayers;
                    numPlayers = readNumber();
                    if (numPlayers < 11) numPlayers = 11;

                    for (int p = 0; p < numPlayers; p++) {
                        string pName, role, batStyle, bowlStyle;
                        int jersey;

                        cout << "\n  Player " << (p + 1) << ":" << endl;
                        cout << "    Name: ";
                        cin >> ws;
                        getline(cin, pName);
                        cout << "    Jersey No: ";
                        jersey = readNumber();
                        cout << "    Role (Batter/Bowler/AllRounder/WicketKeeper): ";
                        cin >> role;
                        cout << "    Batting Style (Right Hand/Left Hand): ";
                        cin >> ws;
                        getline(cin, batStyle);

                        if (role == "Bowler" || role == "AllRounder") {
                            cout << "    Bowling Style (Fast/Medium/Off Spin/Leg Spin/Left Arm): ";
                            getline(cin, bowlStyle);
                        } else {
                            bowlStyle = "None";
                        }

                        team.addPlayer(Player(pName, jersey, role, batStyle, bowlStyle));
                    }

                    tournament.addTeam(team);
                    cout << "  Team '" << teamName << "' added!" << endl;
                }

                tournamentCreated = true;
                cout << "\n  Tournament '" << tName << "' created with "
                     << numTeams << " teams!" << endl;
                break;
            }

            case 3: {
                // VIEW TEAMS
                if (!tournamentCreated) {
                    cout << "\n  No tournament created yet! Use option 1 or 2." << endl;
                    break;
                }
                cout << "\n  Tournament: " << tournament.name << endl;
                for (int i = 0; i < (int)tournament.teams.size(); i++) {
                    tournament.teams[i].displayTeam();
                }
                break;
            }

            case 4: {
                // SIMULATE TOURNAMENT
                if (!tournamentCreated) {
                    cout << "\n  No tournament created yet! Use option 1 or 2." << endl;
                    break;
                }
                if (tournament.isCompleted) {
                    cout << "\n  Tournament already completed! Champion: " << tournament.champion << endl;
                    cout << "  Create a new tournament to play again." << endl;
                    break;
                }
                tournament.simulateTournament();
                break;
            }

            case 5: {
                // VIEW POINTS TABLE
                if (!tournamentCreated) {
                    cout << "\n  No tournament created yet!" << endl;
                    break;
                }
                if (tournament.format == "Knockout") {
                    cout << "\n  No points table in Knockout format." << endl;
                } else {
                    tournament.displayPointsTable();
                }
                break;
            }

            case 6: {
                // VIEW ALL MATCH RESULTS
                if (!tournamentCreated || tournament.matches.isEmpty()) {
                    cout << "\n  No matches played yet!" << endl;
                    break;
                }
                tournament.displayAllResults();
                break;
            }

            case 7: {
                // VIEW SPECIFIC MATCH SCORECARD
                if (!tournamentCreated || tournament.matches.isEmpty()) {
                    cout << "\n  No matches played yet!" << endl;
                    break;
                }

                cout << "\n  Enter match number (1-" << tournament.matches.size() << "): ";
                int matchNum;
                matchNum = readNumber();

                if (matchNum >= 1 && matchNum <= tournament.matches.size()) {
                    tournament.matches.get(matchNum - 1).displayFullScorecard();
                } else {
                    cout << "  Invalid match number." << endl;
                }
                break;
            }

            case 8: {
                // ORANGE CAP
                if (!tournamentCreated || tournament.countPlayed() == 0) {
                    cout << "\n  No matches played yet!" << endl;
                    break;
                }
                tournament.displayOrangeCap();
                break;
            }

            case 9: {
                // PURPLE CAP
                if (!tournamentCreated || tournament.countPlayed() == 0) {
                    cout << "\n  No matches played yet!" << endl;
                    break;
                }
                tournament.displayPurpleCap();
                break;
            }

            case 10: {
                // ADD A MATCH (Custom format only)
                if (!tournamentCreated) {
                    cout << "\n  No tournament created yet! Use option 1 or 2." << endl;
                    break;
                }
                if (tournament.format != "Custom") {
                    cout << "\n  Add Match works only in Custom format (choose format 4)." << endl;
                    break;
                }
                for (int i = 0; i < (int)tournament.teams.size(); i++) {
                    cout << "  " << (i + 1) << ". " << tournament.teams[i].name << endl;
                }
                int a, b;
                cout << "  First team number: ";
                a = readNumber();
                cout << "  Second team number: ";
                b = readNumber();
                tournament.addMatch(a - 1, b - 1);
                cout << "  (Choose option 4 to play the added matches)" << endl;
                break;
            }

            case 0: {
                cout << "\n  Thanks for using Cricket Tournament Management System!" << endl;
                cout << "  Goodbye! " << endl;
                break;
            }

            default: {
                cout << "\n  Invalid choice. Try again." << endl;
                break;
            }
        }

    } while (choice != 0);

    return 0;
}
