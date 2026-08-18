"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Cpu,
  HardDrive,
  Layers,
  PoundSterling,
  Server,
  Zap,
} from "lucide-react";
import { formatCurrency, formatNumber, formatStorage, formatWatts, pluralise } from "@/lib/format";
import {
  computeHostUsage,
  computeTotals,
  indexById,
  mergeDevices,
  mergeServices,
  usedUnits,
} from "@/lib/selectors";
import { usePlan } from "@/lib/store";
import { Badge, Button, Card, EmptyState, Meter, PageHeader, Stat } from "@/components/ui";

export function Overview() {
  const { plan } = usePlan();

  const devices = useMemo(() => indexById(mergeDevices(plan.customDevices)), [plan.customDevices]);
  const services = useMemo(() => indexById(mergeServices(plan.customServices)), [plan.customServices]);
  const totals = useMemo(() => computeTotals(plan, devices), [plan, devices]);
  const hosts = useMemo(() => computeHostUsage(plan, devices, services), [plan, devices, services]);

  const strained = hosts.filter((host) => host.status !== "ok");
  const unassigned = plan.serviceInstances.filter((instance) => !instance.hostItemId);
  const currency = plan.settings.currency;

  if (plan.racks.length === 0) {
    return (
      <>
        <PageHeader title="Overview" description="Nothing planned yet." />
        <EmptyState
          icon={<Server className="h-8 w-8" />}
          title="Your plan is empty"
          description="Add a rack, drop some hardware into it, and this page will fill in with capacity, power and cost."
          action={
            <Link href="/rack">
              <Button variant="primary">
                Open the rack builder
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Overview"
        description={`${plan.name} — ${pluralise(totals.rackCount, "rack")}, ${pluralise(totals.deviceCount, "device")}.`}
        actions={
          <Link href="/rack">
            <Button variant="primary">
              Rack builder
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Rack space"
          icon={<Layers className="h-3.5 w-3.5" />}
          value={`${formatNumber(totals.usedU)} / ${totals.totalU}U`}
          hint={`${formatNumber(totals.totalU - totals.usedU)}U free across ${pluralise(totals.rackCount, "rack")}`}
        />
        <Stat
          label="Typical draw"
          icon={<Zap className="h-3.5 w-3.5" />}
          value={formatWatts(totals.power.averageW)}
          hint={`${formatWatts(totals.power.idleW)} idle · ${formatWatts(totals.power.maxW)} peak`}
        />
        <Stat
          label="Running cost"
          icon={<PoundSterling className="h-3.5 w-3.5" />}
          value={`${formatCurrency(totals.power.costPerMonth, currency)}/mo`}
          hint={`${formatNumber(totals.power.kwhPerYear, 0)} kWh a year at ${formatCurrency(plan.settings.kwhRate, currency, 2)}/kWh`}
        />
        <Stat
          label="Capital cost"
          icon={<HardDrive className="h-3.5 w-3.5" />}
          value={formatCurrency(totals.capex, currency)}
          hint={`${formatCurrency(totals.wishlistOutstanding, currency)} still to buy`}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card
          title="Compute pool"
          description="Everything the hosts in your racks add up to, and how much of it the services claim."
        >
          <div className="space-y-3">
            <Meter
              label="CPU cores"
              value={hosts.reduce((sum, host) => sum + host.used.cores, 0)}
              max={hosts.reduce((sum, host) => sum + host.capacity.cores, 0)}
              detail={`${formatNumber(hosts.reduce((sum, host) => sum + host.used.cores, 0))} / ${formatNumber(
                hosts.reduce((sum, host) => sum + host.capacity.cores, 0),
              )} cores`}
            />
            <Meter
              label="Memory"
              value={hosts.reduce((sum, host) => sum + host.used.ramGb, 0)}
              max={hosts.reduce((sum, host) => sum + host.capacity.ramGb, 0)}
              detail={`${formatNumber(hosts.reduce((sum, host) => sum + host.used.ramGb, 0))} / ${formatNumber(
                hosts.reduce((sum, host) => sum + host.capacity.ramGb, 0),
              )} GB`}
            />
            <Meter
              label="Storage"
              value={hosts.reduce((sum, host) => sum + host.used.storageGb, 0)}
              max={hosts.reduce((sum, host) => sum + host.capacity.storageGb, 0)}
              detail={`${formatStorage(hosts.reduce((sum, host) => sum + host.used.storageGb, 0))} / ${formatStorage(
                hosts.reduce((sum, host) => sum + host.capacity.storageGb, 0),
              )}`}
            />
            <div className="flex flex-wrap gap-3 border-t border-edge pt-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-zinc-500" />
                {pluralise(hosts.length, "host")}
              </span>
              <span className="flex items-center gap-1.5">
                <Boxes className="h-3.5 w-3.5 text-zinc-500" />
                {pluralise(plan.serviceInstances.length, "service")}
              </span>
              <span className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-zinc-500" />
                {formatNumber(totals.storageTb)} TB raw
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Attention"
          description="Anything that will bite you before the hardware arrives."
        >
          {strained.length === 0 && unassigned.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">
              Every host has headroom and every service has a home.
            </p>
          ) : (
            <ul className="space-y-2">
              {strained.map((host) => (
                <li
                  key={host.itemId}
                  className="flex items-start gap-2.5 rounded-lg border border-edge bg-surface-2/50 px-3 py-2"
                >
                  <AlertTriangle
                    className={host.status === "over" ? "mt-0.5 h-4 w-4 shrink-0 text-rose-400" : "mt-0.5 h-4 w-4 shrink-0 text-amber-400"}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-200">
                      {host.label}{" "}
                      <Badge tone={host.status}>
                        {host.status === "over" ? "over capacity" : "tight"}
                      </Badge>
                    </p>
                    <p className="mt-0.5 text-[0.7rem] text-zinc-500">
                      {pluralise(host.services.length, "service")} need{" "}
                      {formatNumber(host.used.cores)} cores, {formatNumber(host.used.ramGb)} GB RAM and{" "}
                      {formatStorage(host.used.storageGb)}.
                    </p>
                  </div>
                </li>
              ))}
              {unassigned.length > 0 && (
                <li className="flex items-start gap-2.5 rounded-lg border border-edge bg-surface-2/50 px-3 py-2">
                  <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-200">
                      {pluralise(unassigned.length, "service")} with no host
                    </p>
                    <p className="mt-0.5 text-[0.7rem] text-zinc-500">
                      Assign them on the Services page so they count towards capacity.
                    </p>
                  </div>
                </li>
              )}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4" title="Racks" description="Occupancy and what each one draws.">
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {plan.racks.map((rack) => {
            const used = usedUnits(rack, devices);
            const rackPower = rack.items.reduce(
              (sum, item) => {
                const device = devices.get(item.deviceId);
                if (!device) return sum;
                return { idleW: sum.idleW + device.powerIdleW, maxW: sum.maxW + device.powerMaxW };
              },
              { idleW: 0, maxW: 0 },
            );
            const averageW =
              rackPower.idleW + (rackPower.maxW - rackPower.idleW) * plan.settings.loadFactor;

            return (
              <li key={rack.id} className="rounded-lg border border-edge bg-surface-2/50 px-3 py-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-xs font-semibold text-zinc-200">{rack.name}</p>
                  <p className="shrink-0 font-mono text-[0.68rem] text-zinc-500">
                    {pluralise(rack.items.length, "item")}
                  </p>
                </div>
                <div className="mt-2">
                  <Meter
                    label="Used"
                    value={used}
                    max={rack.heightU}
                    detail={`${formatNumber(used)} / ${rack.heightU}U`}
                  />
                </div>
                <p className="mt-2 font-mono text-[0.68rem] text-zinc-500">
                  {formatWatts(averageW)} typical
                </p>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
