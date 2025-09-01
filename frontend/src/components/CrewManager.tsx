import React, { useState } from 'react';
import { ethers } from 'ethers';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface CrewInfo {
  owner: string;
  wins: number;
  losses: number;
  draws: number;
}

interface CrewManagerProps {
  crewManager: ethers.Contract | null;
}

export const CrewManager: React.FC<CrewManagerProps> = ({ crewManager }) => {
  const [crewId, setCrewId] = useState<string>('');
  const [crewInfo, setCrewInfo] = useState<CrewInfo | null>(null);
  const [crewPoint, setCrewPoint] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const registerCrew = async () => {
    if (!crewManager) return;
    setLoading(true);
    try {
      const tx = await crewManager.registerCrew();
      const receipt = await tx.wait();
      
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

  return (
    <section className="contract-section">
      <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        👥 Crew Manager
      </h2>

      {error && <div className="error">{error}</div>}
      <LoadingSpinner loading={loading} />

      <div className="input-group">
        <h3>⚔️ 크루 등록</h3>
        <button onClick={registerCrew} disabled={loading || !crewManager}>
          ⚔️ 크루 등록하기
        </button>
      </div>

      <div className="input-group">
        <h3>🔍 크루 정보 조회</h3>
        <input
          type="number"
          value={crewId}
          onChange={(e) => setCrewId(e.target.value)}
          placeholder="크루 ID"
          disabled={loading}
        />
        <button onClick={fetchCrewInfo} disabled={loading || !crewManager || !crewId}>
          🔍 조회
        </button>
        
        {crewInfo && (
          <div className="info-display">
            <p>소유자: {crewInfo.owner}</p>
            <p>승: {crewInfo.wins} / 패: {crewInfo.losses} / 무: {crewInfo.draws}</p>
            <p>포인트: {crewPoint}</p>
          </div>
        )}
      </div>
    </section>
  );
};