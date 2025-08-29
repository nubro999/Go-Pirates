// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/* =========================================================
 * Library: Scoring (단순 ELO/Score)
 * =========================================================*/
library ScoringLibrary {
    // 단순 ELO 계산 (1 vs 1 전용 예시)
    function computeElo(
        uint256 eloA,
        uint256 eloB,
        uint8 outcomeA, // 1=win, 0=loss, 2=draw
        uint256 k
    ) internal pure returns (uint256 newA, uint256 newB) {
        // 기대 승률: E = 1 / (1 + 10^((Rb - Ra)/400))
        if (k == 0) k = 32;

        int256 diff = int256(eloB) - int256(eloA);

        uint256 expectA;
        if (diff >= 400) {
            expectA = 100; // 0.1 (스케일 1000 가정)
        } else if (diff >= 200) {
            expectA = 250; // 0.25
        } else if (diff >= 0) {
            expectA = 400; // 0.4
        } else if (diff <= -400) {
            expectA = 900; // 0.9
        } else if (diff <= -200) {
            expectA = 750; // 0.75
        } else {
            expectA = 600; // 0.6
        }

        uint256 scoreA;
        if (outcomeA == 1) scoreA = 1000; // 1.0
        else if (outcomeA == 2) scoreA = 500; // 0.5
        else scoreA = 0;

        int256 deltaA = int256(int(k) * (int(scoreA) - int(expectA)) / 1000);
        int256 deltaB = -deltaA;

        int256 updatedA = int256(eloA) + deltaA;
        int256 updatedB = int256(eloB) + deltaB;

        if (updatedA < 0) updatedA = 0;
        if (updatedB < 0) updatedB = 0;

        newA = uint256(updatedA);
        newB = uint256(updatedB);
    }

    function outcomeFromWinners(uint256 crewA, uint256 crewB, uint256[] memory winners) internal pure returns (uint8 outcomeA) {
        bool aWin;
        bool bWin;
        for (uint i=0;i<winners.length;i++){
            if (winners[i] == crewA) aWin = true;
            if (winners[i] == crewB) bWin = true;
        }
        if (aWin && bWin) return 2; // draw
        if (aWin) return 1;
        return 0;
    }
}
