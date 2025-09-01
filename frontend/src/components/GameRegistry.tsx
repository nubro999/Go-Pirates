import React, { useState } from 'react';
import { ethers } from 'ethers';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface GameInfo {
  gameId: string;
  name: string;
  gameURL: string;
}

interface GameRegistryProps {
  gameRegistry: ethers.Contract | null;
}

export const GameRegistry: React.FC<GameRegistryProps> = ({ gameRegistry }) => {
  const [gameName, setGameName] = useState<string>('');
  const [gameURL, setGameURL] = useState<string>('');
  const [gameId, setGameId] = useState<string>('');
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const addGame = async () => {
    if (!gameRegistry || !gameName || !gameURL) return;
    setLoading(true);
    try {
      const tx = await gameRegistry.addGame(gameName, gameURL);
      await tx.wait();
      
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

  return (
    <section className="contract-section">
      <h2 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
        🎮 Game Registry
      </h2>
      
      {error && <div className="error">{error}</div>}
      <LoadingSpinner loading={loading} />
      
      <div className="input-group">
        <h3>➕ 게임 등록</h3>
        <input
          type="text"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="게임 이름"
          disabled={loading}
        />
        <input
          type="text"
          value={gameURL}
          onChange={(e) => setGameURL(e.target.value)}
          placeholder="게임 URL"
          disabled={loading}
        />
        <button 
          onClick={addGame}
          disabled={loading || !gameRegistry || !gameName || !gameURL}
        >
          ➕ 게임 등록
        </button>
      </div>

      <div className="input-group">
        <h3>🔍 게임 정보 조회</h3>
        <input
          type="number"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="게임 ID"
          disabled={loading}
        />
        <button 
          onClick={fetchGameInfo}
          disabled={loading || !gameRegistry || !gameId}
        >
          🔍 조회
        </button>
        
        {gameInfo && (
          <div className="info-display">
            <p>게임 ID: {gameInfo.gameId}</p>
            <p>이름: {gameInfo.name}</p>
            <p>URL: {gameInfo.gameURL}</p>
          </div>
        )}
      </div>
    </section>
  );
};