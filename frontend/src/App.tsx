import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import { contracts } from './contracts';

// Extend Window interface for MetaMask
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Crew {
  id: string;
  owner: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
}

interface Game {
  id: string;
  name: string;
  gameURL: string;
}

interface Match {
  id: string;
  gameId: string;
  winners: string[];
  losers: string[];
  draws: string[];
  finalized: boolean;
}

function App() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const [crews, setCrews] = useState<Crew[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  
  const [newGameName, setNewGameName] = useState('');
  const [newGameURL, setNewGameURL] = useState('');
  const [selectedGameId, setSelectedGameId] = useState('');
  const [winners, setWinners] = useState('');
  const [losers, setLosers] = useState('');
  const [drawsInput, setDrawsInput] = useState('');
  
  const [contractsDeployed, setContractsDeployed] = useState<{
    crewManager: boolean;
    gameRegistry: boolean;
    matchManager: boolean;
  }>({ crewManager: false, gameRegistry: false, matchManager: false });

  // Test contract methods
  const testContractMethods = async () => {
    if (!provider) return;
    
    try {
      // Test with a simple call to check if the contract interface matches
      const crewManagerContract = new ethers.Contract(
        contracts.crewManager.address,
        contracts.crewManager.abi,
        provider
      );
      
      console.log('Testing contract methods...');
      
      // Try to call a simple view function
      try {
        const result = await provider.call({
          to: contracts.crewManager.address,
          data: "0x70a8c0e5" // nextCrewId() function selector
        });
        console.log('Raw nextCrewId call result:', result);
      } catch (error) {
        console.error('Raw call failed:', error);
      }
      
    } catch (error) {
      console.error('Error testing contract methods:', error);
    }
  };

  // Initialize ethers and connect wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        setIsConnected(true);
        
        console.log('Connected to wallet:', address);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Register a new crew
  const registerCrew = async () => {
    if (!signer) return;
    
    try {
      const crewManagerContract = new ethers.Contract(
        contracts.crewManager.address,
        contracts.crewManager.abi,
        signer
      );
      
      const tx = await crewManagerContract.registerCrew();
      await tx.wait();
      
      console.log('Crew registered successfully!');
      loadCrews();
    } catch (error) {
      console.error('Error registering crew:', error);
    }
  };

  // Add a new game
  const addGame = async () => {
    if (!signer || !newGameName || !newGameURL) return;
    
    try {
      const gameRegistryContract = new ethers.Contract(
        contracts.gameRegistry.address,
        contracts.gameRegistry.abi,
        signer
      );
      
      const tx = await gameRegistryContract.addGame(newGameName, newGameURL);
      await tx.wait();
      
      console.log('Game added successfully!');
      setNewGameName('');
      setNewGameURL('');
      loadGames();
    } catch (error) {
      console.error('Error adding game:', error);
    }
  };

  // Finalize a match
  const finalizeMatch = async () => {
    if (!signer || !selectedGameId) return;
    
    try {
      const matchManagerContract = new ethers.Contract(
        contracts.matchManager.address,
        contracts.matchManager.abi,
        signer
      );
      
      const winnersArray = winners.split(',').map(id => id.trim()).filter(id => id);
      const losersArray = losers.split(',').map(id => id.trim()).filter(id => id);
      const drawsArray = drawsInput.split(',').map(id => id.trim()).filter(id => id);
      
      const tx = await matchManagerContract.finalizeMatch(
        selectedGameId,
        winnersArray,
        losersArray,
        drawsArray
      );
      await tx.wait();
      
      console.log('Match finalized successfully!');
      setSelectedGameId('');
      setWinners('');
      setLosers('');
      setDrawsInput('');
      loadCrews();
      loadMatches();
    } catch (error) {
      console.error('Error finalizing match:', error);
    }
  };

  // Load crews from contract
  const loadCrews = async () => {
    if (!provider) return;
    
    try {
      const crewManagerContract = new ethers.Contract(
        contracts.crewManager.address,
        contracts.crewManager.abi,
        provider
      );
      
      // Check if contract exists by checking bytecode
      const code = await provider.getCode(contracts.crewManager.address);
      console.log('CrewManager contract code length:', code.length);
      if (code === '0x') {
        console.error('CrewManager contract not deployed at address:', contracts.crewManager.address);
        setContractsDeployed(prev => ({ ...prev, crewManager: false }));
        return;
      }
      setContractsDeployed(prev => ({ ...prev, crewManager: true }));
      
      console.log('Calling nextCrewId() on address:', contracts.crewManager.address);
      console.log('nextCrewId function not available, scanning for crews...');
      const crewsData: Crew[] = [];
      
      // Since nextCrewId doesn't work, try to fetch crews starting from ID 1
      for (let i = 1; i <= 100; i++) { // Reasonable upper limit
        try {
          const [owner, wins, losses, draws] = await crewManagerContract.getCrew(i);
          const points = await crewManagerContract.getPoint(i);
          
          crewsData.push({
            id: i.toString(),
            owner,
            wins: Number(wins),
            losses: Number(losses),
            draws: Number(draws),
            points: Number(points)
          });
        } catch (error) {
          console.log(`Crew ${i} not found, stopping scan`);
          break; // Stop when we hit the first non-existent crew
        }
      }
      
      setCrews(crewsData);
    } catch (error) {
      console.error('Error loading crews - contract may not be deployed:', error);
    }
  };

  // Load games from contract
  const loadGames = async () => {
    if (!provider) return;
    
    try {
      const gameRegistryContract = new ethers.Contract(
        contracts.gameRegistry.address,
        contracts.gameRegistry.abi,
        provider
      );
      
      // Check if contract exists
      const code = await provider.getCode(contracts.gameRegistry.address);
      if (code === '0x') {
        console.error('GameRegistry contract not deployed at address:', contracts.gameRegistry.address);
        setContractsDeployed(prev => ({ ...prev, gameRegistry: false }));
        return;
      }
      setContractsDeployed(prev => ({ ...prev, gameRegistry: true }));
      
      console.log('nextGameId function not available, scanning for games...');
      const gamesData: Game[] = [];
      
      // Since nextGameId doesn't work, try to fetch games starting from ID 1
      for (let i = 1; i <= 100; i++) { // Reasonable upper limit
          try {
            console.log(`Loading game ${i}`);
            const [gameId, name, gameURL] = await gameRegistryContract.getGame(i);
            
            gamesData.push({
              id: gameId.toString(),
              name,
              gameURL
            });
        } catch (error) {
          console.log(`Game ${i} not found, stopping scan`);
          break; // Stop when we hit the first non-existent game
        }
      }
      
      setGames(gamesData);
    } catch (error) {
      console.error('Error loading games - contract may not be deployed:', error);
    }
  };

  // Load matches from contract
  const loadMatches = async () => {
    if (!provider) return;
    
    try {
      const matchManagerContract = new ethers.Contract(
        contracts.matchManager.address,
        contracts.matchManager.abi,
        provider
      );
      
      // Check if contract exists
      const code = await provider.getCode(contracts.matchManager.address);
      if (code === '0x') {
        console.error('MatchManager contract not deployed at address:', contracts.matchManager.address);
        setContractsDeployed(prev => ({ ...prev, matchManager: false }));
        return;
      }
      setContractsDeployed(prev => ({ ...prev, matchManager: true }));
      
      console.log('nextMatchId function not available, scanning for matches...');
      const matchesData: Match[] = [];
      
      // Since nextMatchId doesn't work, try to fetch matches starting from ID 1
      for (let i = 1; i <= 100; i++) { // Reasonable upper limit
        try {
          const [id, gameId, winners, losers, draws, finalized] = await matchManagerContract.getMatch(i);
          
          matchesData.push({
            id: id.toString(),
            gameId: gameId.toString(),
            winners: winners.map((w: any) => w.toString()),
            losers: losers.map((l: any) => l.toString()),
            draws: draws.map((d: any) => d.toString()),
            finalized
          });
        } catch (error) {
          console.log(`Match ${i} not found, stopping scan`);
          break; // Stop when we hit the first non-existent match
        }
      }
      
      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches - contract may not be deployed:', error);
    }
  };

  // Load data on connection
  useEffect(() => {
    if (isConnected && provider) {
      loadCrews();
      loadGames();
      loadMatches();
    }
  }, [isConnected, provider]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>GoPirates - Crew Management System</h1>
        
        {!isConnected ? (
          <button onClick={connectWallet} className="connect-btn">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account.substring(0, 6)}...{account.substring(38)}</p>
          </div>
        )}
      </header>

      {isConnected && (
        <main className="main-content">
          {/* Contract Status Section */}
          <section className="section">
            <h2>Contract Status</h2>
            <div className="contract-status">
              <div className={`status-item ${contractsDeployed.crewManager ? 'deployed' : 'not-deployed'}`}>
                CrewManager: {contractsDeployed.crewManager ? '✅ Deployed' : '❌ Not Deployed'}
              </div>
              <div className={`status-item ${contractsDeployed.gameRegistry ? 'deployed' : 'not-deployed'}`}>
                GameRegistry: {contractsDeployed.gameRegistry ? '✅ Deployed' : '❌ Not Deployed'}
              </div>
              <div className={`status-item ${contractsDeployed.matchManager ? 'deployed' : 'not-deployed'}`}>
                MatchManager: {contractsDeployed.matchManager ? '✅ Deployed' : '❌ Not Deployed'}
              </div>
            </div>
            {!contractsDeployed.crewManager && (
              <p className="warning">
                ⚠️ Contracts are not deployed to the current network. Please deploy the contracts first or check the network.
              </p>
            )}
            <button onClick={testContractMethods} className="action-btn">
              Test Contract Methods (Check Console)
            </button>
          </section>

          {/* Crew Management Section */}
          <section className="section">
            <h2>Crew Management</h2>
            <button onClick={registerCrew} className="action-btn">
              Register New Crew
            </button>
            
            <div className="crews-grid">
              {crews.map(crew => (
                <div key={crew.id} className="crew-card">
                  <h3>Crew #{crew.id}</h3>
                  <p>Owner: {crew.owner.substring(0, 6)}...{crew.owner.substring(38)}</p>
                  <div className="stats">
                    <span>Wins: {crew.wins}</span>
                    <span>Losses: {crew.losses}</span>
                    <span>Draws: {crew.draws}</span>
                    <span className="points">Points: {crew.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Game Registry Section */}
          <section className="section">
            <h2>Game Registry</h2>
            <div className="add-game-form">
              <input
                type="text"
                placeholder="Game Name"
                value={newGameName}
                onChange={(e) => setNewGameName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Game URL"
                value={newGameURL}
                onChange={(e) => setNewGameURL(e.target.value)}
              />
              <button onClick={addGame} className="action-btn">
                Add Game
              </button>
            </div>
            
            <div className="games-list">
              {games.map(game => (
                <div key={game.id} className="game-card">
                  <h4>{game.name}</h4>
                  <p>ID: {game.id}</p>
                  <a href={game.gameURL} target="_blank" rel="noopener noreferrer">
                    Play Game
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Match Management Section */}
          <section className="section">
            <h2>Match Management</h2>
            <div className="match-form">
              <select
                value={selectedGameId}
                onChange={(e) => setSelectedGameId(e.target.value)}
              >
                <option value="">Select Game</option>
                {games.map(game => (
                  <option key={game.id} value={game.id}>
                    {game.name} (ID: {game.id})
                  </option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="Winner Crew IDs (comma separated)"
                value={winners}
                onChange={(e) => setWinners(e.target.value)}
              />
              
              <input
                type="text"
                placeholder="Loser Crew IDs (comma separated)"
                value={losers}
                onChange={(e) => setLosers(e.target.value)}
              />
              
              <input
                type="text"
                placeholder="Draw Crew IDs (comma separated)"
                value={drawsInput}
                onChange={(e) => setDrawsInput(e.target.value)}
              />
              
              <button onClick={finalizeMatch} className="action-btn">
                Finalize Match
              </button>
            </div>
            
            <div className="matches-list">
              <h3>Recent Matches</h3>
              {matches.map(match => (
                <div key={match.id} className="match-card">
                  <h4>Match #{match.id}</h4>
                  <p>Game ID: {match.gameId}</p>
                  <p>Winners: {match.winners.join(', ') || 'None'}</p>
                  <p>Losers: {match.losers.join(', ') || 'None'}</p>
                  <p>Draws: {match.draws.join(', ') || 'None'}</p>
                  <p>Status: {match.finalized ? 'Finalized' : 'Pending'}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;