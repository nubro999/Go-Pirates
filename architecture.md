체인에 올라갈 정보

해적단
1. 단체이름
2. 설명
3. 점수
4. win - lose rate

게임
1. 날짜
2. 참여인원
3. 게임 정보 (주소, url, 이름)
4. 참여한 단체의 주소

대시보드
1. 순위
2. 로그인 기능
3. 개인정보
4. 상금 및 후원정보



--------------------------------
핵심 목표
--------------------------------
1. 여러 단체(Crew)가 온체인/오프체인/실제 오프라인 게임을 통해 대결.
2. 결과는 신뢰성 있게 온체인에 기록 → 점수/랭킹 산출.
3. 후원/상금 풀 관리 및 공정한 분배.
4. 위·변조 방지 + 분쟁 처리(Dispute Resolution).
5. UI 대시보드에서 직관적 랭킹/프로필/매치 이력/후원 현황 제공.

--------------------------------
이벤트 로그/오프체인(IPFS) 분리 전략
--------------------------------
가스 절감과 확장성을 위해:
- 온체인 상태(State): 최소 핵심 필드(식별자, 점수/레이팅, 스테이크, 매치 상태, 승인 여부)
- 이벤트(Event): 상세 설명/메타데이터(리치 텍스트, 확장 필드)
- Off-chain(IPFS/Arweave): 긴 설명(소개, 경기 리플레이 링크, 스크린샷, 증빙 자료)
  
예:
- Crew description 긴 내용 → IPFS hash (cid)
- Game rules 문서 → IPFS
- 물리 대결 증빙(사진 zip) → IPFS
- 온체인에는 contentURI(string)만 저장

--------------------------------
엔티티 & 필드
--------------------------------
1. Crew (PirateCrew)
   - crewId (uint256, auto increment)
   - name (string, 짧은 이름)
   - owner (address)
   - members (address[]) 또는 별도 Membership 관리 (역할: OWNER, ADMIN, PLAYER)
   - eloRating (int / uint)  (초기값 예: 1000)
   - wins (uint32)
   - losses (uint32)
   - draws (uint32)
   - score (uint64) → 누적 포인트 (엘로와 별개)
   - stake (uint256) → 분쟁 대비 담보 (optional)
   - contentURI (string) → IPFS (소개/로고)
   - createdAt (uint64)
   - active (bool)

2. GameRegistry (표준 게임 정의)
   - gameId (uint256)
   - name (string)
   - gameType (enum: ONCHAIN, WEB2_API, PHYSICAL. ELSE)
   - contractAddress (address) (온체인 게임이면)
   - externalURL (string) (web2 게임/플랫폼 URL)
   - rulesURI (string) (IPFS rules)
   - isActive (bool)

3. Match (대결)
   - matchId (uint256)
   - gameId (uint256)
   - participants (crewId[]) (2인 or 다대다)
   - proposedBy (crewId)
   - status (enum: PROPOSED, ACCEPTED, COMPLETED, DISPUTED, CANCELED)
   - scheduledAt (uint64) (대결 예정 시간)
   - startedAt (uint64)
   - completedAt (uint64)
   - participationProofURI (string) (물리/웹2 증빙)
   - resultHash (bytes32) (결과 요약 구조체 keccak256 hash)
   - scoreDeltaApplied (bool)
   - approvals (mapping(crewId => bool)) (결과 확인용)
   - oracleRequired (bool)
   - disputeDeadline (uint64)
   - stakeLocked (uint256) (총합)

4. Result 구조(오프체인 직렬화 후 hash)
   - winners (crewId[])
   - losers (crewId[])
   - rawScores (배열)
   - extraDataURI (IPFS, 상세 로그)
   - signature들 (참가 Crew 관리자 다중 서명)
   → 온체인에는 resultHash만 저장하고, 제출 시 hash 검증.

5. Sponsorship / PrizePool
   - poolId
   - token (address) (ERC20 혹은 address(0) = ETH)
   - totalAmount
   - lockedAmount
   - distributionPolicy (enum / bytes config) (예: TOP_N, PROPORTIONAL_ELO_GAIN, FIXED)
   - eligibilityRulesURI
   - manager (address)
   - isActive

--------------------------------
스마트 컨트랙트 모듈화
--------------------------------
1. CrewManager
   - registerCrew(name, contentURI)
   - updateContentURI(crewId, newURI)
   - addMember / removeMember / setRole
   - stakeDeposit / withdrawStake (분쟁 대비)
2. GameRegistry
   - addGame(name, type, addr/url, rulesURI)
   - toggleGame(gameId)
3. MatchManager
   - proposeMatch(gameId, participants[], scheduledAt, oracleRequired?)
   - acceptMatch(matchId) (참가자 전원이 Accept 후 ACCEPTED)
   - submitResult(matchId, resultStruct, signatures) → resultHash 저장
   - approveResult(matchId) (각 crew)
   - finalizeMatch(matchId) → 모두 승인 + 기간 경과 → 점수/ELO 반영
   - openDispute(matchId, reasonURI) (승인 전 or 기간 내)
   - resolveDispute(matchId, resolution, refereeSig) (DAO/Referee)
4. Scoring (라이브러리/별도)
   - applyElo(crewA, crewB, result)
   - applyScorePoints(...)
   - 포뮬러 (아래 ELO 참고)
5. SponsorshipManager
   - createPool(token, amount, policy, rulesURI)
   - addFunds(poolId, amount)
   - lockForSeason(poolId)
   - distribute(poolId) (정책에 따라 랭킹 참조)
6. Oracle / Bridge (옵션)
   - Off-chain 결과 검증 (Chainlink Functions / generic oracle callback)
   - fulfillMatchResult(matchId, dataHash)

--------------------------------
결과 제출 및 검증 플로우 (시나리오)
--------------------------------
1. Crew A, B가 Match 제안/수락.
2. 경기 진행 (온체인 게임이면 GameContract 기록, 웹2면 서버/API 로그, 물리면 증빙 촬영).
3. 결과 생성:
   - 결과 JSON 예:
     {
       matchId,
       winners:[A], losers:[B],
       rawScores:[10,7],
       extraDataURI:"ipfs://...",
       timestamp
     }
   - hash = keccak256(abi.encode(...간략 필드...))
   - 각 Crew 대표가 EIP-712 서명.
4. submitResult(matchId, winners, losers, rawScores, extraDataURI, signatures)
5. 각 Crew approveResult()
6. disputeDeadline까지 이의 없으면 finalizeMatch()
7. finalizeMatch에서:
   - ELO / score 업데이트
   - Sponsorship 보상 트리거(옵션)
   - 이벤트 방출 (MatchFinalized)

--------------------------------
분쟁(Dispute) 처리
--------------------------------
옵션:
A. 중앙 심판(Referee) 주소
B. 다중 심판 DAO (거버넌스 투표)
C. 스테이킹+슬래싱 메커니즘 (허위 제출자 벌금)

절차:
- openDispute(matchId, reasonURI)
- 양 당사자 증거 제출 (evidenceURI events)
- resolveDispute(matchId, resolutionType: REPLAY / FORCE_WIN / CANCEL / SPLIT)
- resolution 이벤트 → 필요 시 스테이크 이동/벌금.
--------------------------------
로그인 / 인증
--------------------------------
- 기본: Web3 지갑 (Metamask, WalletConnect, Kaikas 등).
- Account Abstraction (ERC-4337) 고려 → 소셜 로그인 + 가스 대납.
- 추가 개인정보(선택): Off-chain DB (Supabase, Firebase) + DID 조합 (ENS, Lens)
- 개인정보 필드:
  - nickname
  - avatarURI
  - socialLinks[]
  - crewId
  (온체인 필요 없으므로 off-chain)

--------------------------------
대시보드 기능 상세
--------------------------------
1. 랭킹
   - Top N Crew (ELO, 승률, 연승, 최근 활동)
   - 백엔드 인덱서(TheGraph/subgraph) → 빠른 쿼리
2. 로그인
   - 지갑 서명 → nonce 기반 세션
3. 개인정보
   - 오프체인 프로필 수정 → contentURI 업데이트 버튼
4. 상금 및 후원
   - Sponsorship Pool 리스트
   - Pool 세부: 남은 금액, 분배 정책, 이전 시즌 지급 로그
   - 후원하기 버튼 (ERC20 approve → deposit)
5. Match Center
   - 예정(PENDING), 진행중(ACTIVE), 결과대기, 분쟁중, 완료 탭
6. Match 상세
   - 참가 크루, 게임 정보, 증빙, 결과 hash, 승인 상태
   - Dispute 버튼 (조건부)
7. 크루 페이지
   - 소개, 멤버, 최근 10경기, 성적 그래프, Elo 변동 차트
8. Game Explorer
   - 게임 타입 필터 (온체인 vs Web2 vs Physical)
   - 룰 문서 보기

--------------------------------
프런트엔드/백엔드/인덱싱 스택 제안
--------------------------------
- Frontend: Next.js + TypeScript + wagmi + viem + Tailwind CSS
- Wallet: RainbowKit / Web3Modal
- State Management: Zustand / React Query
- Indexing: TheGraph (서브그래프) / 또는 자체 indexer(Express + Postgres)
- Off-chain Storage: IPFS (web3.storage / Pinata), 메타데이터 JSON Schema
- Backend(선택): Node.js Express for:
  - 파일 업로드 → IPFS pin
  - Off-chain profile DB
  - Oracle Worker (경기 API 폴링)
- Oracle: Chainlink Functions or custom signer set
--------------------------------

시즌(Season) 개념 (확장)
--------------------------------
- seasonId (uint)
- 시작/끝 블록 또는 타임스탬프
- 시즌 종료 → 랭킹 스냅샷 → SponsorshipPool 분배 → 새 시즌 초기화
- 시즌별 ELO 재조정 (예: (R - 1000)*0.5 + 1000)

--------------------------------
거버넌스 확장 (후속 단계)
--------------------------------
- Crew 대표들이 DAO 토큰(비양도 Soulbound) 획득 → 규칙 변경 투표
- Match 룰/분쟁 해석을 DAO가 집단 투표

--------------------------------
UX / UI 핵심 포인트
--------------------------------
- 결과 제출폼: 자동 hash 미리보기 & 서명 안내
- Dispute 창: 증빙 업로드 Drag & Drop, 타임라인(남은 시간 표시)
- Elo 차트: 날짜/경기별 변동 라인
- Crew 검색/필터: Elo 범위, 활동 빈도
- GameType 아이콘 (ONCHAIN, Web2, Physical)
--------------------------------
