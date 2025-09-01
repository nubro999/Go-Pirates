interface EthereumProvider {
  isMetaMask?: boolean;
  isConnected?: () => boolean;
  request: (request: { method: string; params?: any[] }) => Promise<any>;
  on: (eventName: string, handler: (...args: any[]) => void) => void;
  removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
  
  // 선택적 프로퍼티들
  selectedAddress?: string | null;
  networkVersion?: string;
  chainId?: string;
  
  // EIP-1193 Events
  on(event: 'connect', handler: (connectInfo: { chainId: string }) => void): void;
  on(event: 'disconnect', handler: (error: { code: number; message: string }) => void): void;
  on(event: 'accountsChanged', handler: (accounts: string[]) => void): void;
  on(event: 'chainChanged', handler: (chainId: string) => void): void;
  on(event: 'message', handler: (message: { type: string; data: any }) => void): void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
