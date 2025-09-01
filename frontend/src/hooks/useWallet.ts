import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CREW_MANAGER_ABI, CREW_MANAGER_ADDRESS } from '../abi/crewManagerAbi';
import { GAME_REGISTRY_ABI, GAME_REGISTRY_ADDRESS } from '../abi/gameRegistryAbi';
import { MATCH_MANAGER_ABI, MATCH_MANAGER_ADDRESS } from '../abi/matchManagerAbi';

export interface WalletState {
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  account: string;
  crewManager: ethers.Contract | null;
  gameRegistry: ethers.Contract | null;
  matchManager: ethers.Contract | null;
  error: string;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    provider: null,
    signer: null,
    account: '',
    crewManager: null,
    gameRegistry: null,
    matchManager: null,
    error: ''
  });

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask가 설치되어 있지 않습니다.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const crewContract = new ethers.Contract(
        CREW_MANAGER_ADDRESS,
        CREW_MANAGER_ABI,
        signer
      );
      const gameContract = new ethers.Contract(
        GAME_REGISTRY_ADDRESS,
        GAME_REGISTRY_ABI,
        signer
      );
      const matchContract = new ethers.Contract(
        MATCH_MANAGER_ADDRESS,
        MATCH_MANAGER_ABI,
        signer
      );

      setWalletState({
        provider,
        signer,
        account: address,
        crewManager: crewContract,
        gameRegistry: gameContract,
        matchManager: matchContract,
        error: ''
      });
    } catch (err: any) {
      setWalletState(prev => ({
        ...prev,
        error: err.message || '지갑 연결 실패'
      }));
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState({
            provider: null,
            signer: null,
            account: '',
            crewManager: null,
            gameRegistry: null,
            matchManager: null,
            error: ''
          });
        } else {
          connectWallet();
        }
      });
    }
  }, []);

  return { ...walletState, connectWallet };
};