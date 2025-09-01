const MATCH_MANAGER_ABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "crewManagerAddr",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "gameId",
          "type": "uint256"
        }
      ],
      "name": "MatchFinalized",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "crewManager",
      "outputs": [
        {
          "internalType": "contract ICrewManager",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "gameId",
          "type": "uint256"
        },
        {
          "internalType": "uint256[]",
          "name": "winners",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "losers",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "draws",
          "type": "uint256[]"
        }
      ],
      "name": "finalizeMatch",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        }
      ],
      "name": "getMatch",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "gameId",
          "type": "uint256"
        },
        {
          "internalType": "uint256[]",
          "name": "winners",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "losers",
          "type": "uint256[]"
        },
        {
          "internalType": "uint256[]",
          "name": "draws",
          "type": "uint256[]"
        },
        {
          "internalType": "bool",
          "name": "finalized",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "matches",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "matchId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "gameId",
          "type": "uint256"
        },
        {
          "internalType": "bool",
          "name": "finalized",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextMatchId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const;
export default MATCH_MANAGER_ABI;