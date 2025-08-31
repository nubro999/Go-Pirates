import { crewManagerAbi } from './abi/crewManagerAbi';
import { gameRegistryAbi } from './abi/gameRegistryAbi';
import { matchManagerAbi } from './abi/matchManagerAbi';

// Contract addresses (Sepolia deployment)
export const CREW_MANAGER_ADDRESS = "0xe2899bddFD890e320e643044c6b95B9B0b84157A";
export const GAME_REGISTRY_ADDRESS = "0x1c91347f2A44538ce62453BEBd9Aa907C662b4bD";
export const MATCH_MANAGER_ADDRESS = "0x93f8dddd876c7dBE3323723500e83E202A7C96CC";

// Contract ABIs
export const CREW_MANAGER_ABI = crewManagerAbi;
export const GAME_REGISTRY_ABI = gameRegistryAbi;
export const MATCH_MANAGER_ABI = matchManagerAbi;

// Contract configurations for React hooks
export const contracts = {
  crewManager: {
    address: CREW_MANAGER_ADDRESS,
    abi: CREW_MANAGER_ABI,
  },
  gameRegistry: {
    address: GAME_REGISTRY_ADDRESS,
    abi: GAME_REGISTRY_ABI,
  },
  matchManager: {
    address: MATCH_MANAGER_ADDRESS,
    abi: MATCH_MANAGER_ABI,
  },
} as const;
