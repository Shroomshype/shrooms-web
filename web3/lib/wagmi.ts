import { http, createConfig } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID!;

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: "Shrooms" }),
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC),
  },
});

export const ADDRESSES: Record<number, {
  spore: `0x${string}`;
  farm: `0x${string}`;
  vault: `0x${string}`;
  lens: `0x${string}`;
}> = {
  [baseSepolia.id]: {
    spore: "0x0000000000000000000000000000000000000000",
    farm: "0x0000000000000000000000000000000000000000",
    vault: "0x0000000000000000000000000000000000000000",
    lens: "0x0000000000000000000000000000000000000000",
  },
};

/// Strain metadata lives off-chain — the contracts only know pids and weights.
export const STRAINS: Record<number, { name: string; tier: string; shape: string; symbol: string }> = {
  0: { name: "Amanita Prime", tier: "Legendary", shape: "dome", symbol: "SPORE" },
  1: { name: "Golden Cap", tier: "Legendary", shape: "dome", symbol: "SPORE-ETH" },
  2: { name: "Enoki Cluster", tier: "Epic", shape: "cluster", symbol: "UNI" },
  3: { name: "Blue Mycena", tier: "Epic", shape: "bell", symbol: "WETH" },
  4: { name: "Chanterelle Grove", tier: "Rare", shape: "wavy", symbol: "WBTC" },
  5: { name: "Morel Deep", tier: "Rare", shape: "morel", symbol: "LINK" },
  6: { name: "Inky Cap", tier: "Common", shape: "bell", symbol: "DAI" },
  7: { name: "Puffball Patch", tier: "Common", shape: "puff", symbol: "USDC" },
};
