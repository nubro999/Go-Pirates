// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

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
