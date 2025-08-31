import { useMemo } from "react";
import { ethers } from "ethers";
import GameRegistryAbi from "../abi/GameRegistry.json";
import { GAME_REGISTRY_ADDRESS } from "../contracts";
import { useWeb3 } from "./useWeb3";

export function useGameRegistry() {
  const { provider, signer } = useWeb3();

  const contract = useMemo(() => {
    if (provider && signer) {
      return new ethers.Contract(
        GAME_REGISTRY_ADDRESS,
        GameRegistryAbi.abi,
        signer
      );
    }
    return null;
  }, [provider, signer]);

  return contract;
}
