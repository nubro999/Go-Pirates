const CREW_MANAGER_ABI = [
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "crewId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "CrewRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "crewId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "wins",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "losses",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "draws",
          "type": "uint32"
        }
      ],
      "name": "CrewUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "matchManager",
          "type": "address"
        }
      ],
      "name": "MatchManagerSet",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "crewId",
          "type": "uint256"
        }
      ],
      "name": "addDraw",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "crewId",
          "type": "uint256"
        }
      ],
      "name": "addLoss",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "crewId",
          "type": "uint256"
        }
      ],
      "name": "addWin",
      "outputs": [],
      "stateMutability": "nonpayable",
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
      "name": "crews",
      "outputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint32",
          "name": "wins",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "losses",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "draws",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "crewId",
          "type": "uint256"
        }
      ],
      "name": "getCrew",
      "outputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "internalType": "uint32",
          "name": "wins",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "losses",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "draws",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "crewId",
          "type": "uint256"
        }
      ],
      "name": "getPoint",
      "outputs": [
        {
          "internalType": "uint32",
          "name": "",
          "type": "uint32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "matchManager",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "nextCrewId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "registerCrew",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "crewId",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "m",
          "type": "address"
        }
      ],
      "name": "setMatchManager",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const;
export default CREW_MANAGER_ABI;