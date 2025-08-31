import { useMemo } from "react";
import { ethers } from "ethers";
import MatchManagerAbi from "../abi/MatchManager.json";
import { MATCH_MANAGER_ADDRESS } from "../contracts";
import { useWeb3 } from "./useWeb3";

export function useMatchManager() {
  const { provider, signer } = useWeb3();

  const contract = useMemo(() => {
    if (provider && signer) {
      return new ethers.Contract(
        MATCH_MANAGER_ADDRESS,
        MatchManagerAbi.abi,
        signer
      );
    }
    return null;
  }, [provider, signer]);

  return contract;
}
