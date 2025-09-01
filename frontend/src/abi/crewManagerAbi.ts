export const CREW_MANAGER_ABI = [
  "function setMatchManager(address m) external",
  "function registerCrew() external returns (uint256)",
  "function addWin(uint256 crewId) external",
  "function addLoss(uint256 crewId) external", 
  "function addDraw(uint256 crewId) external",
  "function getCrew(uint256 crewId) external view returns (address, uint32, uint32, uint32)",
  "function getPoint(uint256 crewId) external view returns (uint32)",
  "function nextCrewId() external view returns (uint256)",
  "function matchManager() external view returns (address)",
  "event CrewRegistered(uint256 indexed crewId, address indexed owner)",
  "event CrewUpdated(uint256 indexed crewId, uint32 wins, uint32 losses, uint32 draws)"
];

export const CREW_MANAGER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
