import React from 'react';
import { ethers } from 'ethers';
import { CrewStateCard } from './state/CrewStateCard';
import { GameStateCard } from './state/GameStateCard';
import { MatchStateCard } from './state/MatchStateCard';

interface StatePanelProps {
  crewManager: ethers.Contract | null;
  gameRegistry: ethers.Contract | null;
  matchManager: ethers.Contract | null;
}

export const StatePanel: React.FC<StatePanelProps> = ({ 
  crewManager, 
  gameRegistry, 
  matchManager 
}) => {
  return (
    <div className="w-80 min-h-screen bg-gray-900 p-4 overflow-y-auto state-panel">
      <div className="sticky top-0 bg-gray-900 pb-4 mb-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-center text-blue-400 flex items-center justify-center gap-2">
          📊 Live State
        </h2>
      </div>
      
      <div className="space-y-4">
        <CrewStateCard crewManager={crewManager} />
        <GameStateCard gameRegistry={gameRegistry} />
        <MatchStateCard matchManager={matchManager} />
      </div>
    </div>
  );
};