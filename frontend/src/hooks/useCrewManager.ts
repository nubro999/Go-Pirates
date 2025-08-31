import { useMemo } from "react";
import { ethers } from "ethers";
import CrewManagerAbi from "../abi/CrewManager.json";
import { CREW_MANAGER_ADDRESS } from "../contracts";
import { useWeb3 } from "./useWeb3";

export function useCrewManager() {
  const { provider, signer } = useWeb3();

  const contract = useMemo(() => {
    if (provider && signer) {
      return new ethers.Contract(
        CREW_MANAGER_ADDRESS,
        CrewManagerAbi.abi,
        signer
      );
    }
    return null;
  }, [provider, signer]);

  return contract;
}
