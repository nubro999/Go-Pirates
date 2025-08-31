const hre = require("hardhat");

async function main() {
  // CrewManager 배포
  const CrewManager = await hre.ethers.getContractFactory("CrewManager");
  const crewManager = await CrewManager.deploy();
  await crewManager.waitForDeployment(); // Hardhat v2.20 이상에서 사용
  console.log("CrewManager deployed to:", await crewManager.getAddress());

  // GameRegistry 배포
  const GameRegistry = await hre.ethers.getContractFactory("GameRegistry");
  const gameRegistry = await GameRegistry.deploy();
  await gameRegistry.waitForDeployment();
  console.log("GameRegistry deployed to:", await gameRegistry.getAddress());

  // MatchManager 배포 (CrewManager 주소 필요)
  const MatchManager = await hre.ethers.getContractFactory("MatchManager");
  const matchManager = await MatchManager.deploy(await crewManager.getAddress());
  await matchManager.waitForDeployment();
  console.log("MatchManager deployed to:", await matchManager.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
