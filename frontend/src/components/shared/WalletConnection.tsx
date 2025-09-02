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
    <>
      {!account ? (
        <button onClick={onConnect} className="modern-button-primary">
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center space-x-3 bg-green-50 px-4 py-2 rounded-xl">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-700">
            {formatAddress(account)}
          </span>
        </div>
      )}
    </>
  );
};