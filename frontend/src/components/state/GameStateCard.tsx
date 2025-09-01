import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface GameInfo {
  id: string;
  name: string;
  gameURL: string;
}

interface GameStateCardProps {
  gameRegistry: ethers.Contract | null;
}

export const GameStateCard: React.FC<GameStateCardProps> = ({ gameRegistry }) => {
  const [games, setGames] = useState<GameInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalGames, setTotalGames] = useState(0);

  const fetchGames = async () => {
    if (!gameRegistry) return;
    
    setLoading(true);
    try {
      const nextId = await gameRegistry.nextGameId();
      const gameCount = Number(nextId);
      setTotalGames(gameCount);
      
      const gamePromises = [];
      for (let i = 1; i < Math.min(gameCount, 6); i++) {
        gamePromises.push(fetchGameInfo(i));
      }
      
      const gameInfos = await Promise.all(gamePromises);
      setGames(gameInfos.filter((game): game is GameInfo => game !== null));
    } catch (error) {
      console.error('Error fetching games:', error);
    }
    setLoading(false);
  };

  const fetchGameInfo = async (gameId: number): Promise<GameInfo | null> => {
    try {
      const info = await gameRegistry!.getGame(gameId);
      return {
        id: gameId.toString(),
        name: info[1],
        gameURL: info[2]
      };
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 10000);
    return () => clearInterval(interval);
  }, [gameRegistry]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
          🎮 Games ({totalGames})
        </h3>
        <button 
          onClick={fetchGames}
          disabled={loading}
          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-2 py-1 rounded"
        >
          🔄
        </button>
      </div>
      
      {loading ? (
        <div className="text-center text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {games.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-4">
              No games found
            </div>
          ) : (
            games.map((game) => (
              <div key={game.id} className="bg-gray-700 rounded p-2 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-blue-300">#{game.id}</span>
                </div>
                <div className="text-white font-medium mb-1 truncate">
                  {game.name}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {game.gameURL}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};