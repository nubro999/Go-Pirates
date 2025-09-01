import React, { useState } from 'react';
import { ethers } from 'ethers';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface MatchInfo {
  matchId: string;
  gameId: string;
  winners: string[];
  losers: string[];
  draws: string[];
  finalized: boolean;
}

interface MatchManagerProps {
  matchManager: ethers.Contract | null;
}

export const MatchManager: React.FC<MatchManagerProps> = ({ matchManager }) => {
  const [matchGameId, setMatchGameId] = useState<string>('');
  const [winners, setWinners] = useState<string>('');
  const [losers, setLosers] = useState<string>('');
  const [draws, setDraws] = useState<string>('');
  const [matchId, setMatchId] = useState<string>('');
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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
    <section className="contract-section">
      <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        🏆 Match Manager
      </h2>
      
      {error && <div className="error">{error}</div>}
      <LoadingSpinner loading={loading} />
      
      <div className="input-group">
        <h3>⚙️ 매치 결과 등록</h3>
        <input
          type="number"
          value={matchGameId}
          onChange={(e) => setMatchGameId(e.target.value)}
          placeholder="게임 ID"
          disabled={loading}
        />
        <input
          type="text"
          value={winners}
          onChange={(e) => setWinners(e.target.value)}
          placeholder="승자 크루 ID (쉼표로 구분)"
          disabled={loading}
        />
        <input
          type="text"
          value={losers}
          onChange={(e) => setLosers(e.target.value)}
          placeholder="패자 크루 ID (쉼표로 구분)"
          disabled={loading}
        />
        <input
          type="text"
          value={draws}
          onChange={(e) => setDraws(e.target.value)}
          placeholder="무승부 크루 ID (쉼표로 구분)"
          disabled={loading}
        />
        <button 
          onClick={finalizeMatch}
          disabled={loading || !matchManager || !matchGameId}
        >
          ⚙️ 매치 완료
        </button>
      </div>

      <div className="input-group">
        <h3>🔍 매치 정보 조회</h3>
        <input
          type="number"
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          placeholder="매치 ID"
          disabled={loading}
        />
        <button 
          onClick={fetchMatchInfo}
          disabled={loading || !matchManager || !matchId}
        >
          🔍 조회
        </button>
        
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
  );
};