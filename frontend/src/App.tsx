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
    <div className="gradient-background">
      {/* Navigation */}
      <nav className="modern-nav">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/Go-pirates.png" 
                alt="Go Pirates Logo" 
                className="w-8 h-8"
              />
              <span className="text-xl font-semibold text-gray-900">Go Pirates</span>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-gray-600">Gaming Platform</span>
              <WalletConnection account={account} onConnect={connectWallet} />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <div className="container mx-auto px-6 py-8">
            {/* Hero Section */}
            <div className="hero-section">
              <h1 className="hero-title">
                Welcome to Go Pirates
              </h1>
              <p className="hero-subtitle">
                Join crews, compete in games, and earn rewards in the ultimate blockchain gaming platform
              </p>
            </div>
            
            <ErrorMessage error={error} />

            {!account && (
              <div className="max-w-md mx-auto modern-card text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Get Started</h3>
                <p className="text-gray-600 mb-6">Connect your wallet to join the adventure</p>
              </div>
            )}

            {account && (
              <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <CrewManager crewManager={crewManager} />
                  <GameRegistry gameRegistry={gameRegistry} />
                </div>
                <div className="mb-8">
                  <MatchManager matchManager={matchManager} />
                </div>
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
    </div>
  );
}

export default App;