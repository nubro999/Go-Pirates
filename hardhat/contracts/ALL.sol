// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/* =========================================================
 * CrewManager (최소화)
 * =========================================================*/
contract CrewManager {
    struct Crew {
        uint256 crewId;
        address owner;
        uint32 wins;
        uint32 losses;
        uint32 draws;
    }

    uint256 public nextCrewId = 1;
    mapping(uint256 => Crew) public crews;

    function registerCrew() external returns (uint256) {
        uint256 id = nextCrewId++;
        crews[id] = Crew(id, msg.sender, 0, 0, 0);
        return id;
    }

    function getCrew(uint256 crewId) external view returns (
        uint256 id,
        address owner,
        uint32 wins,
        uint32 losses,
        uint32 draws
    ) {
        Crew storage c = crews[crewId];
        return (c.crewId, c.owner, c.wins, c.losses, c.draws);
    }

    function addWin(uint256 crewId) external {
        require(crews[crewId].owner == msg.sender, "Not owner");
        crews[crewId].wins += 1;
    }

    function addLoss(uint256 crewId) external {
        require(crews[crewId].owner == msg.sender, "Not owner");
        crews[crewId].losses += 1;
    }

    function addDraw(uint256 crewId) external {
        require(crews[crewId].owner == msg.sender, "Not owner");
        crews[crewId].draws += 1;
    }

    function getPoint(uint256 crewId) external view returns (uint32) {
        Crew storage c = crews[crewId];
        return c.wins * 3 + c.draws;
    }
}

/* =========================================================
 * GameRegistry (링크 정보 포함)
 * =========================================================*/
contract GameRegistry {
    struct Game {
        uint256 gameId;
        string name;
        string gameURL; // 추가: 게임 관련 링크 정보
    }

    uint256 public nextGameId = 1;
    mapping(uint256 => Game) public games;

    function addGame(string calldata name, string calldata gameURL) external returns (uint256) {
        uint256 id = nextGameId++;
        games[id] = Game(id, name, gameURL);
        return id;
    }

    function getGame(uint256 gameId) external view returns (uint256, string memory, string memory) {
        Game storage g = games[gameId];
        return (g.gameId, g.name, g.gameURL);
    }
}

/* =========================================================
 * MatchManager (게임이름 입력 및 저장)
 * =========================================================*/
interface ICrewManager {
    function addWin(uint256 crewId) external;
    function addLoss(uint256 crewId) external;
    function addDraw(uint256 crewId) external;
}

contract MatchManager {
    ICrewManager public crewManager;

    struct Match {
        uint256 matchId;
        string gameName; // 추가: 게임 이름
        uint256[] winners;
        uint256[] losers;
        uint256[] draws;
        bool finalized;
    }

    uint256 public nextMatchId = 1;
    mapping(uint256 => Match) public matches;

    constructor(address crewManagerAddr) {
        crewManager = ICrewManager(crewManagerAddr);
    }

    // 매치 생성 및 결과 반영 (게임 이름 입력)
    function finalizeMatch(
        string calldata gameName,
        uint256[] calldata winners,
        uint256[] calldata losers,
        uint256[] calldata draws
    ) external returns (uint256) {
        uint256 id = nextMatchId++;
        Match storage m = matches[id];
        m.matchId = id;
        m.gameName = gameName;
        m.winners = winners;
        m.losers = losers;
        m.draws = draws;
        m.finalized = true;

        for (uint i=0; i<winners.length; i++) {
            crewManager.addWin(winners[i]);
        }
        for (uint i=0; i<losers.length; i++) {
            crewManager.addLoss(losers[i]);
        }
        for (uint i=0; i<draws.length; i++) {
            crewManager.addDraw(draws[i]);
        }

        return id;
    }

    function getMatch(uint256 matchId) external view returns (
        uint256 id,
        string memory gameName,
        uint256[] memory winners,
        uint256[] memory losers,
        uint256[] memory draws,
        bool finalized
    ) {
        Match storage m = matches[matchId];
        return (m.matchId, m.gameName, m.winners, m.losers, m.draws, m.finalized);
    }
}
