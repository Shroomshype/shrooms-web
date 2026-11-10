"use client";

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi, maxUint256, parseUnits, zeroAddress } from "viem";
import { ADDRESSES, STRAINS } from "../lib/wagmi";
import { toApr, aprToApy } from "../lib/apy";
import lensAbi from "../abis/ShroomLens.json";
import farmAbi from "../abis/SporeFarm.json";
import vaultAbi from "../abis/SporeVault.json";

export type FarmRow = {
  pid: number;
  token: `0x${string}`;
  name: string;
  tier: string;
  shape: string;
  symbol: string;
  totalStaked: bigint;
  depositFeeBps: number;
  userStaked: bigint;
  userPending: bigint;
  userWalletBalance: bigint;
  userAllowance: bigint;
  apy: number;
};

/** One RPC call for every card on the page, via ShroomLens. */
export function useFarms(prices: Record<string, number>) {
  const { address } = useAccount();
  const chainId = useChainId();
  const a = ADDRESSES[chainId];

  const { data, isLoading, refetch } = useReadContract({
    address: a?.lens,
    abi: lensAbi,
    functionName: "farms",
    args: [address ?? zeroAddress],
    query: { enabled: Boolean(a?.lens), refetchInterval: 15_000 },
  });

  const rows: FarmRow[] = ((data as any[]) ?? []).map((f) => {
    const pid = Number(f.pid);
    const meta = STRAINS[pid] ?? { name: `Pool ${pid}`, tier: "Common", shape: "dome", symbol: "?" };
    const apr = toApr(f.rewardPerTokenPerYear, prices.SPORE ?? 0, prices[meta.symbol] ?? 0);

    return {
      pid,
      token: f.token,
      ...meta,
      totalStaked: f.totalStaked,
      depositFeeBps: Number(f.depositFeeBps),
      userStaked: f.userStaked,
      userPending: f.userPending,
      userWalletBalance: f.userWalletBalance,
      userAllowance: f.userAllowance,
      apy: aprToApy(apr),
    };
  });

  return { rows, isLoading, refetch };
}

/** approve → deposit. Returns the two steps separately so the UI can show which one is pending. */
export function useStake() {
  const chainId = useChainId();
  const a = ADDRESSES[chainId];
  const { writeContractAsync, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  async function approve(token: `0x${string}`) {
    return writeContractAsync({
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      // Infinite approval is one transaction instead of two forever, but it means the farm can
      // move this token any time. Offer the exact-amount version too and let people choose.
      args: [a.farm, maxUint256],
    });
  }

  async function approveExact(token: `0x${string}`, amount: string, decimals: number) {
    return writeContractAsync({
      address: token,
      abi: erc20Abi,
      functionName: "approve",
      args: [a.farm, parseUnits(amount, decimals)],
    });
  }

  async function deposit(pid: number, amount: string, decimals: number) {
    return writeContractAsync({
      address: a.farm,
      abi: farmAbi,
      functionName: "deposit",
      args: [BigInt(pid), parseUnits(amount, decimals)],
    });
  }

  async function withdraw(pid: number, amount: string, decimals: number) {
    return writeContractAsync({
      address: a.farm,
      abi: farmAbi,
      functionName: "withdraw",
      args: [BigInt(pid), parseUnits(amount, decimals)],
    });
  }

  /** Harvest only: withdraw zero, which pays out pending rewards. */
  async function harvest(pid: number) {
    return writeContractAsync({
      address: a.farm,
      abi: farmAbi,
      functionName: "withdraw",
      args: [BigInt(pid), 0n],
    });
  }

  async function emergencyWithdraw(pid: number) {
    return writeContractAsync({
      address: a.farm,
      abi: farmAbi,
      functionName: "emergencyWithdraw",
      args: [BigInt(pid)],
    });
  }

  return { approve, approveExact, deposit, withdraw, harvest, emergencyWithdraw, hash, isPending, isConfirming, isSuccess };
}

/** The auto-compounding vault over pool 0. */
export function useVault() {
  const { address } = useAccount();
  const chainId = useChainId();
  const a = ADDRESSES[chainId];
  const { writeContractAsync } = useWriteContract();

  const { data: balance } = useReadContract({
    address: a?.vault,
    abi: vaultAbi,
    functionName: "balanceOf",
    args: [address ?? zeroAddress],
    query: { enabled: Boolean(a?.vault && address), refetchInterval: 15_000 },
  });

  const { data: lastHarvestedAt } = useReadContract({
    address: a?.vault,
    abi: vaultAbi,
    functionName: "lastHarvestedAt",
    query: { enabled: Boolean(a?.vault), refetchInterval: 30_000 },
  });

  const { data: bounty } = useReadContract({
    address: a?.vault,
    abi: vaultAbi,
    functionName: "callBounty",
    query: { enabled: Boolean(a?.vault), refetchInterval: 30_000 },
  });

  return {
    balance: (balance as bigint) ?? 0n,
    lastHarvestedAt: (lastHarvestedAt as bigint) ?? 0n,
    callBounty: (bounty as bigint) ?? 0n,
    deposit: (amount: bigint) =>
      writeContractAsync({ address: a.vault, abi: vaultAbi, functionName: "deposit", args: [amount] }),
    withdrawAll: () =>
      writeContractAsync({ address: a.vault, abi: vaultAbi, functionName: "withdrawAll", args: [] }),
    // Anyone can call this and collect callBounty. Wire it to a visible button — it turns
    // "trust our keeper" into "here is money, please compound the vault".
    harvest: () =>
      writeContractAsync({ address: a.vault, abi: vaultAbi, functionName: "harvest", args: [] }),
  };
}
