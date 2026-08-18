"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronsLeftRight, Plus, Trash2 } from "lucide-react";
import { categoryMeta, HOST_CATEGORIES } from "@/lib/catalog/devices";
import { serviceCategoryMeta } from "@/lib/catalog/services";
import { formatCurrency, formatStorage, formatWatts } from "@/lib/format";
import { hostStatus } from "@/lib/selectors";
import type { Device, Rack, RackItem, Service, ServiceInstance, Settings } from "@/lib/types";
import { Badge, Button, Field, Meter, NumberInput, Select, TextInput, Textarea, cx } from "@/components/ui";

export function Inspector({
  rack,
  item,
  device,
  settings,
  services,
  instances,
  onUpdateItem,
  onRemoveItem,
  onMove,
  onFlipSide,
  onUpdateRack,
  onAssignService,
  onUnassignService,
}: {
  rack: Rack | null;
  item: RackItem | null;
  device: Device | undefined;
  settings: Settings;
  services: Service[];
  instances: ServiceInstance[];
  onUpdateItem: (patch: Partial<RackItem>) => void;
  onRemoveItem: () => void;
  onMove: (delta: number) => void;
  onFlipSide: () => void;
  onUpdateRack: (patch: Partial<Rack>) => void;
  onAssignService: (serviceId: string) => void;
  onUnassignService: (instanceId: string) => void;
}) {
  if (!rack) {
    return (
      <p className="px-3 py-6 text-center text-xs text-zinc-500">
        Add a rack to start placing hardware.
      </p>
    );
  }

  if (!item) return <RackSettings rack={rack} settings={settings} onUpdate={onUpdateRack} />;

  return (
    <ItemSettings
      rack={rack}
      item={item}
      device={device}
      settings={settings}
      services={services}
      instances={instances}
      onUpdateItem={onUpdateItem}
      onRemoveItem={onRemoveItem}
      onMove={onMove}
      onFlipSide={onFlipSide}
      onAssignService={onAssignService}
      onUnassignService={onUnassignService}
    />
  );
}

function RackSettings({
  rack,
  settings,
  onUpdate,
}: {
  rack: Rack;
  settings: Settings;
  onUpdate: (patch: Partial<Rack>) => void;
}) {
  return (
    <div className="space-y-3 px-3 py-3">
      <p className="text-[0.7rem] uppercase tracking-wider text-zinc-500">Rack</p>
      <Field label="Name">
        {(id) => (
          <TextInput id={id} value={rack.name} onChange={(event) => onUpdate({ name: event.target.value })} />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Height (U)">
          {(id) => (
            <NumberInput
              id={id}
              min={1}
              max={60}
              value={rack.heightU}
              onChange={(event) =>
                onUpdate({ heightU: Math.min(60, Math.max(1, Number(event.target.value) || 1)) })
              }
            />
          )}
        </Field>
        <Field label={`Cabinet cost (${settings.currency})`}>
          {(id) => (
            <NumberInput
              id={id}
              min={0}
              value={rack.price}
              onChange={(event) => onUpdate({ price: Math.max(0, Number(event.target.value) || 0) })}
            />
          )}
        </Field>
      </div>
      <Field label="Notes" hint="Depth limits, where it lives, who complains about the noise.">
        {(id) => (
          <Textarea
            id={id}
            value={rack.notes ?? ""}
            onChange={(event) => onUpdate({ notes: event.target.value })}
          />
        )}
      </Field>
      <p className="rounded-lg border border-edge bg-surface-2/60 px-2.5 py-2 text-[0.7rem] leading-relaxed text-zinc-500">
        Select a device in the elevation to edit it, or drag one in from the palette.
      </p>
    </div>
  );
}

function ItemSettings({
  rack,
  item,
  device,
  settings,
  services,
  instances,
  onUpdateItem,
  onRemoveItem,
  onMove,
  onFlipSide,
  onAssignService,
  onUnassignService,
}: {
  rack: Rack;
  item: RackItem;
  device: Device | undefined;
  settings: Settings;
  services: Service[];
  instances: ServiceInstance[];
  onUpdateItem: (patch: Partial<RackItem>) => void;
  onRemoveItem: () => void;
  onMove: (delta: number) => void;
  onFlipSide: () => void;
  onAssignService: (serviceId: string) => void;
  onUnassignService: (instanceId: string) => void;
}) {
  const [pendingService, setPendingService] = useState("");
  const meta = device ? categoryMeta(device.category) : null;
  const isHost = device ? HOST_CATEGORIES.includes(device.category) : false;
  const servicesById = new Map(services.map((service) => [service.id, service]));

  const assigned = instances
    .map((instance) => ({ instance, service: servicesById.get(instance.serviceId) }))
    .filter((row): row is { instance: ServiceInstance; service: Service } => Boolean(row.service));

  const used = assigned.reduce(
    (totals, { service }) => ({
      cores: totals.cores + service.cpuCores,
      ramGb: totals.ramGb + service.ramGb,
      storageGb: totals.storageGb + service.storageGb,
    }),
    { cores: 0, ramGb: 0, storageGb: 0 },
  );

  const capacity = {
    cores: device?.cores ?? 0,
    ramGb: device?.ramGb ?? 0,
    storageGb: (device?.storageTb ?? 0) * 1000,
  };

  const worst = Math.max(
    capacity.cores > 0 ? used.cores / capacity.cores : used.cores > 0 ? Infinity : 0,
    capacity.ramGb > 0 ? used.ramGb / capacity.ramGb : used.ramGb > 0 ? Infinity : 0,
    capacity.storageGb > 0 ? used.storageGb / capacity.storageGb : used.storageGb > 0 ? Infinity : 0,
  );
  const status = hostStatus(worst);

  return (
    <div className="space-y-3 px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[0.7rem] uppercase tracking-wider text-zinc-500">{meta?.label ?? "Device"}</p>
          <p className="truncate text-sm font-semibold text-zinc-100">{device?.name ?? "Unknown device"}</p>
          <p className="truncate text-xs text-zinc-500">{device?.vendor}</p>
        </div>
        <Button variant="danger" size="sm" onClick={onRemoveItem}>
          <Trash2 className="h-3.5 w-3.5" />
          Remove
        </Button>
      </div>

      <Field label="Label" hint="Hostname or nickname. Shown in the elevation and the network table.">
        {(id) => (
          <TextInput
            id={id}
            value={item.label ?? ""}
            placeholder={device?.name ?? ""}
            onChange={(event) => onUpdateItem({ label: event.target.value })}
          />
        )}
      </Field>

      <div>
        <p className="mb-1 text-xs font-medium text-zinc-400">
          Position — U{item.startU}
          {device && device.rackUnits > 1 ? `–${item.startU + device.rackUnits - 1}` : ""} of {rack.heightU}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={() => onMove(1)}>
            <ArrowUp className="h-3.5 w-3.5" />
            Up
          </Button>
          <Button size="sm" onClick={() => onMove(-1)}>
            <ArrowDown className="h-3.5 w-3.5" />
            Down
          </Button>
          {device?.width === 0.5 && (
            <Button size="sm" onClick={onFlipSide}>
              <ChevronsLeftRight className="h-3.5 w-3.5" />
              {item.side === "right" ? "Move left" : "Move right"}
            </Button>
          )}
        </div>
      </div>

      {device && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-lg border border-edge bg-surface-2/50 px-2.5 py-2 text-xs">
          <Spec label="Size" value={`${device.rackUnits}U${device.width === 0.5 ? " half-width" : ""}`} />
          <Spec label="Price" value={formatCurrency(device.price, settings.currency)} />
          {device.cpu && <Spec label="CPU" value={device.cpu} span />}
          {device.cores ? <Spec label="Cores" value={`${device.cores}c / ${device.threads ?? device.cores}t`} /> : null}
          {device.ramGb ? (
            <Spec label="RAM" value={`${device.ramGb} GB${device.maxRamGb ? ` (max ${device.maxRamGb})` : ""}`} />
          ) : null}
          {device.storageTb ? (
            <Spec label="Storage" value={`${device.storageTb} TB${device.driveBays ? ` · ${device.driveBays} bays` : ""}`} />
          ) : null}
          {device.ports ? (
            <Spec label="Ports" value={`${device.ports}${device.portSpeed ? ` × ${device.portSpeed}G` : ""}`} />
          ) : null}
          <Spec label="Power" value={`${formatWatts(device.powerIdleW)} – ${formatWatts(device.powerMaxW)}`} />
          {device.notes && <Spec label="Notes" value={device.notes} span />}
        </dl>
      )}

      {isHost && (
        <div className="space-y-2.5 rounded-lg border border-edge bg-surface-2/50 px-2.5 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-zinc-200">Services on this host</p>
            <Badge tone={status}>
              {status === "over" ? "Over capacity" : status === "tight" ? "Tight" : "Headroom"}
            </Badge>
          </div>

          <div className="space-y-2">
            <Meter
              label="CPU"
              value={used.cores}
              max={capacity.cores}
              detail={`${used.cores.toFixed(2)} / ${capacity.cores || "?"} cores`}
            />
            <Meter
              label="RAM"
              value={used.ramGb}
              max={capacity.ramGb}
              detail={`${used.ramGb.toFixed(1)} / ${capacity.ramGb || "?"} GB`}
            />
            <Meter
              label="Storage"
              value={used.storageGb}
              max={capacity.storageGb}
              detail={`${formatStorage(used.storageGb)} / ${capacity.storageGb ? formatStorage(capacity.storageGb) : "?"}`}
            />
          </div>

          <ul className="space-y-1">
            {assigned.map(({ instance, service }) => {
              const accent = serviceCategoryMeta(service.category).accent;
              return (
                <li
                  key={instance.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-edge bg-canvas/50 px-2 py-1"
                >
                  <span className="min-w-0 flex-1 truncate text-xs text-zinc-300">{service.name}</span>
                  <span className={cx("shrink-0 rounded border px-1 py-px font-mono text-[0.6rem]", accent)}>
                    {service.cpuCores}c · {service.ramGb}G
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${service.name}`}
                    onClick={() => onUnassignService(instance.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </li>
              );
            })}
            {assigned.length === 0 && (
              <li className="rounded-md border border-dashed border-edge-strong px-2 py-2 text-center text-[0.7rem] text-zinc-500">
                Nothing assigned yet.
              </li>
            )}
          </ul>

          <div className="flex gap-1.5">
            <Select
              value={pendingService}
              onChange={(event) => setPendingService(event.target.value)}
              aria-label="Service to add"
            >
              <option value="">Add a service…</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="primary"
              disabled={!pendingService}
              onClick={() => {
                onAssignService(pendingService);
                setPendingService("");
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Spec({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : undefined}>
      <dt className="text-[0.65rem] uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="font-mono text-[0.7rem] text-zinc-300">{value}</dd>
    </div>
  );
}
