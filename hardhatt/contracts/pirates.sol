
pragma solidity ^0.8.21;

/* =============== CrewManager (Prototype) =============== */
// SPDX-License-Identifier: MIT

contract CrewManager {
    // ----------------------
    // 데이터 구조
    // ----------------------
    struct Crew {
        address owner;   // 등록한 지갑
        uint32 wins;
        uint32 losses;
        uint32 draws;
    }

    // ----------------------
    // 상태 변수
    // ----------------------
    uint256 public nextCrewId = 1;        // 첫 crewId = 1
    mapping(uint256 => Crew) public crews;
    address public matchManager;          // 한 번 설정 후 고정

    // ----------------------
    // 이벤트
    // ----------------------
    event CrewRegistered(uint256 indexed crewId, address indexed owner);
    event CrewUpdated(
        uint256 indexed crewId,
        uint32 wins,
        uint32 losses,
        uint32 draws
    );
    event MatchManagerSet(address indexed matchManager);

    // ----------------------
    // matchManager 설정 (1회)
    // ----------------------
    function setMatchManager(address m) external {
        require(matchManager == address(0), "already set");
        require(m != address(0), "zero addr");
        matchManager = m;
        emit MatchManagerSet(m);
    }

    // ----------------------
    // Crew 등록
    // ----------------------
    function registerCrew() external returns (uint256 crewId) {
        crews[nextCrewId] = Crew({
            owner: msg.sender,
            wins: 0,
            losses: 0,
            draws: 0
        });

        crewId = nextCrewId;
        nextCrewId++;
        
        emit CrewRegistered(crewId, msg.sender);
    }

    // ----------------------
    // 스탯 갱신 (오직 matchManager)
    // ----------------------
    modifier onlyMatchManager() {
        require(msg.sender == matchManager, "only matchManager");
        _;
    }

    function addWin(uint256 crewId) external onlyMatchManager {
        crews[crewId].wins += 1;
        emit CrewUpdated(
            crewId,
            crews[crewId].wins,
            crews[crewId].losses,
            crews[crewId].draws
        );
    }

    function addLoss(uint256 crewId) external onlyMatchManager {
        crews[crewId].losses += 1;
        emit CrewUpdated(
            crewId,
            crews[crewId].wins,
            crews[crewId].losses,
            crews[crewId].draws
        );
    }

    function addDraw(uint256 crewId) external onlyMatchManager {
        crews[crewId].draws += 1;
        emit CrewUpdated(
            crewId,
            crews[crewId].wins,
            crews[crewId].losses,
            crews[crewId].draws
        );
    }

    // ----------------------
    // 조회 함수
    // ----------------------
    function getCrew(uint256 crewId) external view returns (
        address owner,
        uint32 wins,
        uint32 losses,
        uint32 draws
    ) {
        Crew storage c = crews[crewId];
        return (c.owner, c.wins, c.losses, c.draws);
    }

    function getPoint(uint256 crewId) external view returns (uint32) {
        Crew storage c = crews[crewId];
        return c.wins * 3 + c.draws;
    }
}


/* =============== GameRegistry (Prototype) =============== */
contract GameRegistry {
    struct Game {
        uint256 gameId;
        string name;
        string gameURL;
    }

    uint256 public nextGameId = 1;
    mapping(uint256 => Game) public games;

    function addGame(string calldata name, string calldata gameURL) external returns (uint256 id) {
        id = nextGameId++;
        games[id] = Game(id, name, gameURL);
    }

    function getGame(uint256 gameId) external view returns (uint256, string memory, string memory) {
        Game storage g = games[gameId];
        return (g.gameId, g.name, g.gameURL);
    }
}

/* =============== MatchManager (Prototype) =============== */
interface ICrewManager {
    function addWin(uint256 crewId) external;
    function addLoss(uint256 crewId) external;
    function addDraw(uint256 crewId) external;
}

contract MatchManager {
    ICrewManager public crewManager;

    struct Match {
        uint256 matchId;
        uint256 gameId;
        uint256[] winners;
        uint256[] losers;
        uint256[] draws;
        bool finalized;
    }

    uint256 public nextMatchId = 1;
    mapping(uint256 => Match) public matches;

    event MatchFinalized(uint256 indexed matchId, uint256 indexed gameId);

    constructor(address crewManagerAddr) {
        crewManager = ICrewManager(crewManagerAddr);
    }

    // PROTOTYPE: 아무나 호출
    function finalizeMatch(
        uint256 gameId,
        uint256[] calldata winners,
        uint256[] calldata losers,
        uint256[] calldata draws
    ) external returns (uint256 id) {
        id = nextMatchId++;
        Match storage m = matches[id];
        m.matchId = id;
        m.gameId = gameId;
        m.winners = winners;
        m.losers = losers;
        m.draws = draws;
        m.finalized = true;

        // 즉시 스탯 반영
        for (uint i = 0; i < winners.length; i++) {
            crewManager.addWin(winners[i]);
        }
        for (uint i = 0; i < losers.length; i++) {
            crewManager.addLoss(losers[i]);
        }
        for (uint i = 0; i < draws.length; i++) {
            crewManager.addDraw(draws[i]);
        }

        emit MatchFinalized(id, gameId);
    }

    function getMatch(uint256 matchId) external view returns (
        uint256 id,
        uint256 gameId,
        uint256[] memory winners,
        uint256[] memory losers,
        uint256[] memory draws,
        bool finalized
    ) {
        Match storage m = matches[matchId];
        return (m.matchId, m.gameId, m.winners, m.losers, m.draws, m.finalized);
    }
}
