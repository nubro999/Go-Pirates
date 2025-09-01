export const MATCH_MANAGER_ABI = [
  "function finalizeMatch(uint256 gameId, uint256[] calldata winners, uint256[] calldata losers, uint256[] calldata draws) external returns (uint256)",
  "function getMatch(uint256 matchId) external view returns (uint256, uint256, uint256[], uint256[], uint256[], bool)",
  "function nextMatchId() external view returns (uint256)",
  "function crewManager() external view returns (address)",
  "event MatchFinalized(uint256 indexed matchId, uint256 indexed gameId)"
];

export const MATCH_MANAGER_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
