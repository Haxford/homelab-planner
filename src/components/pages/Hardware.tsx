"use client";

import { useMemo, useState } from "react";
import { Copy, HardDrive, Pencil, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { BUILT_IN_DEVICES, DEVICE_CATEGORIES, categoryMeta } from "@/lib/catalog/devices";
import { formatCurrency } from "@/lib/format";
import { mergeDevices } from "@/lib/selectors";
import { usePlan } from "@/lib/store";
import type { Device, DeviceCategory } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  NumberInput,
  PageHeader,
  Select,
  TextInput,
  Textarea,
  cx,
} from "@/components/ui";

const BUILT_IN_IDS = new Set(BUILT_IN_DEVICES.map((device) => device.id));

function emptyDevice(): Device {
  return {
    id: "",
    name: "",
    vendor: "",
    category: "mini-pc",
    rackUnits: 1,
    width: 1,
    powerIdleW: 10,
    powerMaxW: 60,
    price: 0,
  };
}

export function Hardware() {
  const { plan, setPlan } = usePlan();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DeviceCategory | "all">("all");
  const [editing, setEditing] = useState<Device | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const devices = useMemo(() => mergeDevices(plan.customDevices), [plan.customDevices]);
  const customIds = useMemo(() => new Set(plan.customDevices.map((d) => d.id)), [plan.customDevices]);

  /** How many times each device is placed, so we never orphan a rack item. */
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rack of plan.racks) {
      for (const item of rack.items) {
        counts.set(item.deviceId, (counts.get(item.deviceId) ?? 0) + 1);
      }
    }
    return counts;
  }, [plan.racks]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return devices.filter((device) => {
      if (category !== "all" && device.category !== category) return false;
      if (!needle) return true;
      return `${device.name} ${device.vendor} ${device.cpu ?? ""}`.toLowerCase().includes(needle);
    });
  }, [devices, query, category]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 4000);
  }

  function saveDevice(device: Device) {
    setPlan((previous) => {
      const exists = previous.customDevices.some((entry) => entry.id === device.id);
      return {
        ...previous,
        customDevices: exists
          ? previous.customDevices.map((entry) => (entry.id === device.id ? device : entry))
          : [...previous.customDevices, device],
      };
    });
    setEditing(null);
  }

  function removeCustom(device: Device) {
    const placed = usage.get(device.id) ?? 0;
    const isOverride = BUILT_IN_IDS.has(device.id);

    if (!isOverride && placed > 0) {
      flash(`${device.name} is placed in a rack ${placed} time(s) — remove it there first.`);
      return;
    }

    setPlan((previous) => ({
      ...previous,
      customDevices: previous.customDevices.filter((entry) => entry.id !== device.id),
    }));
    flash(isOverride ? `${device.name} reset to the built-in values.` : `${device.name} deleted.`);
  }

  function cloneDevice(device: Device) {
    const base = `${device.id}-copy`;
    let id = base;
    let suffix = 2;
    while (devices.some((entry) => entry.id === id)) id = `${base}-${suffix++}`;
    setEditing({ ...device, id, name: `${device.name} (copy)`, builtIn: false });
  }

  return (
    <>
      <PageHeader
        title="Hardware"
        description="The catalogue the rack builder draws from. Edit anything to match what you actually paid and what your meter actually reads."
        actions={
          <Button variant="primary" onClick={() => setEditing(emptyDevice())}>
            <Plus className="h-4 w-4" />
            Add device
          </Button>
        }
      />

      {notice && (
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {notice}
        </div>
      )}

      <Card
        bodyClassName="p-0 sm:p-0"
        title={`${visible.length} of ${devices.length} devices`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <TextInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search…"
                className="w-44 pl-8"
                aria-label="Search hardware"
              />
            </div>
            <Select
              value={category}
              onChange={(event) => setCategory(event.target.value as DeviceCategory | "all")}
              aria-label="Filter by category"
              className="w-40"
            >
              <option value="all">All categories</option>
              {DEVICE_CATEGORIES.map((meta) => (
                <option key={meta.id} value={meta.id}>
                  {meta.label}
                </option>
              ))}
            </Select>
          </div>
        }
      >
        {visible.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={<HardDrive className="h-8 w-8" />}
              title="Nothing matches that search"
              description="Clear the filters, or add the device yourself."
            />
          </div>
        ) : (
          <div className="scroll-slim overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-xs">
              <thead className="border-b border-edge text-[0.68rem] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Device</th>
                  <th className="px-3 py-2 font-medium">Size</th>
                  <th className="px-3 py-2 font-medium">Compute</th>
                  <th className="px-3 py-2 font-medium">Storage</th>
                  <th className="px-3 py-2 font-medium">Network</th>
                  <th className="px-3 py-2 text-right font-medium">Power</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">In use</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-edge/70">
                {visible.map((device) => {
                  const meta = categoryMeta(device.category);
                  const isCustom = customIds.has(device.id);
                  const isOverride = isCustom && BUILT_IN_IDS.has(device.id);
                  const placed = usage.get(device.id) ?? 0;

                  return (
                    <tr key={device.id} className="align-middle transition-colors hover:bg-surface-2/40">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={cx("h-6 w-1 shrink-0 rounded-full", meta.dot)} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-medium text-zinc-200">
                              {device.name}
                              {isOverride && <Badge tone="muted">edited</Badge>}
                              {isCustom && !isOverride && <Badge tone="muted">custom</Badge>}
                            </p>
                            <p className="truncate text-[0.68rem] text-zinc-500">
                              {device.vendor} · {meta.label}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-400">
                        {device.rackUnits}U{device.width === 0.5 ? " ½" : ""}
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-400">
                        {device.cores ? `${device.cores}c` : "—"}
                        {device.ramGb ? ` · ${device.ramGb}GB` : ""}
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-400">
                        {device.storageTb ? `${device.storageTb}TB` : "—"}
                        {device.driveBays ? ` · ${device.driveBays} bay` : ""}
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-400">
                        {device.ports ? `${device.ports}${device.portSpeed ? `×${device.portSpeed}G` : ""}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-400">
                        {device.powerIdleW}–{device.powerMaxW}W
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-300">
                        {formatCurrency(device.price, plan.settings.currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-400">{placed || "—"}</td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="sm" aria-label={`Edit ${device.name}`} onClick={() => setEditing(device)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" aria-label={`Duplicate ${device.name}`} onClick={() => cloneDevice(device)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          {isCustom && (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={isOverride ? `Reset ${device.name}` : `Delete ${device.name}`}
                              onClick={() => removeCustom(device)}
                            >
                              {isOverride ? <RotateCcw className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && (
        <DeviceForm
          device={editing}
          existingIds={devices.map((d) => d.id)}
          currency={plan.settings.currency}
          onClose={() => setEditing(null)}
          onSave={saveDevice}
        />
      )}
    </>
  );
}

function DeviceForm({
  device,
  existingIds,
  currency,
  onClose,
  onSave,
}: {
  device: Device;
  existingIds: string[];
  currency: string;
  onClose: () => void;
  onSave: (device: Device) => void;
}) {
  const [draft, setDraft] = useState<Device>({ ...device });
  const isNew = device.id === "";
  const isBuiltIn = BUILT_IN_IDS.has(device.id);

  const set = <K extends keyof Device>(key: K, value: Device[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const numeric = (value: string) => (value === "" ? undefined : Number(value));

  function handleSave() {
    const name = draft.name.trim();
    if (!name) return;

    let id = draft.id;
    if (!id) {
      const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "device";
      id = base;
      let suffix = 2;
      while (existingIds.includes(id)) id = `${base}-${suffix++}`;
    }

    onSave({
      ...draft,
      id,
      name,
      vendor: draft.vendor.trim() || "Custom",
      builtIn: false,
      rackUnits: Math.max(1, Math.round(draft.rackUnits || 1)),
      powerIdleW: Math.max(0, draft.powerIdleW || 0),
      powerMaxW: Math.max(draft.powerIdleW || 0, draft.powerMaxW || 0),
      price: Math.max(0, draft.price || 0),
    });
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={isNew ? "Add device" : `Edit ${device.name}`}
      description={
        isBuiltIn
          ? "Saving stores your version alongside the built-in one; you can reset it later."
          : "Only name is required — leave anything you do not know blank."
      }
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!draft.name.trim()}>
            Save device
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          {(id) => <TextInput id={id} value={draft.name} onChange={(e) => set("name", e.target.value)} autoFocus />}
        </Field>
        <Field label="Vendor">
          {(id) => <TextInput id={id} value={draft.vendor} onChange={(e) => set("vendor", e.target.value)} />}
        </Field>
        <Field label="Category">
          {(id) => (
            <Select id={id} value={draft.category} onChange={(e) => set("category", e.target.value as DeviceCategory)}>
              {DEVICE_CATEGORIES.map((meta) => (
                <option key={meta.id} value={meta.id}>
                  {meta.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Height (U)">
            {(id) => (
              <NumberInput id={id} min={1} max={12} value={draft.rackUnits} onChange={(e) => set("rackUnits", Number(e.target.value) || 1)} />
            )}
          </Field>
          <Field label="Width">
            {(id) => (
              <Select id={id} value={draft.width} onChange={(e) => set("width", Number(e.target.value) === 0.5 ? 0.5 : 1)}>
                <option value={1}>Full</option>
                <option value={0.5}>Half</option>
              </Select>
            )}
          </Field>
        </div>

        <Field label="CPU" className="sm:col-span-2">
          {(id) => <TextInput id={id} value={draft.cpu ?? ""} onChange={(e) => set("cpu", e.target.value || undefined)} placeholder="e.g. Ryzen 7 8845HS" />}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Cores">
            {(id) => <NumberInput id={id} min={0} value={draft.cores ?? ""} onChange={(e) => set("cores", numeric(e.target.value))} />}
          </Field>
          <Field label="Threads">
            {(id) => <NumberInput id={id} min={0} value={draft.threads ?? ""} onChange={(e) => set("threads", numeric(e.target.value))} />}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="RAM (GB)">
            {(id) => <NumberInput id={id} min={0} value={draft.ramGb ?? ""} onChange={(e) => set("ramGb", numeric(e.target.value))} />}
          </Field>
          <Field label="Max RAM (GB)">
            {(id) => <NumberInput id={id} min={0} value={draft.maxRamGb ?? ""} onChange={(e) => set("maxRamGb", numeric(e.target.value))} />}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Storage (TB)">
            {(id) => <NumberInput id={id} min={0} step="0.25" value={draft.storageTb ?? ""} onChange={(e) => set("storageTb", numeric(e.target.value))} />}
          </Field>
          <Field label="Drive bays">
            {(id) => <NumberInput id={id} min={0} value={draft.driveBays ?? ""} onChange={(e) => set("driveBays", numeric(e.target.value))} />}
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ports">
            {(id) => <NumberInput id={id} min={0} value={draft.ports ?? ""} onChange={(e) => set("ports", numeric(e.target.value))} />}
          </Field>
          <Field label="Port speed (Gb)">
            {(id) => <NumberInput id={id} min={0} step="0.5" value={draft.portSpeed ?? ""} onChange={(e) => set("portSpeed", numeric(e.target.value))} />}
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Idle power (W)">
            {(id) => <NumberInput id={id} min={0} value={draft.powerIdleW} onChange={(e) => set("powerIdleW", Number(e.target.value) || 0)} />}
          </Field>
          <Field label="Peak power (W)">
            {(id) => <NumberInput id={id} min={0} value={draft.powerMaxW} onChange={(e) => set("powerMaxW", Number(e.target.value) || 0)} />}
          </Field>
        </div>
        <Field label={`Price (${currency})`}>
          {(id) => <NumberInput id={id} min={0} value={draft.price} onChange={(e) => set("price", Number(e.target.value) || 0)} />}
        </Field>

        <Field label="Notes" className="sm:col-span-2">
          {(id) => <Textarea id={id} value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value || undefined)} />}
        </Field>
      </div>
    </Modal>
  );
}
