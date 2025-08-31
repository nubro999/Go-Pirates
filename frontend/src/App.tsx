import React, { useState } from "react";
import { useWeb3 } from "./hooks/useWeb3";
import { useCrewManager } from "./hooks/useCrewManager";
import { useGameRegistry } from "./hooks/useGameRegistry";
import { useMatchManager } from "./hooks/useMatchManager";

function App() {
  const { account } = useWeb3();
  const crewManager = useCrewManager();
  const gameRegistry = useGameRegistry();
  const matchManager = useMatchManager();

  // Crew 등록
  const [crewId, setCrewId] = useState<number | null>(null);
  const registerCrew = async () => {
    if (!crewManager) return;
    const tx = await crewManager.registerCrew();
    const receipt = await tx.wait();
    // crewId는 이벤트로 받거나, registerCrew()의 반환값으로 받음
    setCrewId(receipt.logs[0]?.args?.[0] || null); // 실제 ABI에 따라 수정 필요
    alert("크루 등록 완료!");
  };

  // 게임 등록
  const [gameName, setGameName] = useState("");
  const [gameURL, setGameURL] = useState("");
  const [gameId, setGameId] = useState<number | null>(null);
  const addGame = async () => {
    if (!gameRegistry) return;
    const tx = await gameRegistry.addGame(gameName, gameURL);
    const receipt = await tx.wait();
    setGameId(receipt.logs[0]?.args?.[0] || null);
    alert("게임 등록 완료!");
  };

  // 매치 등록
  const [matchGameName, setMatchGameName] = useState("");
  const [winners, setWinners] = useState<string>(""); // 콤마로 입력
  const [losers, setLosers] = useState<string>("");
  const [draws, setDraws] = useState<string>("");
  const [matchId, setMatchId] = useState<number | null>(null);

  const finalizeMatch = async () => {
    if (!matchManager) return;
    const winnerArr = winners.split(",").map(Number).filter(x => x);
    const loserArr = losers.split(",").map(Number).filter(x => x);
    const drawArr = draws.split(",").map(Number).filter(x => x);
    const tx = await matchManager.finalizeMatch(
      matchGameName,
      winnerArr,
      loserArr,
      drawArr
    );
    const receipt = await tx.wait();
    setMatchId(receipt.logs[0]?.args?.[0] || null);
    alert("매치 등록 완료!");
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>GoPirates DApp Demo</h1>
      <div>
        <b>내 지갑:</b> {account || "지갑 연결 필요"}
      </div>
      <hr />
      <h2>1. Crew 등록</h2>
      <button onClick={registerCrew}>크루 등록</button>
      {crewId && <div>내 크루 ID: {crewId}</div>}

      <hr />
      <h2>2. 게임 등록</h2>
      <input
        placeholder="게임 이름"
        value={gameName}
        onChange={e => setGameName(e.target.value)}
      />
      <input
        placeholder="게임 URL"
        value={gameURL}
        onChange={e => setGameURL(e.target.value)}
      />
      <button onClick={addGame}>게임 등록</button>
      {gameId && <div>등록된 게임 ID: {gameId}</div>}

      <hr />
      <h2>3. 매치 등록</h2>
      <input
        placeholder="게임 이름"
        value={matchGameName}
        onChange={e => setMatchGameName(e.target.value)}
      />
      <input
        placeholder="승리자 크루ID (예: 1,2)"
        value={winners}
        onChange={e => setWinners(e.target.value)}
      />
      <input
        placeholder="패자 크루ID (예: 3,4)"
        value={losers}
        onChange={e => setLosers(e.target.value)}
      />
      <input
        placeholder="무승부 크루ID (예: 5)"
        value={draws}
        onChange={e => setDraws(e.target.value)}
      />
      <button onClick={finalizeMatch}>매치 등록</button>
      {matchId && <div>등록된 매치 ID: {matchId}</div>}

      {/* 추가적으로 크루/게임/매치 정보 조회 기능도 hook을 활용해 쉽게 구현 가능 */}
    </div>
  );
}

export default App;
