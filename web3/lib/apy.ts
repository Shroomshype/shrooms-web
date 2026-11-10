/**
 * Turning on-chain emissions into the number on the card.
 *
 * The lens gives you `rewardPerTokenPerYear`: SPORE emitted per year, per 1e18 of staked token,
 * scaled by 1e18. That is a token ratio. To get a percentage you need two prices, and those come
 * from off-chain — which is exactly why the contract does not pretend to know the APY.
 *
 *   APR = rewardPerTokenPerYear × sporePrice ÷ stakedTokenPrice
 *   APY = (1 + APR/n)^n − 1        where n = compounds per year
 *
 * The vault compounds whenever someone calls harvest(). At a 4-hour cadence n = 2190.
 * If nobody calls harvest, n is lower and the real APY is lower — so read `lastHarvestedAt`
 * from the vault and show the *observed* cadence, not the intended one. A UI that assumes the
 * keeper is running is a UI that overstates its own yield.
 */

const SCALE = 10n ** 18n;

export function toApr(
  rewardPerTokenPerYear: bigint,
  sporePriceUsd: number,
  stakedTokenPriceUsd: number
): number {
  if (stakedTokenPriceUsd <= 0) return 0;
  const ratio = Number(rewardPerTokenPerYear) / Number(SCALE);
  return (ratio * sporePriceUsd) / stakedTokenPriceUsd;
}

export function aprToApy(apr: number, compoundsPerYear = 2190): number {
  if (apr <= 0) return 0;
  return Math.pow(1 + apr / compoundsPerYear, compoundsPerYear) - 1;
}

/** Compounds per year implied by how often harvest() has actually been called. */
export function observedCompoundsPerYear(lastHarvestedAt: bigint, deployedAt: bigint, harvestCount: number): number {
  const elapsed = Number(lastHarvestedAt - deployedAt);
  if (elapsed <= 0 || harvestCount === 0) return 1;
  const avgInterval = elapsed / harvestCount;
  return (365 * 24 * 3600) / avgInterval;
}

export function formatApy(apy: number): string {
  const pct = apy * 100;
  if (!isFinite(pct) || pct <= 0) return "—";
  if (pct >= 10000) return `${Math.round(pct / 1000)}k%`;
  if (pct >= 100) return `${Math.round(pct).toLocaleString()}%`;
  return `${pct.toFixed(2)}%`;
}

/** TVL of one pool in USD, for the substrate line on the card. */
export function poolTvlUsd(totalStaked: bigint, decimals: number, priceUsd: number): number {
  return (Number(totalStaked) / 10 ** decimals) * priceUsd;
}
