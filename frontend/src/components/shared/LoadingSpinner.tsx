import React from 'react';

interface LoadingSpinnerProps {
  loading: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ loading }) => {
  if (!loading) return null;
  
  return <div className="loading">처리 중...</div>;
};