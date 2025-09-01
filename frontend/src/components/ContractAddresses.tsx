import React from 'react';
import { CREW_MANAGER_ADDRESS } from '../abi/crewManagerAbi';
import { GAME_REGISTRY_ADDRESS } from '../abi/gameRegistryAbi';
import { MATCH_MANAGER_ADDRESS } from '../abi/matchManagerAbi';

export const ContractAddresses: React.FC = () => {
  return (
    <section className="address-info">
      <h3 className="flex items-center gap-2">
        📄 배포된 컨트랙트 주소
      </h3>
      <p>CrewManager: {CREW_MANAGER_ADDRESS}</p>
      <p>GameRegistry: {GAME_REGISTRY_ADDRESS}</p>
      <p>MatchManager: {MATCH_MANAGER_ADDRESS}</p>
    </section>
  );
};