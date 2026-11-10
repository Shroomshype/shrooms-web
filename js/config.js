/* Deployed addresses. Filled in after scripts/deploy-v2.js runs — copy them out
   of deployments/<network>.v2.json. The site reads from here so you never have
   to edit markup to point at a new deployment. */

window.SHROOMS_CONFIG = {
  chainId: 99801,
  chainName: 'Elysium Testnet',
  rpcUrl: 'https://testnet-rpc.elysium.kinetiq.xyz',
  explorer: 'https://elysium.kinetiq.xyz/testnet-explorer',
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },

  contracts: {
    LiquiditySpores: '0x0000000000000000000000000000000000000000',
    SporesToken:     '0x0000000000000000000000000000000000000000',
    ShroomsFarm:     '0x0000000000000000000000000000000000000000',
    ShroomsTimelock: '0x0000000000000000000000000000000000000000',
    Faucet:          '0x0000000000000000000000000000000000000000',
  },

  // The two staking assets. On mainnet both come from Montra.
  tokens: {
    SHROOMS:    '0x0000000000000000000000000000000000000000',
    SHROOMS_LP: '0x0000000000000000000000000000000000000000',
  },

  // Montra's trade fee, as a decimal. Confirmed at 1%: every 100 HYPE of
  // SHROOMS volume puts 1 HYPE into the treasury. This sets the reward budget.
  tradeFeeRate: 0.01,

  // true once scripts/timelock-accept.js reports the handover complete.
  ownerIsTimelock: false,
};
