export const GAME_REGISTRY_ABI = [
  "function addGame(string calldata name, string calldata gameURL) external returns (uint256)",
  "function getGame(uint256 gameId) external view returns (uint256, string, string)",
  "function nextGameId() external view returns (uint256)"
];

export const GAME_REGISTRY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
