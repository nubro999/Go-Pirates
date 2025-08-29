// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "./interfaces/IERC20.sol";

contract SponsorshipManager {
    enum DistributionPolicy { FIXED_TOP1, EQUAL_ALL }

    struct PrizePool {
        uint256 poolId;
        address token; // address(0)=ETH
        uint256 totalAmount;
        uint256 lockedAmount;
        DistributionPolicy policy;
        string eligibilityRulesURI;
        address manager;
        bool isActive;
        bool lockedForSeason;
        uint256[] eligibleCrews; // 단순
    }

    uint256 public nextPoolId = 1;
    mapping(uint256 => PrizePool) public pools;

    address public admin;

    event PoolCreated(uint256 indexed poolId);
    event FundsAdded(uint256 indexed poolId, uint256 amount);
    event PoolLocked(uint256 indexed poolId);
    event Distributed(uint256 indexed poolId);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyPoolManager(uint256 poolId) {
        require(pools[poolId].manager == msg.sender, "Not pool manager");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function createPool(
        address token,
        DistributionPolicy policy,
        string calldata eligibilityRulesURI,
        address manager,
        uint256[] calldata initialEligible
    ) external onlyAdmin returns (uint256) {
        uint256 id = nextPoolId++;
        PrizePool storage p = pools[id];
        p.poolId = id;
        p.token = token;
        p.policy = policy;
        p.eligibilityRulesURI = eligibilityRulesURI;
        p.manager = manager;
        p.isActive = true;
        for (uint i=0;i<initialEligible.length;i++){
            p.eligibleCrews.push(initialEligible[i]);
        }
        emit PoolCreated(id);
        return id;
    }

    function addFunds(uint256 poolId, uint256 amount) external payable {
        PrizePool storage p = pools[poolId];
        require(p.isActive, "Inactive pool");
        if (p.token == address(0)) {
            require(msg.value == amount, "ETH amount mismatch");
            p.totalAmount += amount;
        } else {
            require(msg.value == 0, "No ETH");
            IERC20(p.token).transferFrom(msg.sender, address(this), amount);
            p.totalAmount += amount;
        }
        emit FundsAdded(poolId, amount);
    }

    function lockForSeason(uint256 poolId) external onlyPoolManager(poolId) {
        PrizePool storage p = pools[poolId];
        require(!p.lockedForSeason, "Already locked");
        p.lockedAmount = p.totalAmount;
        p.lockedForSeason = true;
        emit PoolLocked(poolId);
    }

    function distribute(uint256 poolId) external onlyPoolManager(poolId) {
        PrizePool storage p = pools[poolId];
        require(p.lockedForSeason, "Not locked");
        require(p.lockedAmount > 0, "Nothing to distribute");
        require(p.eligibleCrews.length > 0, "No eligible crews");

        uint256 amount = p.lockedAmount;
        p.lockedAmount = 0;
        if (p.policy == DistributionPolicy.FIXED_TOP1) {
            _payout(p.token, p.eligibleCrews[0], amount);
        } else if (p.policy == DistributionPolicy.EQUAL_ALL) {
            uint256 share = amount / p.eligibleCrews.length;
            for (uint i=0;i<p.eligibleCrews.length;i++){
                _payout(p.token, p.eligibleCrews[i], share);
            }
        }
        emit Distributed(poolId);
    }

    function _payout(address token, uint256 /*crewId*/, uint256 amount) internal {
        if (token == address(0)) {
            (bool ok,) = payable(msg.sender).call{value: amount}("");
            require(ok, "ETH send fail");
        } else {
            IERC20(token).transfer(msg.sender, amount);
        }
    }
}
