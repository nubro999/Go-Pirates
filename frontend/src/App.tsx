import React, { useState } from "react";
import { ethers } from "ethers";
import CREW_MANAGER_ABI from "./abi/crewManagerAbi";

type CrewInfo = {
  owner: string;
  wins: number;
  losses: number;
  draws: number;
};

const DEFAULT_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const CrewManagerApp: React.FC = () => {
  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_CONTRACT_ADDRESS);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  const [crewId, setCrewId] = useState<string>("");
  const [crewInfo, setCrewInfo] = useState<CrewInfo | null>(null);
  const [point, setPoint] = useState<string | null>(null);
  const [registerResult, setRegisterResult] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  // MetaMask 연결
  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) throw new Error("MetaMask가 설치되어 있지 않습니다.");
      await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      const _provider = new ethers.BrowserProvider((window as any).ethereum);
      const _signer = await _provider.getSigner();
      setProvider(_provider);
      setSigner(_signer);
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 컨트랙트 인스턴스 생성
  const loadContract = () => {
    if (!provider || !signer || !contractAddress) {
      setError("지갑, 서명자, 컨트랙트 주소를 모두 입력하세요.");
      return;
    }
    const _contract = new ethers.Contract(contractAddress, CREW_MANAGER_ABI, signer);
    setContract(_contract);
    setError("");
  };

  // 크루 등록
  const registerCrew = async () => {
    if (!contract) return setError("컨트랙트를 먼저 연결하세요.");
    try {
      const tx = await contract.registerCrew();
      const receipt = await tx.wait();
      // 이벤트에서 crewId 추출
      const event = receipt.logs?.find((e: any) => e.fragment?.name === "CrewRegistered");
      setRegisterResult(event?.args?.crewId?.toString() || "등록됨");
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 크루 정보 조회
  const fetchCrewInfo = async () => {
    if (!contract || !crewId) return setError("컨트랙트와 크루ID를 입력하세요.");
    try {
      const info = await contract.getCrew(crewId);
      setCrewInfo({
        owner: info.owner,
        wins: Number(info.wins),
        losses: Number(info.losses),
        draws: Number(info.draws)
      });
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 포인트 조회
  const fetchPoint = async () => {
    if (!contract || !crewId) return setError("컨트랙트와 크루ID를 입력하세요.");
    try {
      const pt = await contract.getPoint(crewId);
      setPoint(pt.toString());
      setError("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 승/무/패 추가
  const addResult = async (type: "win" | "draw" | "loss") => {
    if (!contract || !crewId) return setError("컨트랙트와 크루ID를 입력하세요.");
    try {
      let tx;
      if (type === "win") tx = await contract.addWin(crewId);
      else if (type === "draw") tx = await contract.addDraw(crewId);
      else if (type === "loss") tx = await contract.addLoss(crewId);
      await tx.wait();
      setError("");
      fetchCrewInfo(); // 결과 반영
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 font-sans border rounded">
      <h2 className="text-xl font-bold mb-2">CrewManager DApp</h2>
      <button className="mb-3 px-3 py-1 bg-blue-500 text-white rounded" onClick={connectWallet}>
        MetaMask 연결
      </button>
      <br />
      <input
        type="text"
        placeholder="컨트랙트 주소 입력"
        value={contractAddress}
        onChange={e => setContractAddress(e.target.value)}
        className="w-full border p-2 mb-2"
      />
      <button className="mb-3 px-3 py-1 bg-green-500 text-white rounded" onClick={loadContract}>
        컨트랙트 연결
      </button>
      <hr className="my-4" />

      <h3 className="font-semibold">크루 등록</h3>
      <button className="mb-2 px-3 py-1 bg-purple-500 text-white rounded" onClick={registerCrew}>
        크루 등록
      </button>
      {registerResult && <div>등록 결과: {registerResult}</div>}

      <hr className="my-4" />
      <h3 className="font-semibold">크루 정보 조회</h3>
      <input
        type="number"
        placeholder="크루 ID 입력"
        value={crewId}
        onChange={e => setCrewId(e.target.value)}
        className="w-full border p-2 mb-2"
      />
      <button className="mb-2 px-3 py-1 bg-indigo-500 text-white rounded" onClick={fetchCrewInfo}>
        조회
      </button>
      {crewInfo && (
        <div className="border p-2 my-2 rounded bg-gray-50">
          <div>Owner: {crewInfo.owner}</div>
          <div>Wins: {crewInfo.wins}</div>
          <div>Losses: {crewInfo.losses}</div>
          <div>Draws: {crewInfo.draws}</div>
        </div>
      )}

      <hr className="my-4" />
      <h3 className="font-semibold">승/무/패 추가</h3>
      <div className="space-x-2">
        <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={() => addResult("win")}>승 추가</button>
        <button className="px-3 py-1 bg-yellow-500 text-white rounded" onClick={() => addResult("draw")}>무 추가</button>
        <button className="px-3 py-1 bg-gray-700 text-white rounded" onClick={() => addResult("loss")}>패 추가</button>
      </div>

      <hr className="my-4" />
      <h3 className="font-semibold">포인트 조회</h3>
      <button className="mb-2 px-3 py-1 bg-teal-500 text-white rounded" onClick={fetchPoint}>
        포인트 조회
      </button>
      {point && <div>포인트: {point}</div>}

      {error && <div className="text-red-500 mt-2">에러: {error}</div>}
    </div>
  );
};

export default CrewManagerApp;