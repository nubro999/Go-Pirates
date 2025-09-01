import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import { CREW_MANAGER_ABI, CREW_MANAGER_ADDRESS } from './abi/crewManagerAbi';
import { GAME_REGISTRY_ABI, GAME_REGISTRY_ADDRESS } from './abi/gameRegistryAbi';
import { MATCH_MANAGER_ABI, MATCH_MANAGER_ADDRESS } from './abi/matchManagerAbi';

// 타입 정의
interface CrewInfo {
  owner: string;
  wins: number;
  losses: number;
  draws: number;
}

interface GameInfo {
  gameId: string;
  name: string;
  gameURL: string;
}

interface MatchInfo {
  matchId: string;
  gameId: string;
  winners: string[];
  losers: string[];
  draws: string[];
  finalized: boolean;
}

function App() {
  // 지갑 연결 상태
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>('');

  // 컨트랙트 인스턴스
  const [crewManager, setCrewManager] = useState<ethers.Contract | null>(null);
  const [gameRegistry, setGameRegistry] = useState<ethers.Contract | null>(null);
  const [matchManager, setMatchManager] = useState<ethers.Contract | null>(null);

  // CrewManager 상태
  const [crewId, setCrewId] = useState<string>('');
  const [crewInfo, setCrewInfo] = useState<CrewInfo | null>(null);
  const [crewPoint, setCrewPoint] = useState<string>('');
  const [matchManagerAddr, setMatchManagerAddr] = useState<string>(MATCH_MANAGER_ADDRESS);

  // GameRegistry 상태
  const [gameName, setGameName] = useState<string>('');
  const [gameURL, setGameURL] = useState<string>('');
  const [gameId, setGameId] = useState<string>('');
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);

  // MatchManager 상태
  const [matchGameId, setMatchGameId] = useState<string>('');
  const [winners, setWinners] = useState<string>('');
  const [losers, setLosers] = useState<string>('');
  const [draws, setDraws] = useState<string>('');
  const [matchId, setMatchId] = useState<string>('');
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);

  // 에러 상태
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 지갑 연결
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask가 설치되어 있지 않습니다.');
      }

      // ethers v6: BrowserProvider 사용
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 계정 요청
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // 컨트랙트 인스턴스 생성
      const crewContract = new ethers.Contract(
        CREW_MANAGER_ADDRESS,
        CREW_MANAGER_ABI,
        signer
      );
      const gameContract = new ethers.Contract(
        GAME_REGISTRY_ADDRESS,
        GAME_REGISTRY_ABI,
        signer
      );
      const matchContract = new ethers.Contract(
        MATCH_MANAGER_ADDRESS,
        MATCH_MANAGER_ABI,
        signer
      );

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setCrewManager(crewContract);
      setGameRegistry(gameContract);
      setMatchManager(matchContract);
      setError('');
    } catch (err: any) {
      setError(err.message || '지갑 연결 실패');
    }
  };

  // 계정 변경 감지
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setAccount('');
          setSigner(null);
        } else {
          connectWallet();
        }
      });
    }
  }, []);

  // ===== CrewManager 함수들 =====
  const setMatchManagerAddress = async () => {
    if (!crewManager) return;
    setLoading(true);
    try {
      const tx = await crewManager.setMatchManager(matchManagerAddr);
      await tx.wait();
      alert('MatchManager 설정 완료!');
      setError('');
    } catch (err: any) {
      setError(err.message || 'MatchManager 설정 실패');
    }
    setLoading(false);
  };

  const registerCrew = async () => {
    if (!crewManager) return;
    setLoading(true);
    try {
      const tx = await crewManager.registerCrew();
      const receipt = await tx.wait();
      
      // 이벤트에서 crewId 추출
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = crewManager.interface.parseLog(log);
          return parsed?.name === 'CrewRegistered';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = crewManager.interface.parseLog(event);
        const newCrewId = parsed?.args.crewId.toString();
        alert(`크루 등록 완료! ID: ${newCrewId}`);
      }
      setError('');
    } catch (err: any) {
      setError(err.message || '크루 등록 실패');
    }
    setLoading(false);
  };

  const fetchCrewInfo = async () => {
    if (!crewManager || !crewId) return;
    setLoading(true);
    try {
      const info = await crewManager.getCrew(crewId);
      setCrewInfo({
        owner: info[0],
        wins: Number(info[1]),
        losses: Number(info[2]),
        draws: Number(info[3])
      });
      
      const point = await crewManager.getPoint(crewId);
      setCrewPoint(point.toString());
      setError('');
    } catch (err: any) {
      setError(err.message || '크루 정보 조회 실패');
    }
    setLoading(false);
  };

  // ===== GameRegistry 함수들 =====
  const addGame = async () => {
    if (!gameRegistry || !gameName || !gameURL) return;
    setLoading(true);
    try {
      const tx = await gameRegistry.addGame(gameName, gameURL);
      const receipt = await tx.wait();
      
      const newGameId = await gameRegistry.nextGameId() - 1;
      alert(`게임 등록 완료! ID: ${newGameId}`);
      setGameName('');
      setGameURL('');
      setError('');
    } catch (err: any) {
      setError(err.message || '게임 등록 실패');
    }
    setLoading(false);
  };

  const fetchGameInfo = async () => {
    if (!gameRegistry || !gameId) return;
    setLoading(true);
    try {
      const info = await gameRegistry.getGame(gameId);
      setGameInfo({
        gameId: info[0].toString(),
        name: info[1],
        gameURL: info[2]
      });
      setError('');
    } catch (err: any) {
      setError(err.message || '게임 정보 조회 실패');
    }
    setLoading(false);
  };

  // ===== MatchManager 함수들 =====
  const finalizeMatch = async () => {
    if (!matchManager || !matchGameId) return;
    setLoading(true);
    try {
      const winnersArray = winners ? winners.split(',').map(id => id.trim()) : [];
      const losersArray = losers ? losers.split(',').map(id => id.trim()) : [];
      const drawsArray = draws ? draws.split(',').map(id => id.trim()) : [];

      const tx = await matchManager.finalizeMatch(
        matchGameId,
        winnersArray,
        losersArray,
        drawsArray
      );
      const receipt = await tx.wait();
      
      // 이벤트에서 matchId 추출
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = matchManager.interface.parseLog(log);
          return parsed?.name === 'MatchFinalized';
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = matchManager.interface.parseLog(event);
        const newMatchId = parsed?.args.matchId.toString();
        alert(`매치 완료! ID: ${newMatchId}`);
      }
      setError('');
    } catch (err: any) {
      setError(err.message || '매치 완료 처리 실패');
    }
    setLoading(false);
  };

  const fetchMatchInfo = async () => {
    if (!matchManager || !matchId) return;
    setLoading(true);
    try {
      const info = await matchManager.getMatch(matchId);
      setMatchInfo({
        matchId: info[0].toString(),
        gameId: info[1].toString(),
        winners: info[2].map((id: any) => id.toString()),
        losers: info[3].map((id: any) => id.toString()),
        draws: info[4].map((id: any) => id.toString()),
        finalized: info[5]
      });
      setError('');
    } catch (err: any) {
      setError(err.message || '매치 정보 조회 실패');
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Crew Manager DApp</h1>
        
        {/* 지갑 연결 섹션 */}
        <div className="wallet-section">
          {!account ? (
            <button onClick={connectWallet}>MetaMask 연결</button>
          ) : (
            <p>연결된 계정: {account}</p>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && <div className="error">{error}</div>}
        
        {/* 로딩 표시 */}
        {loading && <div className="loading">처리 중...</div>}

        {account && (
          <>
            {/* CrewManager 섹션 */}
            <section className="contract-section">
              <h2>Crew Manager</h2>

              <div className="input-group">
                <h3>크루 등록</h3>
                <button onClick={registerCrew}>크루 등록하기</button>
              </div>

              <div className="input-group">
                <h3>크루 정보 조회</h3>
                <input
                  type="number"
                  value={crewId}
                  onChange={(e) => setCrewId(e.target.value)}
                  placeholder="크루 ID"
                />
                <button onClick={fetchCrewInfo}>조회</button>
                
                {crewInfo && (
                  <div className="info-display">
                    <p>소유자: {crewInfo.owner}</p>
                    <p>승: {crewInfo.wins} / 패: {crewInfo.losses} / 무: {crewInfo.draws}</p>
                    <p>포인트: {crewPoint}</p>
                  </div>
                )}
              </div>
            </section>

            {/* GameRegistry 섹션 */}
            <section className="contract-section">
              <h2>Game Registry</h2>
              
              <div className="input-group">
                <h3>게임 등록</h3>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="게임 이름"
                />
                <input
                  type="text"
                  value={gameURL}
                  onChange={(e) => setGameURL(e.target.value)}
                  placeholder="게임 URL"
                />
                <button onClick={addGame}>게임 등록</button>
              </div>

              <div className="input-group">
                <h3>게임 정보 조회</h3>
                <input
                  type="number"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  placeholder="게임 ID"
                />
                <button onClick={fetchGameInfo}>조회</button>
                
                {gameInfo && (
                  <div className="info-display">
                    <p>게임 ID: {gameInfo.gameId}</p>
                    <p>이름: {gameInfo.name}</p>
                    <p>URL: {gameInfo.gameURL}</p>
                  </div>
                )}
              </div>
            </section>

            {/* MatchManager 섹션 */}
            <section className="contract-section">
              <h2>Match Manager</h2>
              
              <div className="input-group">
                <h3>매치 결과 등록</h3>
                <input
                  type="number"
                  value={matchGameId}
                  onChange={(e) => setMatchGameId(e.target.value)}
                  placeholder="게임 ID"
                />
                <input
                  type="text"
                  value={winners}
                  onChange={(e) => setWinners(e.target.value)}
                  placeholder="승자 크루 ID (쉼표로 구분)"
                />
                <input
                  type="text"
                  value={losers}
                  onChange={(e) => setLosers(e.target.value)}
                  placeholder="패자 크루 ID (쉼표로 구분)"
                />
                <input
                  type="text"
                  value={draws}
                  onChange={(e) => setDraws(e.target.value)}
                  placeholder="무승부 크루 ID (쉼표로 구분)"
                />
                <button onClick={finalizeMatch}>매치 완료</button>
              </div>

              <div className="input-group">
                <h3>매치 정보 조회</h3>
                <input
                  type="number"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                  placeholder="매치 ID"
                />
                <button onClick={fetchMatchInfo}>조회</button>
                
                {matchInfo && (
                  <div className="info-display">
                    <p>매치 ID: {matchInfo.matchId}</p>
                    <p>게임 ID: {matchInfo.gameId}</p>
                    <p>승자: {matchInfo.winners.join(', ') || '없음'}</p>
                    <p>패자: {matchInfo.losers.join(', ') || '없음'}</p>
                    <p>무승부: {matchInfo.draws.join(', ') || '없음'}</p>
                    <p>완료 여부: {matchInfo.finalized ? '완료' : '진행중'}</p>
                  </div>
                )}
              </div>
            </section>

            {/* 컨트랙트 주소 정보 */}
            <section className="address-info">
              <h3>배포된 컨트랙트 주소</h3>
              <p>CrewManager: {CREW_MANAGER_ADDRESS}</p>
              <p>GameRegistry: {GAME_REGISTRY_ADDRESS}</p>
              <p>MatchManager: {MATCH_MANAGER_ADDRESS}</p>
            </section>
          </>
        )}
      </header>
    </div>
  );
}

export default App;