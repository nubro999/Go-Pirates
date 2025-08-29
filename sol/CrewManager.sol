// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

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

    function _addWin(uint256 crewId) external {
        require(msg.sender == tx.origin, "Demo only - not secure");
        crews[crewId].wins += 1;
        crews[crewId].score += 3;
    }

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

    function rawSetElo(uint256 crewId, uint256 newElo) external {
        require(msg.sender == tx.origin, "Demo only");
        crews[crewId].eloRating = newElo;
    }

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
