import React from 'react';

interface WalletConnectionProps {
  account: string;
  onConnect: () => void;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ account, onConnect }) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-section">
      {!account ? (
        <button onClick={onConnect}>🦊 MetaMask 연결</button>
      ) : (
        <div className="text-center">
          <p className="text-green-400 font-semibold">✅ 지갑 연결됨</p>
          <p className="font-mono text-sm text-gray-300 mt-1">
            {formatAddress(account)}
          </p>
        </div>
      )}
    </div>
  );
};