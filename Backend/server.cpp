// server.cpp - REST API for the Cricket Tournament System
// Compile: g++ -std=c++17 server.cpp -o server -lws2_32 -lwsock32
// Run:     ./server        (listens on http://localhost:8080)

#include "httplib.h"
#include "json.hpp"

#include <iostream>
#include <string>
#include <vector>
#include <cstdlib>
#include <ctime>
#include <mutex>

// Pull in all the cricket headers (same ones main.cpp uses)
#include "Utils.h"
#include "Player.h"
#include "Team.h"
#include "Match.h"
#include "Tournament.h"
#include "StatsList.h"

using json = nlohmann::json;
using namespace std;

// ====================================================================
//  toJson helpers — one free function per class
// ====================================================================

json playerToJson(Player& p) {
    return {
        {"name",          p.name},
        {"jerseyNo",      p.jerseyNo},
        {"role",          p.role},
        {"battingStyle",  p.battingStyle},
        {"bowlingStyle",  p.bowlingStyle},
        {"totalRuns",     p.totalRuns},
        {"totalBallsFaced",  p.totalBallsFaced},
        {"totalFours",    p.totalFours},
        {"totalSixes",    p.totalSixes},
        {"totalWickets",  p.totalWickets},
        {"totalBallsBowled",  p.totalBallsBowled},
        {"totalRunsConceded", p.totalRunsConceded},
        {"matchesPlayed", p.matchesPlayed},
        {"timesOut",      p.timesOut},
        {"battingAverage",    p.getBattingAverage()},
        {"battingStrikeRate", p.getBattingStrikeRate()},
        {"bowlingAverage",    p.getBowlingAverage()},
        {"bowlingEconomy",    p.getBowlingEconomy()}
    };
}

json teamToJson(Team& t) {
    json players = json::array();
    for (int i = 0; i < (int)t.players.size(); i++) {
        players.push_back(playerToJson(t.players[i]));
    }
    return {
        {"name",      t.name},
        {"shortCode", t.shortCode},
        {"players",   players}
    };
}

json battingCardToJson(BattingScorecard& b) {
    string dismissal;
    if (b.isOut) {
        dismissal = b.howOut;
        if (b.bowlerName != "" && b.howOut != "Run Out") {
            dismissal += " (" + b.bowlerName + ")";
        }
    } else {
        dismissal = "Not Out";
    }
    return {
        {"playerName", b.playerName},
        {"runs",       b.runs},
        {"ballsFaced", b.ballsFaced},
        {"fours",      b.fours},
        {"sixes",      b.sixes},
        {"isOut",      b.isOut},
        {"dismissal",  dismissal},
        {"strikeRate", b.getStrikeRate()}
    };
}

json bowlingCardToJson(BowlingScorecard& b) {
    return {
        {"playerName",   b.playerName},
        {"overs",        b.getOvers()},
        {"maidens",      b.maidens},
        {"runsConceded", b.runsConceded},
        {"wickets",      b.wickets},
        {"economy",      b.getEconomy()}
    };
}

json inningsToJson(Innings& inn) {
    json batting = json::array();
    for (int i = 0; i < (int)inn.battingCard.size(); i++) {
        if (inn.battingCard[i].ballsFaced > 0 || inn.battingCard[i].isOut) {
            batting.push_back(battingCardToJson(inn.battingCard[i]));
        }
    }

    // Did-not-bat list
    json dnb = json::array();
    for (int i = 0; i < (int)inn.battingCard.size(); i++) {
        if (inn.battingCard[i].ballsFaced == 0 && !inn.battingCard[i].isOut) {
            dnb.push_back(inn.battingCard[i].playerName);
        }
    }

    json bowling = json::array();
    for (int i = 0; i < (int)inn.bowlingCard.size(); i++) {
        if (inn.bowlingCard[i].ballsBowled > 0) {
            bowling.push_back(bowlingCardToJson(inn.bowlingCard[i]));
        }
    }

    return {
        {"battingTeam",  inn.battingTeam->name},
        {"bowlingTeam",  inn.bowlingTeam->name},
        {"totalRuns",    inn.totalRuns},
        {"totalWickets", inn.totalWickets},
        {"totalBalls",   inn.totalBalls},
        {"overs",        ballsToOvers(inn.totalBalls)},
        {"battingCard",  batting},
        {"didNotBat",    dnb},
        {"bowlingCard",  bowling}
    };
}

json matchToJson(Match& m) {
    json j = {
        {"matchNumber",  m.matchNumber},
        {"team1",        m.team1->name},
        {"team2",        m.team2->name},
        {"isCompleted",  m.isCompleted},
        {"winner",       m.winner == nullptr ? "" : m.winner->name},
        {"result",       m.result},
        {"momName",      m.momName},
        {"momTeam",      m.momTeam},
        {"momRuns",      m.momRuns},
        {"momWickets",   m.momWickets}
    };
    if (m.isCompleted) {
        j["tossWinner"]   = m.tossWinner;
        j["tossDecision"] = m.tossDecision;
        string firstScore = to_string(m.firstInnings.totalRuns) + "/" +
                            to_string(m.firstInnings.totalWickets);
        string secondScore = to_string(m.secondInnings.totalRuns) + "/" +
                             to_string(m.secondInnings.totalWickets);

        // Innings order follows the toss; API score fields must follow team1/team2.
        if (m.firstInnings.battingTeam == m.team1) {
            j["score1"] = firstScore;
            j["score2"] = secondScore;
        } else {
            j["score1"] = secondScore;
            j["score2"] = firstScore;
        }
    }
    return j;
}

json matchFullToJson(Match& m) {
    json j = matchToJson(m);
    if (m.isCompleted) {
        j["firstInnings"]  = inningsToJson(m.firstInnings);
        j["secondInnings"] = inningsToJson(m.secondInnings);
    }
    return j;
}

json pointsEntryToJson(PointsTableEntry& e) {
    return {
        {"teamName", e.teamName},
        {"played",   e.played},
        {"won",      e.won},
        {"lost",     e.lost},
        {"tied",     e.tied},
        {"points",   e.points},
        {"nrr",      e.nrr}
    };
}

// ====================================================================
//  Preset teams (same as main.cpp — duplicated here so main.cpp is
//  untouched and server.cpp compiles independently)
// ====================================================================

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

// ====================================================================
//  Global state (single tournament at a time, guarded by a mutex)
// ====================================================================

static vector<Team>  presetTeams;
static Tournament    tournament;
static bool          tournamentCreated = false;
static mutex         mtx;      // protects tournament state

// ====================================================================
//  CORS helper — adds headers to every response
// ====================================================================

void addCors(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin",  "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type");
    res.set_header("Access-Control-Allow-Private-Network", "true");
}

// ====================================================================
//  main — set up routes and listen on the configured port
// ====================================================================

int main() {
    srand((unsigned)time(0));
    presetTeams = getAllPresetTeams();

    httplib::Server svr;

    // ---- CORS preflight for every path ----
    svr.Options(R"(.*)", [](const httplib::Request&, httplib::Response& res) {
        addCors(res);
        res.status = 204;
    });

    // ---------------------------------------------------------------
    //  GET /api/teams — list all preset teams and their players
    // ---------------------------------------------------------------
    svr.Get("/api/teams", [](const httplib::Request&, httplib::Response& res) {
        json arr = json::array();
        for (int i = 0; i < (int)presetTeams.size(); i++) {
            json t = teamToJson(presetTeams[i]);
            t["index"] = i;
            arr.push_back(t);
        }
        addCors(res);
        res.set_content(arr.dump(2), "application/json");
    });

    // ---------------------------------------------------------------
    //  POST /api/reset — discard the current in-memory tournament
    // ---------------------------------------------------------------
    svr.Post("/api/reset", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        tournament.setup("", "");
        tournamentCreated = false;
        addCors(res);
        res.set_content(R"({"reset":true})", "application/json");
    });

    // ---------------------------------------------------------------
    //  POST /api/tournament — create a tournament
    //  Body: { "name": "...", "format": "League|Knockout|LeagueKnockout|Custom",
    //          "teamIndexes": [0,1,2,3] }
    // ---------------------------------------------------------------
    svr.Post("/api/tournament", [](const httplib::Request& req, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        try {
            json body = json::parse(req.body);
            string name   = body.value("name", "Tournament");
            string format = body.value("format", "League");
            auto indexes  = body["teamIndexes"].get<vector<int>>();

            if (format != "League" && format != "Knockout" &&
                format != "LeagueKnockout" && format != "Custom") {
                addCors(res);
                res.status = 400;
                res.set_content(R"({"error":"Invalid tournament format"})", "application/json");
                return;
            }

            if (format == "LeagueKnockout" && (int)indexes.size() < 4) {
                addCors(res);
                res.status = 400;
                res.set_content(R"({"error":"LeagueKnockout requires at least 4 teams"})", "application/json");
                return;
            }

            if ((int)indexes.size() < 2) {
                addCors(res);
                res.status = 400;
                res.set_content(R"({"error":"Need at least 2 teams"})", "application/json");
                return;
            }

            // Validate indexes
            for (int i = 0; i < (int)indexes.size(); i++) {
                int idx = indexes[i];
                if (idx < 0 || idx >= (int)presetTeams.size()) {
                    addCors(res);
                    res.status = 400;
                    res.set_content(R"({"error":"Invalid team index"})", "application/json");
                    return;
                }
                for (int j = 0; j < i; j++) {
                    if (indexes[j] == idx) {
                        addCors(res);
                        res.status = 400;
                        res.set_content(R"({"error":"Duplicate team index"})", "application/json");
                        return;
                    }
                }
            }

            tournament.setup(name, format);
            for (int idx : indexes) {
                tournament.addTeam(presetTeams[idx]);
            }
            tournamentCreated = true;

            // For non-Custom formats, generate schedule + simulate immediately
            if (format != "Custom") {
                tournament.simulateTournament();
            }

            json reply = {
                {"name",    tournament.name},
                {"format",  tournament.format},
                {"teams",   (int)tournament.teams.size()},
                {"matches", tournament.matches.size()},
                {"champion", tournament.champion},
                {"isCompleted", tournament.isCompleted}
            };
            addCors(res);
            res.set_content(reply.dump(2), "application/json");
        } catch (exception& e) {
            addCors(res);
            res.status = 400;
            json err = {{"error", e.what()}};
            res.set_content(err.dump(), "application/json");
        }
    });

    // ---------------------------------------------------------------
    //  GET /api/tournament — current tournament details
    // ---------------------------------------------------------------
    svr.Get("/api/tournament", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        addCors(res);

        if (!tournamentCreated) {
            res.set_content(R"({"created":false})", "application/json");
            return;
        }

        json teams = json::array();
        for (int i = 0; i < (int)tournament.teams.size(); i++) {
            teams.push_back({
                {"name", tournament.teams[i].name},
                {"shortCode", tournament.teams[i].shortCode},
                {"index", i}
            });
        }

        json reply = {
            {"name", tournament.name},
            {"format", tournament.format},
            {"champion", tournament.champion},
            {"isCompleted", tournament.isCompleted},
            {"teams", teams}
        };
        res.set_content(reply.dump(2), "application/json");
    });

    // ---------------------------------------------------------------
    //  POST /api/match — add a match (Custom format only)
    //  Body: { "teamA": 0, "teamB": 1 }   (indexes within tournament.teams)
    // ---------------------------------------------------------------
    svr.Post("/api/match", [](const httplib::Request& req, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        addCors(res);

        if (!tournamentCreated) {
            res.status = 400;
            res.set_content(R"({"error":"No tournament created yet"})", "application/json");
            return;
        }
        if (tournament.format != "Custom") {
            res.status = 400;
            res.set_content(R"({"error":"Add-match works only in Custom format"})", "application/json");
            return;
        }

        try {
            json body = json::parse(req.body);
            int a = body.value("teamA", -1);
            int b = body.value("teamB", -1);

            if (a < 0 || b < 0 || a >= (int)tournament.teams.size() ||
                b >= (int)tournament.teams.size() || a == b) {
                res.status = 400;
                res.set_content(R"({"error":"Invalid team indexes"})", "application/json");
                return;
            }

            if (!tournament.addMatch(a, b)) {
                res.status = 400;
                res.set_content(R"({"error":"Unable to add match"})", "application/json");
                return;
            }
            json reply = {
                {"matchNumber", tournament.matches.size()},
                {"team1", tournament.teams[a].name},
                {"team2", tournament.teams[b].name}
            };
            res.set_content(reply.dump(2), "application/json");
        } catch (exception& e) {
            res.status = 400;
            json err = {{"error", e.what()}};
            res.set_content(err.dump(), "application/json");
        }
    });

    // ---------------------------------------------------------------
    //  POST /api/play — play all pending matches
    // ---------------------------------------------------------------
    svr.Post("/api/play", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        addCors(res);

        if (!tournamentCreated) {
            res.status = 400;
            res.set_content(R"({"error":"No tournament created yet"})", "application/json");
            return;
        }

        int played = tournament.playPendingMatches();
        json reply = {
            {"matchesPlayed", played},
            {"totalMatches",  tournament.matches.size()}
        };
        res.set_content(reply.dump(2), "application/json");
    });

    // ---------------------------------------------------------------
    //  GET /api/matches — list all matches (short form)
    // ---------------------------------------------------------------
    svr.Get("/api/matches", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        addCors(res);

        json arr = json::array();
        if (tournamentCreated) {
            for (int i = 0; i < tournament.matches.size(); i++) {
                arr.push_back(matchToJson(tournament.matches.get(i)));
            }
        }
        res.set_content(arr.dump(2), "application/json");
    });

    // ---------------------------------------------------------------
    //  GET /api/matches/:n — full scorecard for match n
    // ---------------------------------------------------------------
    svr.Get(R"(/api/matches/(\d+))", [](const httplib::Request& req, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        addCors(res);

        int n = stoi(req.matches[1]);
        if (!tournamentCreated || n < 1 || n > tournament.matches.size()) {
            res.status = 404;
            res.set_content(R"({"error":"Match not found"})", "application/json");
            return;
        }

        Match& m = tournament.matches.get(n - 1);
        res.set_content(matchFullToJson(m).dump(2), "application/json");
    });

    // ---------------------------------------------------------------
    //  GET /api/points — points table
    // ---------------------------------------------------------------
    svr.Get("/api/points", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        addCors(res);

        json arr = json::array();
        if (tournamentCreated) {
            tournament.sortPointsTable();
            for (int i = 0; i < (int)tournament.pointsTable.size(); i++) {
                json entry = pointsEntryToJson(tournament.pointsTable[i]);
                entry["rank"] = i + 1;
                arr.push_back(entry);
            }
        }
        res.set_content(arr.dump(2), "application/json");
    });

    // ---------------------------------------------------------------
    //  GET /api/orange — top run scorers (Orange Cap)
    //  Uses the StatsList sorted linked list (insertSorted by runs).
    // ---------------------------------------------------------------
    svr.Get("/api/orange", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        addCors(res);

        json arr = json::array();
        if (tournamentCreated) {
            // Build a StatsList sorted by runs (highest first)
            StatsList ranked;
            for (int i = 0; i < (int)tournament.teams.size(); i++) {
                for (int j = 0; j < (int)tournament.teams[i].players.size(); j++) {
                    ranked.insertSorted(&tournament.teams[i].players[j], true);
                }
            }

            int count = 0;
            StatNode* cur = ranked.getHead();
            while (cur != nullptr && count < 10) {
                if (cur->player->totalRuns > 0) {
                    json p = playerToJson(*(cur->player));
                    p["rank"] = count + 1;
                    arr.push_back(p);
                    count++;
                }
                cur = cur->next;
            }
        }
        res.set_content(arr.dump(2), "application/json");
    });

    // ---------------------------------------------------------------
    //  GET /api/purple — top wicket takers (Purple Cap)
    //  Uses the StatsList sorted linked list (insertSorted by wickets).
    // ---------------------------------------------------------------
    svr.Get("/api/purple", [](const httplib::Request&, httplib::Response& res) {
        lock_guard<mutex> lock(mtx);
        addCors(res);

        json arr = json::array();
        if (tournamentCreated) {
            // Build a StatsList sorted by wickets (highest first)
            StatsList ranked;
            for (int i = 0; i < (int)tournament.teams.size(); i++) {
                for (int j = 0; j < (int)tournament.teams[i].players.size(); j++) {
                    ranked.insertSorted(&tournament.teams[i].players[j], false);
                }
            }

            int count = 0;
            StatNode* cur = ranked.getHead();
            while (cur != nullptr && count < 10) {
                if (cur->player->totalWickets > 0) {
                    json p = playerToJson(*(cur->player));
                    p["rank"] = count + 1;
                    arr.push_back(p);
                    count++;
                }
                cur = cur->next;
            }
        }
        res.set_content(arr.dump(2), "application/json");
    });

    // ---- Start server ----
    cout << "\n==============================================\n";
    cout << "  Cricket Tournament API Server\n";
    const char* portEnv = getenv("PORT");
    int port = portEnv ? atoi(portEnv) : 8080;
    cout << "  Listening on port " << port << "\n";
    cout << "  CORS: all origins\n";
    cout << "==============================================\n\n";

    svr.listen("0.0.0.0", port);

    return 0;
}
