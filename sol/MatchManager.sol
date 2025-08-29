// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "./CrewManager.sol";
import "./GameRegistry.sol";
import "./libraries/ScoringLibrary.sol";

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

    address public referee;
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

    function _isParticipant(uint256 matchId, uint256 crewId) internal view returns (bool) {
        uint256[] memory p = matches[matchId].participants;
        for (uint i=0;i<p.length;i++){
            if (p[i] == crewId) return true;
        }
        return false;
    }

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

        approvals[matchId][crewId] = true;

        bool all = true;
        for (uint i=0;i<m.participants.length;i++){
            if (!approvals[matchId][m.participants[i]]) {
                all = false; break;
            }
        }

        if (all) {
            m.status = MatchStatus.ACCEPTED;
            m.startedAt = uint64(block.timestamp);
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
        m.status = MatchStatus.COMPLETED;

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
        if (keccak256(bytes(resolution)) == keccak256("CANCEL")) {
            m.status = MatchStatus.CANCELED;
        } else {
            m.status = MatchStatus.COMPLETED;
        }
        emit MatchResolved(matchId, resolution);
    }

    function finalizeMatch(
        uint256 matchId,
        uint256[] calldata winners,
        uint256[] calldata losers,
        uint256[] calldata rawScores
    ) external {
        Match storage m = matches[matchId];
        require(m.status == MatchStatus.COMPLETED, "Not ready to finalize");
        require(block.timestamp > m.disputeDeadline, "Dispute window not passed");
        for (uint i=0;i<m.participants.length;i++){
            require(approvals[matchId][m.participants[i]], "Not all approved");
        }
        require(!m.scoreDeltaApplied, "Already applied");

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

            if (outcomeA == 1) {
                crewManager.rawSetElo(cA, newA);
                crewManager.rawSetElo(cB, newB);
            } else if (outcomeA == 0) {
                crewManager.rawSetElo(cA, newA);
                crewManager.rawSetElo(cB, newB);
            } else {
                crewManager.rawSetElo(cA, newA);
                crewManager.rawSetElo(cB, newB);
            }
        }
        m.scoreDeltaApplied = true;
        m.completedAt = uint64(block.timestamp);

        emit MatchFinalized(matchId);
    }
}
