"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { FarmRow, useStake } from "../hooks/useFarms";
import { formatApy } from "../lib/apy";

const TIER_COLOR: Record<string, string> = {
  Legendary: "var(--r-legendary)",
  Epic: "var(--r-epic)",
  Rare: "var(--r-rare)",
  Common: "var(--r-common)",
};

export function FarmCard({ farm, decimals = 18, onDone }: { farm: FarmRow; decimals?: number; onDone: () => void }) {
  const { isConnected } = useAccount();
  const { approve, deposit, withdraw, harvest, isPending, isConfirming } = useStake();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const needsApproval = farm.userAllowance === 0n;
  const busy = isPending || isConfirming;
  const staked = formatUnits(farm.userStaked, decimals);
  const pending = formatUnits(farm.userPending, 18);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      onDone();
    } catch (e: any) {
      // Say what happened. Never swallow a revert — people are moving money.
      setError(e?.shortMessage ?? e?.message ?? "Transaction failed");
    }
  }

  return (
    <article className="card" style={{ ["--tier" as any]: TIER_COLOR[farm.tier] }}>
      <span className="tier"><i />{farm.tier}</span>

      <h3 className="name">{farm.name}</h3>
      <p className="pair">Deposit {farm.symbol} · Earn SPORE</p>

      <div className="apy">
        <b>{formatApy(farm.apy)}</b>
        <span>APY, auto-compounded</span>
      </div>

      {farm.depositFeeBps > 0 && (
        <div className="meta">
          <span>Deposit fee</span>
          <b>{(farm.depositFeeBps / 100).toFixed(2)}%</b>
        </div>
      )}
      <div className="meta"><span>Your stake</span><b>{Number(staked).toLocaleString()} {farm.symbol}</b></div>
      <div className="meta"><span>Unharvested</span><b>{Number(pending).toFixed(4)} SPORE</b></div>

      {!isConnected ? (
        <button className="btn" disabled>Connect wallet to plant</button>
      ) : (
        <>
          <div className="input">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
            />
            <button
              type="button"
              onClick={() => setAmount(formatUnits(farm.userWalletBalance, decimals))}
            >
              Max
            </button>
          </div>

          {needsApproval ? (
            <button className="btn" disabled={busy} onClick={() => run(() => approve(farm.token))}>
              {busy ? "Approving…" : `Approve ${farm.symbol}`}
            </button>
          ) : (
            <button
              className="btn"
              disabled={busy || !amount}
              onClick={() => run(() => deposit(farm.pid, amount, decimals))}
            >
              {busy ? "Planting…" : "Plant"}
            </button>
          )}

          {farm.userStaked > 0n && (
            <div className="row">
              <button className="btn btn-ghost" disabled={busy} onClick={() => run(() => harvest(farm.pid))}>
                Harvest
              </button>
              <button
                className="btn btn-ghost"
                disabled={busy || !amount}
                onClick={() => run(() => withdraw(farm.pid, amount, decimals))}
              >
                Pull up
              </button>
            </div>
          )}
        </>
      )}

      {error && <p className="err">{error}</p>}
    </article>
  );
}
