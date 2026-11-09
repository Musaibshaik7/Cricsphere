// StatsList.h - Sorted linked list for ranking players by stats
// Each node holds a pointer to one Player and a pointer to the next node.
#ifndef STATSLIST_H
#define STATSLIST_H

#include "Player.h"

using namespace std;

// One node of the stats list — holds a player pointer and a link to the next node
struct StatNode {
    Player* player;      // the player stored in this node
    StatNode* next;      // pointer to the next node (nullptr = last node)

    StatNode(Player* p) {
        player = p;
        next = nullptr;
    }
};

class StatsList {
private:
    StatNode* head;      // first node

public:
    StatsList() {
        head = nullptr;
    }

    // Free every node when the list is destroyed
    ~StatsList() {
        StatNode* current = head;
        while (current != nullptr) {
            StatNode* nextNode = current->next;
            delete current;
            current = nextNode;
        }
        head = nullptr;
    }

    // We never copy a list (two lists would delete the same nodes),
    // so copying is switched off.
    StatsList(const StatsList&) = delete;
    StatsList& operator=(const StatsList&) = delete;

    // Insert a player so the list stays sorted from highest to lowest.
    // If byRuns is true, sort by totalRuns; otherwise sort by totalWickets.
    void insertSorted(Player* p, bool byRuns) {
        StatNode* node = new StatNode(p);

        // Value used for comparison
        int newVal = byRuns ? p->totalRuns : p->totalWickets;

        // Insert at head if list is empty or new value is bigger than head
        if (head == nullptr) {
            head = node;
            return;
        }

        int headVal = byRuns ? head->player->totalRuns : head->player->totalWickets;
        if (newVal > headVal) {
            node->next = head;
            head = node;
            return;
        }

        // Walk until we find where the new node fits
        StatNode* current = head;
        while (current->next != nullptr) {
            int nextVal = byRuns ? current->next->player->totalRuns
                                 : current->next->player->totalWickets;
            if (newVal > nextVal) {
                break;
            }
            current = current->next;
        }

        node->next = current->next;
        current->next = node;
    }

    // Get the head node (for walking the list)
    StatNode* getHead() { return head; }
};

#endif
