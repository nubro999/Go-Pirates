import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DeployModule", (m) => {
  // 1. CrewManager 배포
  const crewManager = m.contract("CrewManager");

  // 2. GameRegistry 배포
  const gameRegistry = m.contract("GameRegistry");

  // 3. MatchManager 배포 (CrewManager 주소 필요)
  const matchManager = m.contract("MatchManager", [crewManager]);

  // 4. CrewManager에 MatchManager 주소 등록
  m.call(crewManager, "setMatchManager", [matchManager]);

  return { crewManager, gameRegistry, matchManager };
});