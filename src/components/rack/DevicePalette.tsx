"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { DEVICE_CATEGORIES, categoryMeta } from "@/lib/catalog/devices";
import { formatCurrency } from "@/lib/format";
import type { Device, DeviceCategory, Settings } from "@/lib/types";
import { Button, TextInput, cx } from "@/components/ui";
import type { DragPayload } from "./types";

export function DevicePalette({
  devices,
  currency,
  onDragStart,
  onDragEnd,
  onAdd,
  disabled,
}: {
  devices: Device[];
  currency: Settings["currency"];
  onDragStart: (payload: DragPayload) => void;
  onDragEnd: () => void;
  onAdd: (deviceId: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<DeviceCategory | "all">("all");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = devices.filter((device) => {
      if (category !== "all" && device.category !== category) return false;
      if (!needle) return true;
      return (
        device.name.toLowerCase().includes(needle) ||
        device.vendor.toLowerCase().includes(needle) ||
        (device.cpu ?? "").toLowerCase().includes(needle)
      );
    });

    return DEVICE_CATEGORIES.map((meta) => ({
      meta,
      devices: matches.filter((device) => device.category === meta.id),
    })).filter((group) => group.devices.length > 0);
  }, [devices, query, category]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-edge px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <TextInput
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search hardware…"
            className="pl-8"
            aria-label="Search hardware"
          />
        </div>
        <div className="scroll-slim flex gap-1 overflow-x-auto pb-1">
          <CategoryChip active={category === "all"} onClick={() => setCategory("all")} label="All" />
          {DEVICE_CATEGORIES.map((meta) => (
            <CategoryChip
              key={meta.id}
              active={category === meta.id}
              onClick={() => setCategory(meta.id)}
              label={meta.label}
              dot={meta.dot}
            />
          ))}
        </div>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {groups.length === 0 && (
          <p className="px-1 py-6 text-center text-xs text-zinc-500">
            Nothing matches. Add your own gear on the Hardware page.
          </p>
        )}
        {groups.map((group) => (
          <div key={group.meta.id} className="mb-4 last:mb-0">
            <h3 className="mb-1.5 flex items-center gap-1.5 px-0.5 text-[0.7rem] font-semibold uppercase tracking-wider text-zinc-500">
              <span className={cx("h-1.5 w-1.5 rounded-full", group.meta.dot)} />
              {group.meta.label}
            </h3>
            <ul className="space-y-1">
              {group.devices.map((device) => (
                <li key={device.id}>
                  <PaletteEntry
                    device={device}
                    currency={currency}
                    disabled={disabled}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onAdd={onAdd}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[0.7rem] font-medium transition-colors",
        active
          ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-300"
          : "border-edge-strong bg-surface-2 text-zinc-400 hover:text-zinc-100",
      )}
    >
      {dot && <span className={cx("h-1.5 w-1.5 rounded-full", dot)} />}
      {label}
    </button>
  );
}

function PaletteEntry({
  device,
  currency,
  disabled,
  onDragStart,
  onDragEnd,
  onAdd,
}: {
  device: Device;
  currency: Settings["currency"];
  disabled: boolean;
  onDragStart: (payload: DragPayload) => void;
  onDragEnd: () => void;
  onAdd: (deviceId: string) => void;
}) {
  const meta = categoryMeta(device.category);

  return (
    <div
      draggable={!disabled}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "copy";
        event.dataTransfer.setData("text/plain", device.id);
        onDragStart({ kind: "new", deviceId: device.id });
      }}
      onDragEnd={onDragEnd}
      className={cx(
        "group flex items-center gap-2 rounded-lg border border-edge-strong bg-surface-2/70 px-2 py-1.5",
        "transition-colors hover:border-emerald-400/40 hover:bg-surface-2",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing",
      )}
      title={`${device.vendor} ${device.name}${device.notes ? ` — ${device.notes}` : ""}`}
    >
      <span className={cx("h-6 w-1 shrink-0 rounded-full", meta.dot)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-zinc-200">{device.name}</p>
        <p className="truncate font-mono text-[0.68rem] text-zinc-500">
          {device.rackUnits}U{device.width === 0.5 ? " ½" : ""} · {device.powerIdleW}–{device.powerMaxW}W ·{" "}
          {formatCurrency(device.price, currency)}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => onAdd(device.id)}
        aria-label={`Add ${device.name} to the rack`}
        className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
