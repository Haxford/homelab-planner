# Homelab Planner

Plan a homelab before you spend money on it. Build the rack visually, decide what
runs where, map the addressing, and see what the whole thing costs to buy and to
keep switched on.

Built with Next.js and deployed on Vercel. Plans are stored in your browser — no
account, no database, no server-side state.

## What it does

**Rack builder** — drag hardware from a catalogue into a rack elevation. Devices
occupy real rack units, half-width gear pairs up two to a U, and the app refuses
drops that would collide or overhang. Move things by dragging or with the
inspector's controls. Multiple racks, resizable, duplicatable.

**Hardware catalogue** — 48 built-in devices: mini PCs, rack and tower servers,
workstations, NAS units, switches, gateways, UPSs, PDUs, patch panels, shelves.
Edit any of them to match reality, clone them, or add your own.

**Services and resource fit** — assign self-hosted services to a host and the
meters show CPU, memory and storage against that machine's capacity, flagging
hosts that are tight or over-committed. Duplicate port bindings on the same host
are called out. Each host can export a starting-point `docker-compose.yml`.

**Network** — subnets with VLAN tags and gateways, static address reservations
linked to devices in the rack, validation for addresses that fall outside their
subnet or collide with another reservation, and a generated hosts file.

**Budget and power** — capital cost broken down by category, running cost from
your electricity rate and a load factor, a per-device ranking of what actually
costs money to leave on, and a wishlist for parts that cost money without taking
a rack slot.

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build   # production build
npm start       # serve the production build
npm run lint    # eslint
```

Requires Node 20 or newer.

## Deploying to Vercel

The app is a static Next.js build with no server-side data, no environment
variables and no external services, so it deploys as-is:

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Accept the detected defaults — Vercel recognises Next.js and needs no further
   configuration.
3. Deploy.

Every route is prerendered as static content, so it runs comfortably inside a
free hobby project.

## Where your data lives

Everything is kept in your browser's `localStorage` under the key
`homelab-planner.plan`. Nothing is uploaded anywhere.

That means clearing site data, switching browsers or opening the app on another
machine starts you from scratch, so use **Export** in the header to save a plan
as JSON and **Import** to load it back. If you have the app open in two tabs,
edits in one are picked up by the other rather than being silently overwritten.

Settings → Start over resets to an empty plan or reloads the worked example.

## About the numbers

The built-in catalogue ships with estimates, not quotes:

- **Prices** are rough street prices in the plan's currency, with used
  enterprise gear priced as used. They will drift, and they vary by region.
- **Power figures** are typical whole-system draw rather than PSU ratings.
- **Service resources** are steady-state working estimates, deliberately
  generous enough to size a host sensibly. `storageGb` is what a service puts on
  *its own host* — a media library read over a NAS share is sized on the storage
  host, not on the machine running Jellyfin.

Edit anything on the Hardware page and the rest of the app follows. The point is
to give you a starting point to correct, not a spec sheet to trust.

## Project layout

```
src/
  app/                 routes — one thin page per section
  components/
    rack/              the rack canvas: palette, elevation, inspector
    pages/             page bodies (client components)
    ui.tsx             shared primitives
  lib/
    types.ts           domain model
    catalog/           built-in devices, services and rack presets
    store.tsx          localStorage-backed plan store
    selectors.ts       placement rules, totals, resource fit
    compose.ts         docker-compose and port-conflict helpers
```

## Licence

MIT — see [LICENSE](LICENSE).
