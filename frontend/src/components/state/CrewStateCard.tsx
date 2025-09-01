import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface CrewInfo {
  id: string;
  owner: string;
  wins: number;
  losses: number;
  draws: number;
  points: string;
}

interface CrewStateCardProps {
  crewManager: ethers.Contract | null;
}

export const CrewStateCard: React.FC<CrewStateCardProps> = ({ crewManager }) => {
  const [crews, setCrews] = useState<CrewInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCrews, setTotalCrews] = useState(0);

  const fetchCrews = async () => {
    if (!crewManager) return;
    
    setLoading(true);
    try {
      const nextId = await crewManager.nextCrewId();
      const crewCount = Number(nextId);
      setTotalCrews(crewCount);
      
      const crewPromises = [];
      for (let i = 1; i < Math.min(crewCount, 6); i++) {
        crewPromises.push(fetchCrewInfo(i));
      }
      
      const crewInfos = await Promise.all(crewPromises);
      setCrews(crewInfos.filter((crew): crew is CrewInfo => crew !== null));
    } catch (error) {
      console.error('Error fetching crews:', error);
    }
    setLoading(false);
  };

  const fetchCrewInfo = async (crewId: number): Promise<CrewInfo | null> => {
    try {
      const info = await crewManager!.getCrew(crewId);
      const points = await crewManager!.getPoint(crewId);
      
      return {
        id: crewId.toString(),
        owner: info[0],
        wins: Number(info[1]),
        losses: Number(info[2]),
        draws: Number(info[3]),
        points: points.toString()
      };
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    fetchCrews();
    const interval = setInterval(fetchCrews, 10000);
    return () => clearInterval(interval);
  }, [crewManager]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
          👥 Crews ({totalCrews})
        </h3>
        <button 
          onClick={fetchCrews}
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
          {crews.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-4">
              No crews found
            </div>
          ) : (
            crews.map((crew) => (
              <div key={crew.id} className="bg-gray-700 rounded p-2 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-blue-300">#{crew.id}</span>
                  <span className="text-yellow-400">{crew.points}pts</span>
                </div>
                <div className="text-xs text-gray-300 mb-1">
                  {formatAddress(crew.owner)}
                </div>
                <div className="text-xs text-gray-400">
                  W:{crew.wins} L:{crew.losses} D:{crew.draws}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};