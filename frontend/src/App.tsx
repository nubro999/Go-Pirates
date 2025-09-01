import React from 'react';
import './App.css';
import { useWallet } from './hooks/useWallet';
import { WalletConnection } from './components/shared/WalletConnection';
import { ErrorMessage } from './components/shared/ErrorMessage';
import { CrewManager } from './components/CrewManager';
import { GameRegistry } from './components/GameRegistry';
import { MatchManager } from './components/MatchManager';
import { ContractAddresses } from './components/ContractAddresses';
import { StatePanel } from './components/StatePanel';

function App() {
  const { 
    account, 
    crewManager, 
    gameRegistry, 
    matchManager, 
    error, 
    connectWallet 
  } = useWallet();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Main Content */}
      <div className="flex-1 min-h-screen overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-center mb-8 text-blue-400">
            ⚡ Go-Pirates
          </h1>
          
          <WalletConnection account={account} onConnect={connectWallet} />
          <ErrorMessage error={error} />

          {account && (
            <div className="max-w-4xl mx-auto">
              <CrewManager crewManager={crewManager} />
              <GameRegistry gameRegistry={gameRegistry} />
              <MatchManager matchManager={matchManager} />
              <ContractAddresses />
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      {account && (
        <StatePanel 
          crewManager={crewManager}
          gameRegistry={gameRegistry}
          matchManager={matchManager}
        />
      )}
    </div>
  );
}

export default App;