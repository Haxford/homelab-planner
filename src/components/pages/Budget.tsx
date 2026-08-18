"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Trash2, Wallet, Zap } from "lucide-react";
import { DEVICE_CATEGORIES, categoryMeta } from "@/lib/catalog/devices";
import { formatCurrency, formatNumber, formatWatts, pluralise } from "@/lib/format";
import { newId } from "@/lib/id";
import { computePower, computeTotals, indexById, mergeDevices } from "@/lib/selectors";
import { usePlan } from "@/lib/store";
import type { WishlistItem } from "@/lib/types";
import {
  Button,
  Card,
  EmptyState,
  Field,
  NumberInput,
  PageHeader,
  Stat,
  TextInput,
  cx,
} from "@/components/ui";

export function Budget() {
  const { plan, setPlan } = usePlan();
  const devices = useMemo(() => indexById(mergeDevices(plan.customDevices)), [plan.customDevices]);
  const totals = useMemo(() => computeTotals(plan, devices), [plan, devices]);
  const currency = plan.settings.currency;
  const [showPurchased, setShowPurchased] = useState(true);

  /** Placed hardware rolled up by category, biggest spend first. */
  const byCategory = useMemo(() => {
    const rows = new Map<string, { count: number; cost: number; idleW: number; maxW: number }>();
    for (const rack of plan.racks) {
      for (const item of rack.items) {
        const device = devices.get(item.deviceId);
        if (!device) continue;
        const row = rows.get(device.category) ?? { count: 0, cost: 0, idleW: 0, maxW: 0 };
        row.count += 1;
        row.cost += device.price;
        row.idleW += device.powerIdleW;
        row.maxW += device.powerMaxW;
        rows.set(device.category, row);
      }
    }
    return DEVICE_CATEGORIES.map((meta) => ({ meta, ...(rows.get(meta.id) ?? { count: 0, cost: 0, idleW: 0, maxW: 0 }) }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.cost - a.cost);
  }, [plan.racks, devices]);

  /** Every placed device, ranked by what it costs to leave switched on. */
  const powerRanking = useMemo(() => {
    const rows = plan.racks.flatMap((rack) =>
      rack.items.map((item) => {
        const device = devices.get(item.deviceId);
        if (!device) return null;
        const power = computePower(
          { idleW: device.powerIdleW, maxW: device.powerMaxW },
          plan.settings,
        );
        return {
          id: item.id,
          label: item.label?.trim() || device.name,
          rackName: rack.name,
          category: device.category,
          power,
        };
      }),
    );
    return rows
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.power.averageW - a.power.averageW);
  }, [plan.racks, plan.settings, devices]);

  function updateSettings(patch: Partial<typeof plan.settings>) {
    setPlan((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } }));
  }

  function addWishlistItem() {
    const item: WishlistItem = {
      id: newId("wish"),
      name: "",
      price: 0,
      quantity: 1,
      purchased: false,
    };
    setPlan((previous) => ({ ...previous, wishlist: [...previous.wishlist, item] }));
  }

  function updateWishlistItem(id: string, patch: Partial<WishlistItem>) {
    setPlan((previous) => ({
      ...previous,
      wishlist: previous.wishlist.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function removeWishlistItem(id: string) {
    setPlan((previous) => ({
      ...previous,
      wishlist: previous.wishlist.filter((item) => item.id !== id),
    }));
  }

  const visibleWishlist = showPurchased
    ? plan.wishlist
    : plan.wishlist.filter((item) => !item.purchased);

  return (
    <>
      <PageHeader
        title="Budget & power"
        description="What the plan costs to buy once, and what it costs every month you leave it running."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Capital cost"
          icon={<Wallet className="h-3.5 w-3.5" />}
          value={formatCurrency(totals.capex, currency)}
          hint={`${formatCurrency(totals.hardwareCost, currency)} placed · ${formatCurrency(totals.rackCost, currency)} cabinets · ${formatCurrency(totals.wishlistCost, currency)} wishlist`}
        />
        <Stat
          label="Still to buy"
          value={formatCurrency(totals.wishlistOutstanding, currency)}
          hint={`${pluralise(plan.wishlist.filter((i) => !i.purchased).length, "item")} outstanding`}
          tone={totals.wishlistOutstanding > 0 ? "warning" : "positive"}
        />
        <Stat
          label="Running cost"
          icon={<Zap className="h-3.5 w-3.5" />}
          value={`${formatCurrency(totals.power.costPerMonth, currency)}/mo`}
          hint={`${formatCurrency(totals.power.costPerYear, currency)} a year`}
        />
        <Stat
          label="Energy"
          value={`${formatNumber(totals.power.kwhPerYear, 0)} kWh`}
          hint={`${formatWatts(totals.power.averageW)} typical · ${formatWatts(totals.power.maxW)} peak`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Card title="Assumptions" description="Change these and every cost on this page moves with them.">
          <div className="space-y-3">
            <Field label="Currency">
              {(id) => (
                <select
                  id={id}
                  value={currency}
                  onChange={(event) =>
                    updateSettings({ currency: event.target.value as typeof currency })
                  }
                  className="w-full rounded-lg border border-edge-strong bg-surface-2 px-2.5 py-1.5 text-sm text-zinc-100 focus:border-emerald-400/60 focus:outline-none"
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              )}
            </Field>
            <Field label={`Electricity (${currency} per kWh)`}>
              {(id) => (
                <NumberInput
                  id={id}
                  min={0}
                  step="0.01"
                  value={plan.settings.kwhRate}
                  onChange={(event) => updateSettings({ kwhRate: Math.max(0, Number(event.target.value) || 0) })}
                />
              )}
            </Field>
            <Field label="Hours powered per day">
              {(id) => (
                <NumberInput
                  id={id}
                  min={0}
                  max={24}
                  value={plan.settings.hoursPerDay}
                  onChange={(event) =>
                    updateSettings({ hoursPerDay: Math.min(24, Math.max(0, Number(event.target.value) || 0)) })
                  }
                />
              )}
            </Field>
            <Field
              label={`Typical load — ${Math.round(plan.settings.loadFactor * 100)}%`}
              hint="Where between idle and peak the gear actually sits. Most homelabs idle far more than they work."
            >
              {(id) => (
                <input
                  id={id}
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(plan.settings.loadFactor * 100)}
                  onChange={(event) => updateSettings({ loadFactor: Number(event.target.value) / 100 })}
                  className="w-full accent-emerald-400"
                />
              )}
            </Field>
            <dl className="space-y-1 rounded-lg border border-edge bg-surface-2/50 px-2.5 py-2 text-xs">
              <Row label="Idle draw" value={formatWatts(totals.power.idleW)} />
              <Row label="Typical draw" value={formatWatts(totals.power.averageW)} />
              <Row label="Peak draw" value={formatWatts(totals.power.maxW)} />
              <Row label="Per day" value={formatCurrency(totals.power.costPerYear / 365, currency, 2)} />
            </dl>
          </div>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card title="Spend by category" description="Where the money in the racks actually went.">
            {byCategory.length === 0 ? (
              <EmptyState title="Nothing placed yet" description="Add hardware in the rack builder to see the breakdown." />
            ) : (
              <ul className="space-y-2">
                {byCategory.map((row) => {
                  const share = totals.hardwareCost > 0 ? (row.cost / totals.hardwareCost) * 100 : 0;
                  return (
                    <li key={row.meta.id}>
                      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-zinc-300">
                          <span className={cx("h-2 w-2 rounded-full", row.meta.dot)} />
                          {row.meta.label}
                          <span className="text-zinc-600">×{row.count}</span>
                        </span>
                        <span className="font-mono tabular-nums text-zinc-400">
                          {formatCurrency(row.cost, currency)}
                          <span className="ml-1.5 text-zinc-600">{share.toFixed(0)}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas ring-1 ring-inset ring-edge">
                        <div className={cx("h-full rounded-full", row.meta.dot)} style={{ width: `${share}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            title="What costs the most to run"
            description={`Per device, at ${formatCurrency(plan.settings.kwhRate, currency, 2)}/kWh and ${plan.settings.hoursPerDay}h a day.`}
            bodyClassName="p-0 sm:p-0"
          >
            {powerRanking.length === 0 ? (
              <div className="p-4">
                <EmptyState title="No devices placed" />
              </div>
            ) : (
              <div className="scroll-slim max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 border-b border-edge bg-surface text-[0.68rem] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-4 py-2 font-medium">Device</th>
                      <th className="px-3 py-2 text-right font-medium">Typical</th>
                      <th className="px-3 py-2 text-right font-medium">kWh/yr</th>
                      <th className="px-4 py-2 text-right font-medium">Cost/yr</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge/70">
                    {powerRanking.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-surface-2/40">
                        <td className="px-4 py-1.5">
                          <div className="flex items-center gap-2">
                            <span className={cx("h-4 w-1 shrink-0 rounded-full", categoryMeta(row.category).dot)} />
                            <div className="min-w-0">
                              <p className="truncate text-zinc-200">{row.label}</p>
                              <p className="truncate text-[0.65rem] text-zinc-500">{row.rackName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono text-zinc-400">{formatWatts(row.power.averageW)}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-zinc-400">{formatNumber(row.power.kwhPerYear, 0)}</td>
                        <td className="px-4 py-1.5 text-right font-mono text-zinc-300">
                          {formatCurrency(row.power.costPerYear, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card
        className="mt-4"
        title="Wishlist"
        description="Drives, cables, upgrades — anything that costs money but does not take a rack slot."
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowPurchased((current) => !current)}>
              {showPurchased ? "Hide purchased" : "Show purchased"}
            </Button>
            <Button size="sm" variant="primary" onClick={addWishlistItem}>
              <Plus className="h-3.5 w-3.5" />
              Add item
            </Button>
          </div>
        }
        bodyClassName="p-0 sm:p-0"
      >
        {visibleWishlist.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={plan.wishlist.length === 0 ? "Wishlist is empty" : "Everything here is bought"}
              description={plan.wishlist.length === 0 ? "Add the parts you still need so the capital cost is honest." : undefined}
            />
          </div>
        ) : (
          <ul className="divide-y divide-edge/70">
            {visibleWishlist.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={item.purchased}
                  aria-label={`Mark ${item.name || "item"} as purchased`}
                  onClick={() => updateWishlistItem(item.id, { purchased: !item.purchased })}
                  className={cx(
                    "grid h-5 w-5 shrink-0 place-items-center rounded border transition-colors",
                    item.purchased
                      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300"
                      : "border-edge-strong bg-canvas text-transparent hover:border-emerald-400/40",
                  )}
                >
                  <Check className="h-3 w-3" />
                </button>
                <TextInput
                  value={item.name}
                  onChange={(event) => updateWishlistItem(item.id, { name: event.target.value })}
                  placeholder="What is it?"
                  aria-label="Item name"
                  className={cx("min-w-40 flex-1", item.purchased && "text-zinc-500 line-through")}
                />
                <NumberInput
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    updateWishlistItem(item.id, { quantity: Math.max(1, Number(event.target.value) || 1) })
                  }
                  aria-label="Quantity"
                  className="w-16"
                />
                <NumberInput
                  min={0}
                  value={item.price}
                  onChange={(event) => updateWishlistItem(item.id, { price: Math.max(0, Number(event.target.value) || 0) })}
                  aria-label={`Unit price in ${currency}`}
                  className="w-24"
                />
                <span className="w-20 shrink-0 text-right font-mono text-xs text-zinc-300">
                  {formatCurrency(item.price * item.quantity, currency)}
                </span>
                <Button variant="ghost" size="sm" aria-label={`Delete ${item.name || "item"}`} onClick={() => removeWishlistItem(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono tabular-nums text-zinc-300">{value}</dd>
    </div>
  );
}
