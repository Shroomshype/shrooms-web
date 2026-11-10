/* Strain metadata. Mirrors scripts/lineup.js — if you change one, change both.
   The contracts only know pool ids, weights and gate costs; names, tiers and
   artwork live here, so renaming a mushroom is never a transaction.

   Every strain stakes SHROOMS or the SHROOMS-HYPE LP. Nothing else is accepted:
   the reward pot is fixed by trading fees, so a pool taking an outside asset
   would pay SHROOMS holders' rewards to people who never bought SHROOMS. */

window.STRAINS = [
  { pid:0, slug:'puffball',    name:'Puffball Patch',    stake:'SHROOMS',    tier:'Common',    gate:0,      weight:600,
    blurb:'The open bed. No entry cost, no ceremony — stake SHROOMS and start earning in the same block.' },
  { pid:1, slug:'inky',        name:'Inky Cap',          stake:'SHROOMS',    tier:'Common',    gate:25000,  weight:850,
    blurb:'A small burn buys a bigger share. The first rung of the ladder, and the cheapest one.' },
  { pid:2, slug:'morel',       name:'Morel Deep',        stake:'SHROOMS',    tier:'Rare',      gate:75000,  weight:1150,
    blurb:'All surface area, no shortcuts. Honeycombed, stubborn, and worth the climb.' },
  { pid:3, slug:'chanterelle', name:'Chanterelle Grove', stake:'SHROOMS',    tier:'Rare',      gate:150000, weight:1500,
    blurb:'Wide fluted caps that catch more than their share of what falls.' },
  { pid:4, slug:'mycena',      name:'Blue Mycena',       stake:'SHROOMS',    tier:'Epic',      gate:300000, weight:1900,
    blurb:'Bioluminescent and expensive. The deepest single-sided bed in the grove.' },
  { pid:5, slug:'enoki',       name:'Enoki Cluster',     stake:'SHROOMS_LP', tier:'Epic',      gate:0,      weight:2300,
    blurb:'Open to any liquidity provider. Pair SHROOMS with HYPE and the grove pays you better for it.' },
  { pid:6, slug:'golden',      name:'Golden Cap',        stake:'SHROOMS_LP', tier:'Legendary', gate:250000, weight:3000,
    blurb:'Liquidity with commitment behind it. Deep pockets, deeper roots.' },
  { pid:7, slug:'amanita',     name:'Amanita Prime',     stake:'SHROOMS_LP', tier:'Legendary', gate:600000, weight:3700,
    blurb:'The mother colony. The largest share of every harvest, and the highest price of entry.' },
];

/* What each strain actually takes, in words a person can act on. */
window.STAKE_LABEL = {
  SHROOMS:    'SHROOMS',
  SHROOMS_LP: 'SHROOMS-HYPE LP',
};

window.TIER_VAR = {
  Legendary:'var(--r-legendary)',
  Epic:'var(--r-epic)',
  Rare:'var(--r-rare)',
  Common:'var(--r-common)',
};

/* Sparkle colours per tier, so a Legendary pop reads gold and an Epic violet. */
window.TIER_SPARK = {
  Legendary:['#FFC53D','#FFE9A8','#FFFFFF'],
  Epic:     ['#6B4BFF','#B9A6FF','#FFFFFF'],
  Rare:     ['#4FC8F0','#B3EBFF','#FFFFFF'],
  Common:   ['#8FB573','#D6EAC4','#FFFFFF'],
};

/* Where to get the staking asset. Montra is the launch venue. */
window.GET_SHROOMS_URL = 'https://montramarkets.xyz/';
