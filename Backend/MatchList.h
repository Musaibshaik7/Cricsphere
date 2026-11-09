// MatchList.h - Linked list that stores the match history
// Each node holds one Match and a pointer to the next node.
#ifndef MATCHLIST_H
#define MATCHLIST_H

#include "Match.h"

using namespace std;

// One box of the linked list
struct MatchNode {
    Match data;          // the match stored in this node
    MatchNode* next;     // arrow to the next node (nullptr = last node)

    MatchNode(const Match& m) {
        data = m;
        next = nullptr;
    }
};

class MatchList {
private:
    MatchNode* head;     // first node
    MatchNode* tail;     // last node (so adding at the end is quick)
    int count;

public:
    MatchList() {
        head = nullptr;
        tail = nullptr;
        count = 0;
    }

    // Free every node when the list is destroyed
    ~MatchList() {
        clear();
    }

    // We never copy a list (two lists would delete the same nodes),
    // so copying is switched off.
    MatchList(const MatchList&) = delete;
    MatchList& operator=(const MatchList&) = delete;

    // Add a match at the END of the list
    void addAtEnd(const Match& m) {
        MatchNode* node = new MatchNode(m);
        if (head == nullptr) {
            head = node;       // first match ever
            tail = node;
        } else {
            tail->next = node; // old last node points to the new one
            tail = node;
        }
        count++;
    }

    // Get the match at position index (0 = first). Walk node by node.
    Match& get(int index) {
        MatchNode* current = head;
        for (int i = 0; i < index; i++) {
            current = current->next;
        }
        return current->data;
    }

    int size() { return count; }

    bool isEmpty() { return count == 0; }

    // Delete all nodes
    void clear() {
        MatchNode* current = head;
        while (current != nullptr) {
            MatchNode* nextNode = current->next;
            delete current;
            current = nextNode;
        }
        head = nullptr;
        tail = nullptr;
        count = 0;
    }
};

#endif
