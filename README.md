# CreatureLife v1.0

An **original creature-raising life simulation** built as a standalone, dark-mode, mobile-first, local-first Progressive Web App. Created for the Empyrios app ecosystem, but usable without AppHub, API access, logins, subscriptions or paid services.

**Status:** v1 game implemented and locally tested. GitHub Pages publication status depends on a successful deployment workflow; a repository commit alone is not proof of a live website.

## Playable systems

| Module | Working features |
| --- | --- |
| Sanctuary | One founding companion on first launch, procedural SVG appearance, live status bars, feed/play/rest/expedition actions, resources, day and weather display |
| Care and growth | Hunger, energy, happiness, bond and health; feeding, resting, playing, habitat preference and day-to-day stat changes |
| Lifecycles | Hatchling to youngling at age 3, youngling to adult at age 8; adult branch Luminous if high bond/happiness, otherwise Wild |
| Exploration | Three original biomes (Mosswood, Glasswater, Emberfall), biome-aligned resource bonuses, one expedition per creature per day, random resources, rare egg discoveries |
| Genetics | Six loci with two alleles each (coat, ears, tail, markings, glow and affinity), expressed phenotype and seeded inheritance with 6% mutation per transmitted allele |
| Breeding | Two unrelated adult companions need at least 40 bond, 8 nectar and egg slot; parent-child/sibling combinations are prohibited; hatch after two full game days |
| Creature collection | Renaming, selecting and moving up to 24 creatures between three habitats, with a viewable lineage |
| Milestones & journal | Nine actual unlockable achievements, bounded event history and real activity counters |
| Data | Strict validated JSON import/export, local browser saves, seeded deterministic game actions, full reset confirmation |
| PWA | Mobile bottom navigation, desktop sidebar, installable manifest, static offline-cache shell, original programmatic SVG creature artwork |

### Starting world

- Default random-generation seed: `20261103`. All game randomness passes through an explicit xorshift32 generator saved in your world state; the same seed and same sequence of decisions reproduce the same outcome.
- Starts on Day 1 with one original companion (Pip), 14 berries, 8 nectar and zero starshards. The creature's genome and preferred habitat are determined from the seed.
- Collect berries/nectar through expeditions and daily resource replenishment. Find eggs on expeditions or breed two eligible adults.
- Emberfall expeditions and Stardust weather provide starshards. Spend 3 starshards to attune a companion, gaining bond and happiness.
- “Advance a day” is **manual**. Time does not pass while the app is closed, so there is no background simulation or loss of progress.

### Running locally

Open a local static file server from the repository root:

```bash
python3 -m http.server 8000 --directory site
```

Visit `http://localhost:8000/`. There is no build step, paid API, database, login or npm install requirement for playing.

```bash
npm run verify                  # Node syntax checks and 56 unit tests
python3 tests/browser-check.py  # Optional Playwright smoke checks
```

The browser test requires Python Playwright and an installed Chromium binary at `/usr/bin/chromium`. It uses in-memory ES-module loading because the original test container blocks navigation to local or remote URLs. It verifies mobile 390×844 and desktop 1440×900, all five views, actual care and expedition interactions, rename, habitat changes, export and lack of horizontal overflow. It is **not** a real deployment/network or service-worker offline test.

### Publishing to GitHub Pages

1. Commit the source to the independent public `Empyrios/creaturelife` repository root.
2. Open Settings → Pages → Build and deployment → Source, and select **GitHub Actions**.
3. The included `.github/workflows/deploy.yml` verifies the game and deploys the `site/` directory. Confirm a completed successful deployment before linking to `https://empyrios.github.io/creaturelife/` from AppHub.

New repositories may require Pages enablement by the owner; an Actions `GITHUB_TOKEN` often cannot enable Pages automatically because it does not have administration rights.

### Data and privacy

World data stays in the current browser profile in `localStorage` (`empyrios-creaturelife-v1`). It is not encrypted, synchronized, or backed up automatically. Clearing browser data or switching devices loses progress unless you export a JSON backup. Before importing a backup, inspect its origin; the game validates schema, bounded collection sizes, resources, alleles, names, dates and IDs and limits JSON files to 2 MB. Text inserted into HTML is escaped. No external fonts, telemetry, adverts or network calls are made by the UI; only same-origin PWA shell resources are cached.

### Deliberate v1 limitations

- This is a playful **simplified genetics model**, not a scientifically accurate population genetics simulator.
- All creatures share a procedural base body that varies by coat, ears, tail, markings, glow, age and habitat. There are not dozens of bespoke species art assets yet.
- Adults branch automatically based on care stats. There is no separate skill tree, combat or multiplayer system.
- Expeditions finish immediately, not asynchronously. They have no mini-game or risk of death.
- No live account sync, sharing, cloud save, marketplace or external APIs.
- This is entirely separate from the `Weave` competitive battle system and does not copy its rules or assets.

### Suggested v1.1 directions

Add genuine habitat simulation and decorations, distinct silhouette families, more meaningful morphology expression, richer seasonal ecology, creature personality, variant evolution decisions, longer expeditions, breeding line management and accessibility review on physical Android devices. Keep significant changes independently tested and avoid claiming unimplemented functionality.
