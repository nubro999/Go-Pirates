import { useEffect, useState } from "react";
import { ethers } from "ethers";

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>("");

  useEffect(() => {
    async function init() {
      if ((window as any).ethereum) {
        const _provider = new ethers.BrowserProvider((window as any).ethereum);
        setProvider(_provider);
        const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        setAccount(accounts[0]);
        setSigner(await _provider.getSigner());
      }
    }
    init();
  }, []);

  return { provider, signer, account };
}
