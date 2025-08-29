// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

/* =========================================================
 * Interfaces
 * =========================================================*/
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address owner, address to, uint256 amount) external returns (bool);
}

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
        // outcome 점수: win=1, draw=0.5, loss=0
        // 단순 정수 계산 위해 고정소수 점프 없이 진행 (precision 떨어질 수 있음)
        // 개선 여지: FixedPoint 또는 1e4 스케일링
        if (k == 0) k = 32;

        // 기대 승률 근사 (정확한 부동소수 대신 간단! 실제론 고정소수 추천)
        // pow10Diff = 10^((Rb - Ra)/400)
        int256 diff = int256(eloB) - int256(eloA);
        // 간이 근사: diff/400 -> double-like
        // 여기서는 고정: if diff >= 0 => favor B
        // 순수 정밀도 희생 (학습용)
        // 더 정확히는: use: 10 ** ((diff)/400) - but exponent fractional -> 필요 시 로그/exp 근사
        // 여기서는 아주 간단한 piecewise 근사
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
        // outcome 변환
        uint256 scoreA;
        if (outcomeA == 1) scoreA = 1000; // 1.0
        else if (outcomeA == 2) scoreA = 500; // 0.5
        else scoreA = 0;

        // ΔRa = K * (S - E)
        // 스케일 1000 기준
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

/* =========================================================
 * CrewManager
 * =========================================================*/
contract CrewManager {
    enum Role { NONE, OWNER, ADMIN, PLAYER }

    struct Crew {
        uint256 crewId;
        string name;
        address owner;
        uint256 eloRating;
        uint32 wins;
        uint32 losses;
        uint32 draws;
        uint64 score;
        uint256 stake;
        string contentURI;
        uint64 createdAt;
        bool active;
        address[] memberList;
        mapping(address => Role) roles;
    }

    uint256 public nextCrewId = 1;
    mapping(uint256 => Crew) internal crews;

    event CrewRegistered(uint256 indexed crewId, string name, address indexed owner);
    event MemberAdded(uint256 indexed crewId, address member, Role role);
    event MemberRemoved(uint256 indexed crewId, address member);
    event RoleChanged(uint256 indexed crewId, address member, Role role);
    event StakeDeposited(uint256 indexed crewId, uint256 amount);
    event StakeWithdrawn(uint256 indexed crewId, uint256 amount);
    event ContentUpdated(uint256 indexed crewId, string newURI);

    modifier onlyCrewOwner(uint256 crewId) {
        require(crews[crewId].owner == msg.sender, "Not crew owner");
        _;
    }

    modifier crewExists(uint256 crewId) {
        require(crews[crewId].crewId != 0 && crews[crewId].active, "Crew not exists");
        _;
    }

    function registerCrew(string memory name, string memory contentURI) external returns (uint256) {
        uint256 id = nextCrewId++;
        Crew storage c = crews[id];
        c.crewId = id;
        c.name = name;
        c.owner = msg.sender;
        c.eloRating = 1000;
        c.contentURI = contentURI;
        c.createdAt = uint64(block.timestamp);
        c.active = true;
        c.roles[msg.sender] = Role.OWNER;
        c.memberList.push(msg.sender);

        emit CrewRegistered(id, name, msg.sender);
        return id;
    }

    function updateContentURI(uint256 crewId, string memory newURI) external crewExists(crewId) onlyCrewOwner(crewId) {
        crews[crewId].contentURI = newURI;
        emit ContentUpdated(crewId, newURI);
    }

    function addMember(uint256 crewId, address member, Role role) external crewExists(crewId) onlyCrewOwner(crewId) {
        require(role != Role.NONE && role != Role.OWNER, "Invalid role");
        require(crews[crewId].roles[member] == Role.NONE, "Already member");
        crews[crewId].roles[member] = role;
        crews[crewId].memberList.push(member);
        emit MemberAdded(crewId, member, role);
    }

    function removeMember(uint256 crewId, address member) external crewExists(crewId) onlyCrewOwner(crewId) {
        require(member != crews[crewId].owner, "Cannot remove owner");
        require(crews[crewId].roles[member] != Role.NONE, "Not member");
        crews[crewId].roles[member] = Role.NONE;
        // 간단: 배열에서 지우지 않고 논리적 제거(최적화 생략)
        emit MemberRemoved(crewId, member);
    }

    function setRole(uint256 crewId, address member, Role role) external crewExists(crewId) onlyCrewOwner(crewId) {
        require(role != Role.OWNER, "Cannot assign owner role");
        require(crews[crewId].roles[member] != Role.NONE, "Not member");
        crews[crewId].roles[member] = role;
        emit RoleChanged(crewId, member, role);
    }

    function stakeDeposit(uint256 crewId) external payable crewExists(crewId) {
        require(crews[crewId].roles[msg.sender] != Role.NONE, "Not member");
        crews[crewId].stake += msg.value;
        emit StakeDeposited(crewId, msg.value);
    }

    function withdrawStake(uint256 crewId, uint256 amount) external crewExists(crewId) onlyCrewOwner(crewId) {
        require(crews[crewId].stake >= amount, "Insufficient stake");
        // 단순: 매치 잠금 로직 없이 즉시 출금 (실제론 pending disputes 고려)
        crews[crewId].stake -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "ETH transfer failed");
        emit StakeWithdrawn(crewId, amount);
    }

    function getCrew(uint256 crewId) external view returns (
        uint256 id,
        string memory name,
        address owner,
        uint256 eloRating,
        uint32 wins,
        uint32 losses,
        uint32 draws,
        uint64 score,
        uint256 stake,
        string memory contentURI,
        uint64 createdAt,
        bool active,
        address[] memory members
    ) {
        Crew storage c = crews[crewId];
        id = c.crewId;
        name = c.name;
        owner = c.owner;
        eloRating = c.eloRating;
        wins = c.wins;
        losses = c.losses;
        draws = c.draws;
        score = c.score;
        stake = c.stake;
        contentURI = c.contentURI;
        createdAt = c.createdAt;
        active = c.active;
        members = c.memberList;
    }

    function roleOf(uint256 crewId, address user) external view returns (Role) {
        return crews[crewId].roles[user];
    }

    // 내부 업데이트용 (MatchManager에서 사용)
    function _addWin(uint256 crewId) external {
        require(msg.sender == tx.origin, "Demo only - not secure"); // 간단 데모 보호(실제로는 MatchManager만 허용)
        crews[crewId].wins += 1;
        crews[crewId].score += 3;
    }

    // Access를 위해 MatchManager에 friend-like 기능을 주려면 address 저장 + modifier 구현 필요 (아래 MatchManager 안에서 직접 접근하도록 설계 변경 권장)
    // 여기서는 MatchManager가 public state 수정하지 않고 CrewManager를 직접 deploy 후 address를 알고 있으면 crew state 직접 접근 불가 -> 개선 위해 아래 getter 제공
    function _updateAfterMatch(
        uint256 crewId,
        uint32 win,
        uint32 loss,
        uint32 draw,
        uint64 scoreDelta,
        uint256 newElo
    ) external {
        require(msg.sender == tx.origin, "Demo only - replace with MatchManager auth");
        Crew storage c = crews[crewId];
        c.wins += win;
        c.losses += loss;
        c.draws += draw;
        c.score += scoreDelta;
        c.eloRating = newElo;
    }

    // 간단 접근자 (실제로는 MatchManager에서 CrewManager storage 직접 조작 대신 인터페이스 만들거나 같은 컨트랙트에 합치는 방식 고려)
    function rawSetElo(uint256 crewId, uint256 newElo) external {
        require(msg.sender == tx.origin, "Demo only");
        crews[crewId].eloRating = newElo;
    }

    // 데모 편의(실제 Production에서는 MatchManager 하나만 허용하는 접근 제어 필요)
    function safeUpdateStats(
        uint256 crewId,
        uint32 w,
        uint32 l,
        uint32 d,
        uint64 scoreDelta,
        uint256 newElo
    ) external {
        require(msg.sender == tx.origin, "Demo only");
        Crew storage c = crews[crewId];
        c.wins += w;
        c.losses += l;
        c.draws += d;
        c.score += scoreDelta;
        c.eloRating = newElo;
    }
}

/* =========================================================
 * GameRegistry
 * =========================================================*/
contract GameRegistry {
    enum GameType { ONCHAIN, WEB2_API, PHYSICAL, OTHER }

    struct Game {
        uint256 gameId;
        string name;
        GameType gameType;
        address contractAddress;
        string externalURL;
        string rulesURI;
        bool isActive;
    }

    uint256 public nextGameId = 1;
    mapping(uint256 => Game) public games;
    address public admin;

    event GameAdded(uint256 indexed gameId, string name);
    event GameToggled(uint256 indexed gameId, bool isActive);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addGame(
        string calldata name,
        GameType gtype,
        address caddr,
        string calldata externalURL,
        string calldata rulesURI
    ) external onlyAdmin returns (uint256) {
        uint256 id = nextGameId++;
        games[id] = Game({
            gameId: id,
            name: name,
            gameType: gtype,
            contractAddress: caddr,
            externalURL: externalURL,
            rulesURI: rulesURI,
            isActive: true
        });
        emit GameAdded(id, name);
        return id;
    }

    function toggleGame(uint256 gameId) external onlyAdmin {
        games[gameId].isActive = !games[gameId].isActive;
        emit GameToggled(gameId, games[gameId].isActive);
    }
}

/* =========================================================
 * MatchManager (단순 MVP)
 * =========================================================*/
contract MatchManager {
    enum MatchStatus { NONE, PROPOSED, ACCEPTED, COMPLETED, DISPUTED, CANCELED }

    struct Match {
        uint256 matchId;
        uint256 gameId;
        uint256[] participants;
        uint256 proposedBy;
        MatchStatus status;
        uint64 scheduledAt;
        uint64 startedAt;
        uint64 completedAt;
        string participationProofURI;
        bytes32 resultHash;
        bool scoreDeltaApplied;
        bool oracleRequired;
        uint64 disputeDeadline;
        uint256 stakeLocked;
    }

    uint256 public nextMatchId = 1;
    mapping(uint256 => Match) public matches;
    mapping(uint256 => mapping(uint256 => bool)) public approvals; // matchId => crewId => approved

    address public referee; // 단순 분쟁 해결자
    CrewManager public crewManager;
    GameRegistry public gameRegistry;

    uint64 public defaultDisputeWindow = 1 days;

    event MatchProposed(uint256 indexed matchId, uint256 gameId, uint256[] participants);
    event MatchAccepted(uint256 indexed matchId);
    event ResultSubmitted(uint256 indexed matchId, bytes32 resultHash);
    event MatchApproved(uint256 indexed matchId, uint256 crewId);
    event MatchFinalized(uint256 indexed matchId);
    event MatchDisputed(uint256 indexed matchId);
    event MatchResolved(uint256 indexed matchId, string resolution);

    modifier onlyReferee() {
        require(msg.sender == referee, "Not referee");
        _;
    }

    constructor(address _crewManager, address _gameRegistry) {
        crewManager = CrewManager(_crewManager);
        gameRegistry = GameRegistry(_gameRegistry);
        referee = msg.sender;
    }

    // helper: 참가자인지 체크
    function _isParticipant(uint256 matchId, uint256 crewId) internal view returns (bool) {
        uint256[] memory p = matches[matchId].participants;
        for (uint i=0;i<p.length;i++){
            if (p[i] == crewId) return true;
        }
        return false;
    }

    // Crew owner만 행동 허용하기 위해 owner 주소 비교
    function _requireCrewOwner(uint256 crewId) internal view {
        (, , address owner,,,,,,,,,,) = crewManager.getCrew(crewId);
        require(owner == msg.sender, "Not crew owner");
    }

    function proposeMatch(
        uint256 gameId,
        uint256[] calldata participants,
        uint64 scheduledAt,
        bool oracleRequired
    ) external returns (uint256) {
        require(participants.length >= 2, "Need >=2 participants");
        // 첫 참가자를 proposer로 삼고 그 크루 오너만 제안 가능
        uint256 proposerCrew = participants[0];
        _requireCrewOwner(proposerCrew);

        uint256 id = nextMatchId++;
        Match storage m = matches[id];
        m.matchId = id;
        m.gameId = gameId;
        for (uint i=0;i<participants.length;i++) {
            m.participants.push(participants[i]);
        }
        m.proposedBy = proposerCrew;
        m.status = MatchStatus.PROPOSED;
        m.scheduledAt = scheduledAt;
        m.oracleRequired = oracleRequired;

        emit MatchProposed(id, gameId, participants);
        return id;
    }

    function acceptMatch(uint256 matchId, uint256 crewId) external {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.PROPOSED || m.status == MatchStatus.ACCEPTED, "Bad status");
        require(_isParticipant(matchId, crewId), "Not participant");
        _requireCrewOwner(crewId);

        // 모든 참가자 오너가 acceptMatch 한 것으로 단순화:
        approvals[matchId][crewId] = true;

        // 전원 수락 확인
        bool all = true;
        for (uint i=0;i<m.participants.length;i++){
            if (!approvals[matchId][m.participants[i]]) {
                all = false; break;
            }
        }

        if (all) {
            // 초기 approvals는 수락으로만 사용, 결과 제출 후 approvals 초기화 가능(여기서는 단순)
            m.status = MatchStatus.ACCEPTED;
            m.startedAt = uint64(block.timestamp);
            // 수락 이후 result 승인과 구분하기 위해 초기화할 수도 있으나 단순화를 위해 그대로 사용 → 실전에서는 별도 구조 분리 권장
        }
        emit MatchAccepted(matchId);
    }

    function submitResult(
        uint256 matchId,
        bytes32 resultHash,
        string calldata participationProofURI,
        uint64 disputeWindowSeconds
    ) external {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.ACCEPTED, "Not accepted");
        // 제출자: 참여 크루 중 하나의 오너
        bool isOwner=false;
        for (uint i=0;i<m.participants.length;i++){
            (, , address owner,,,,,,,,,,) = crewManager.getCrew(m.participants[i]);
            if (owner == msg.sender) { isOwner = true; break; }
        }
        require(isOwner, "Not participant owner");
        require(m.resultHash == bytes32(0), "Already submitted");

        m.resultHash = resultHash;
        m.participationProofURI = participationProofURI;
        m.disputeDeadline = uint64(block.timestamp + (disputeWindowSeconds == 0 ? defaultDisputeWindow : disputeWindowSeconds));
        m.status = MatchStatus.COMPLETED; // 상태를 COMPLETED로 두고 finalize 전 단계로 단순화

        // 결과 승인용 approvals 초기화 (수락 때 사용했던 것과 충돌 방지 위해 재설정)
        for (uint i=0;i<m.participants.length;i++){
            approvals[matchId][m.participants[i]] = false;
        }

        emit ResultSubmitted(matchId, resultHash);
    }

    function approveResult(uint256 matchId, uint256 crewId) external {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.COMPLETED, "Not in completed state");
        require(_isParticipant(matchId, crewId), "Not participant");
        _requireCrewOwner(crewId);
        approvals[matchId][crewId] = true;
        emit MatchApproved(matchId, crewId);
    }

    function openDispute(uint256 matchId, uint256 crewId, string calldata /*reasonURI*/) external {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.COMPLETED, "Not completed");
        require(block.timestamp <= m.disputeDeadline, "Dispute window passed");
        require(_isParticipant(matchId, crewId), "Not participant");
        _requireCrewOwner(crewId);
        m.status = MatchStatus.DISPUTED;
        emit MatchDisputed(matchId);
    }

    function resolveDispute(uint256 matchId, string calldata resolution) external onlyReferee {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.DISPUTED, "Not disputed");
        // resolution에 따라: 이 예시에서는 단순히 CANCELED 시키거나 or 유지
        // 실제: resolution 파싱, ELO/점수 재계산, 재경기 지시 등
        if (keccak256(bytes(resolution)) == keccak256("CANCEL")) {
            m.status = MatchStatus.CANCELED;
        } else {
            // 수동 강제 승자 설정 등 로직 필요
            m.status = MatchStatus.COMPLETED; // 다시 완료로 돌림 → finalize 가능
        }
        emit MatchResolved(matchId, resolution);
    }

    function finalizeMatch(
        uint256 matchId,
        uint256[] calldata winners,
        uint256[] calldata losers,
        uint256[] calldata rawScores // crewId,score,crewId,score ... 형태 단순화 가능
    ) external {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.COMPLETED, "Not ready to finalize");
        require(block.timestamp > m.disputeDeadline, "Dispute window not passed");
        // 모든 참가자 승인 확인
        for (uint i=0;i<m.participants.length;i++){
            require(approvals[matchId][m.participants[i]], "Not all approved");
        }
        require(!m.scoreDeltaApplied, "Already applied");

        // 단순: 1 vs 1만 ELO 예시
        if (m.participants.length == 2) {
            uint256 cA = m.participants[0];
            uint256 cB = m.participants[1];
            (   /* id */        ,
            /* name */      ,
            /* owner */     ,
            uint256 eloA    ,
            /* wins */      ,
            /* losses */    ,
            /* draws */     ,
            /* score */     ,
            /* stake */     ,
            /* contentURI */ ,
            /* createdAt */ ,
            /* active */    ,
            /* members */ 
            ) = crewManager.getCrew(cA);

            (   /* id */        ,
            /* name */      ,
            /* owner */     ,
            uint256 eloB    ,
            /* wins */      ,
            /* losses */    ,
            /* draws */     ,
            /* score */     ,
            /* stake */     ,
            /* contentURI */ ,
            /* createdAt */ ,
            /* active */    ,
            /* members */ 
            ) = crewManager.getCrew(cB);

            uint8 outcomeA = ScoringLibrary.outcomeFromWinners(cA, cB, winners);
            (uint256 newA, uint256 newB) = ScoringLibrary.computeElo(eloA, eloB, outcomeA, 32);

            // 간단 승패/무승부 기록 및 score 포인트
            if (outcomeA == 1) {
                // A 승
                crewManager.rawSetElo(cA, newA);
                crewManager.rawSetElo(cB, newB);
                // 여기서는 wins/losses 업데이트를 직접 접근 못하므로 실제 Production에서는 CrewManager에 전용 함수 제공 필요
                // 데모로는 safeUpdateStats 주장 (tx.origin 제약 때문에 테스트 환경 한정)
            } else if (outcomeA == 0) {
                crewManager.rawSetElo(cA, newA);
                crewManager.rawSetElo(cB, newB);
            } else {
                crewManager.rawSetElo(cA, newA);
                crewManager.rawSetElo(cB, newB);
            }
            // (실제 구현: crewManager.safeUpdateStats 호출 등을 통해 wins/losses/score 갱신)
        }
        m.scoreDeltaApplied = true;
        m.completedAt = uint64(block.timestamp);

        emit MatchFinalized(matchId);
    }
}

/* =========================================================
 * SponsorshipManager (간단 예시)
 * =========================================================*/
contract SponsorshipManager {
    enum DistributionPolicy { FIXED_TOP1, EQUAL_ALL }

    struct PrizePool {
        uint256 poolId;
        address token; // address(0)=ETH
        uint256 totalAmount;
        uint256 lockedAmount;
        DistributionPolicy policy;
        string eligibilityRulesURI;
        address manager;
        bool isActive;
        bool lockedForSeason;
        uint256[] eligibleCrews; // 단순
    }

    uint256 public nextPoolId = 1;
    mapping(uint256 => PrizePool) public pools;

    address public admin;

    event PoolCreated(uint256 indexed poolId);
    event FundsAdded(uint256 indexed poolId, uint256 amount);
    event PoolLocked(uint256 indexed poolId);
    event Distributed(uint256 indexed poolId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyPoolManager(uint256 poolId) {
        require(pools[poolId].manager == msg.sender, "Not pool manager");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createPool(
        address token,
        DistributionPolicy policy,
        string calldata eligibilityRulesURI,
        address manager,
        uint256[] calldata initialEligible
    ) external onlyAdmin returns (uint256) {
        uint256 id = nextPoolId++;
        PrizePool storage p = pools[id];
        p.poolId = id;
        p.token = token;
        p.policy = policy;
        p.eligibilityRulesURI = eligibilityRulesURI;
        p.manager = manager;
        p.isActive = true;
        for (uint i=0;i<initialEligible.length;i++){
            p.eligibleCrews.push(initialEligible[i]);
        }
        emit PoolCreated(id);
        return id;
    }

    function addFunds(uint256 poolId, uint256 amount) external payable {
        PrizePool storage p = pools[poolId];
        require(p.isActive, "Inactive pool");
        if (p.token == address(0)) {
            require(msg.value == amount, "ETH amount mismatch");
            p.totalAmount += amount;
        } else {
            require(msg.value == 0, "No ETH");
            IERC20(p.token).transferFrom(msg.sender, address(this), amount);
            p.totalAmount += amount;
        }
        emit FundsAdded(poolId, amount);
    }

    function lockForSeason(uint256 poolId) external onlyPoolManager(poolId) {
        PrizePool storage p = pools[poolId];
        require(!p.lockedForSeason, "Already locked");
        p.lockedAmount = p.totalAmount;
        p.lockedForSeason = true;
        emit PoolLocked(poolId);
    }

    function distribute(uint256 poolId) external onlyPoolManager(poolId) {
        PrizePool storage p = pools[poolId];
        require(p.lockedForSeason, "Not locked");
        require(p.lockedAmount > 0, "Nothing to distribute");
        require(p.eligibleCrews.length > 0, "No eligible crews");

        uint256 amount = p.lockedAmount;
        p.lockedAmount = 0; // 1회성 분배
        if (p.policy == DistributionPolicy.FIXED_TOP1) {
            // 단순: 첫 번째 eligible에게 전부 지급 (실제로는 외부 랭킹 로직 필요)
            _payout(p.token, p.eligibleCrews[0], amount);
        } else if (p.policy == DistributionPolicy.EQUAL_ALL) {
            uint256 share = amount / p.eligibleCrews.length;
            for (uint i=0;i<p.eligibleCrews.length;i++){
                _payout(p.token, p.eligibleCrews[i], share);
            }
            // 나머지 잔액은 남겨두거나 첫 Crew에 더하거나 별도 정책 필요
        }
        emit Distributed(poolId);
    }

    function _payout(address token, uint256 /*crewId*/, uint256 amount) internal {
        // 실제로는 crew treasury 주소 필요. 여기서는 간단히 manager에게 대리 지급
        // 개선: CrewManager에서 crewId → payout address 조회
        if (token == address(0)) {
            (bool ok,) = payable(msg.sender).call{value: amount}("");
            require(ok, "ETH send fail");
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }
}