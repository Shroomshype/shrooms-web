# Shrooms — web

The front end for [Shrooms](https://github.com/Shroomshype/shrooms-contracts):
five pages, no build step, no framework. Open `index.html` and it runs.

| | |
|---|---|
| Stack | plain HTML, CSS and JS — deliberately |
| Build | none |
| Deploy | any static host: GitHub Pages, Vercel, Netlify, S3 |
| Chain | Elysium testnet (`99801`), gas in HYPE |

Related: [shrooms-contracts](https://github.com/Shroomshype/shrooms-contracts) ·
[X](https://x.com/Shroomshype) · [Telegram](https://t.me/shroomshype)

---

## Pages

| Page | What it does |
|---|---|
| `index.html` | Landing. The two-token explainer — SHROOMS the key, SPORES the harvest. |
| `farms.html` | The eight strains. Stake asset, entry burn and share of harvest per card. |
| `vault.html` | The treasury. Redeem SPORES for HYPE; anyone can trigger the weekly drip. |
| `tokenomics.html` | Nine charts: fee income, reward curves, the rising floor, live burn tracking. |
| `grimoire.html` | How it all works, in prose. |

## Running it

```bash
npx serve .          # or: python3 -m http.server 5173
```

Everything is relative paths, so it works from `file://` too. That is why the
scripts are plain `<script>` tags rather than ES modules — module scripts are
blocked by CORS when a page is opened straight off disk, which leaves you staring
at a blank page.

## Pointing it at a deployment

Edit [`js/config.js`](js/config.js) with the addresses from
`deployments/<network>.v2.json` in the contracts repo:

```js
contracts: {
  LiquiditySpores: '0x…',
  SporesToken:     '0x…',
  ShroomsFarm:     '0x…',
  Faucet:          '0x…',
},
tokens: { SHROOMS: '0x…', SHROOMS_LP: '0x…' },
ownerIsTimelock: true,
```

Nothing else needs touching — no markup references an address directly.

## The burn tracker

The tokenomics page checks whether `ShroomsFarm` is a real address.

- **Not set** — the tracker runs simulated activity and the page says so, on a
  chip next to the heading.
- **Set** — it loads ethers and reads `Fertilised` and `PoolUnlocked` events live
  from the farm, and the chip changes to say which chain.

A fake number presented as live costs you trust in every other number on the
page, so it is labelled rather than quietly faked.

## Structure

```
index.html  farms.html  vault.html  tokenomics.html  grimoire.html
css/app.css          one stylesheet, design tokens at the top
js/config.js         deployed addresses — the only file you edit per deployment
js/data.js           strain metadata; mirrors scripts/lineup.js in the contracts repo
js/app.js            shared behaviour: wallet, sparkles, mascot interactions
js/farms.js          the strain grid and stake sheet
js/charts.js         hand-rolled SVG charts
js/tokenomics.js     the economic model the charts render
assets/strains/      the eight mushrooms, transparent PNG
web3/                wagmi/viem integration layer and exported ABIs
```

### Charts

Hand-rolled SVG rather than a charting library: the page has no build step, and
drawing them directly keeps control of the draw-on animation and the palette.
Every chart ships a legend, a hover layer and a table fallback.

The palette is a dark-surface categorical set derived from the brand hues and
pulled into the OKLCH dark band, validated for colourblind separation — the brand
gold and cyan were too light against the navy surface, and violet sat too close
to cyan under deuteranopia.

### Strain metadata

`js/data.js` mirrors `scripts/lineup.js` in the contracts repo. **If you change
one, change both.** The contracts only know pool ids, weights and gate costs —
names, tiers and artwork live here, so renaming a mushroom is never a transaction.

## Deploying

GitHub Pages: Settings → Pages → deploy from `main`, root. It is already a static
site, so nothing else is needed.

Vercel or Netlify: no build command, publish directory `.`.

## Licence

MIT — see [LICENSE](LICENSE).
