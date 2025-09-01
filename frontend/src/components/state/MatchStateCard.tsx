import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface MatchInfo {
  id: string;
  gameId: string;
  winners: string[];
  losers: string[];
  draws: string[];
  finalized: boolean;
}

interface MatchStateCardProps {
  matchManager: ethers.Contract | null;
}

export const MatchStateCard: React.FC<MatchStateCardProps> = ({ matchManager }) => {
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);

  const fetchMatches = async () => {
    if (!matchManager) return;
    
    setLoading(true);
    try {
      const nextId = await matchManager.nextMatchId();
      const matchCount = Number(nextId);
      setTotalMatches(matchCount);
      
      const matchPromises = [];
      for (let i = 1; i < Math.min(matchCount, 6); i++) {
        matchPromises.push(fetchMatchInfo(i));
      }
      
      const matchInfos = await Promise.all(matchPromises);
      setMatches(matchInfos.filter((match): match is MatchInfo => match !== null));
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
    setLoading(false);
  };

  const fetchMatchInfo = async (matchId: number): Promise<MatchInfo | null> => {
    try {
      const info = await matchManager!.getMatch(matchId);
      return {
        id: matchId.toString(),
        gameId: info[1].toString(),
        winners: info[2].map((id: any) => id.toString()),
        losers: info[3].map((id: any) => id.toString()),
        draws: info[4].map((id: any) => id.toString()),
        finalized: info[5]
      };
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 10000);
    return () => clearInterval(interval);
  }, [matchManager]);

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
          🏆 Matches ({totalMatches})
        </h3>
        <button 
          onClick={fetchMatches}
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
          {matches.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-4">
              No matches found
            </div>
          ) : (
            matches.map((match) => (
              <div key={match.id} className="bg-gray-700 rounded p-2 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-blue-300">#{match.id}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    match.finalized ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'
                  }`}>
                    {match.finalized ? '✅ Done' : '⏳ Pending'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1">
                  Game #{match.gameId}
                </div>
                {match.winners.length > 0 && (
                  <div className="text-xs text-green-400">
                    🏆 Winners: {match.winners.join(', ')}
                  </div>
                )}
                {match.losers.length > 0 && (
                  <div className="text-xs text-red-400">
                    💀 Losers: {match.losers.join(', ')}
                  </div>
                )}
                {match.draws.length > 0 && (
                  <div className="text-xs text-yellow-400">
                    🤝 Draws: {match.draws.join(', ')}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};