"use client";

import { AlertTriangle, Copy, Trash2 } from "lucide-react";
import { categoryMeta } from "@/lib/catalog/devices";
import { formatCurrency, formatWatts } from "@/lib/format";
import { computePower, itemSide, itemSpan, usedUnits } from "@/lib/selectors";
import type { Device, Rack, RackItem, Settings } from "@/lib/types";
import { Button, cx } from "@/components/ui";
import { U_HEIGHT, type DragPayload, type DropPreview } from "./types";

export function RackColumn({
  rack,
  devices,
  settings,
  active,
  selectedItemId,
  preview,
  dragKind,
  onActivate,
  onSelectItem,
  onDragStartItem,
  onDragEnd,
  onHoverSlot,
  onLeave,
  onDropSlot,
  onDuplicate,
  onDelete,
}: {
  rack: Rack;
  devices: Map<string, Device>;
  settings: Settings;
  active: boolean;
  selectedItemId: string | null;
  preview: DropPreview | null;
  /** What is in flight, so the drop effect matches what the source allows. */
  dragKind: DragPayload["kind"] | null;
  onActivate: () => void;
  onSelectItem: (itemId: string | null) => void;
  onDragStartItem: (payload: DragPayload) => void;
  onDragEnd: () => void;
  onHoverSlot: (rackId: string, u: number, side: "left" | "right") => void;
  onLeave: () => void;
  onDropSlot: (rackId: string, u: number, side: "left" | "right") => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const units = Array.from({ length: rack.heightU }, (_, index) => rack.heightU - index);

  let idleW = 0;
  let maxW = 0;
  let hardware = 0;
  for (const item of rack.items) {
    const device = devices.get(item.deviceId);
    if (!device) continue;
    idleW += device.powerIdleW;
    maxW += device.powerMaxW;
    hardware += device.price;
  }
  const power = computePower({ idleW, maxW }, settings);
  const used = usedUnits(rack, devices);
  const free = rack.heightU - used;

  const activePreview = preview?.rackId === rack.id ? preview : null;

  return (
    <section
      onClick={onActivate}
      className={cx(
        "w-[340px] shrink-0 rounded-xl border bg-surface/80 transition-colors",
        active ? "border-emerald-400/50 ring-1 ring-emerald-400/20" : "border-edge",
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-edge px-3 py-2.5">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-zinc-100">{rack.name}</h3>
          <p className="font-mono text-[0.68rem] text-zinc-500">
            {rack.heightU}U · {free.toFixed(free % 1 === 0 ? 0 : 1)}U free
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onDuplicate} aria-label={`Duplicate ${rack.name}`}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Delete ${rack.name}`}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex px-3 py-3" onDragLeave={onLeave}>
        {/* U numbers, counting down from the top like a real elevation. */}
        <div className="w-6 shrink-0 select-none">
          {units.map((u) => (
            <div
              key={u}
              style={{ height: U_HEIGHT }}
              className="flex items-center justify-end pr-1.5 font-mono text-[0.6rem] leading-none text-zinc-600"
            >
              {u}
            </div>
          ))}
        </div>

        <div
          className="relative flex-1 rounded-md border-x-4 border-y border-edge-strong bg-canvas/60"
          style={{ height: rack.heightU * U_HEIGHT }}
        >
          {/* Empty slots: every U split left/right so half-width gear can pair up. */}
          {units.map((u) => (
            <div
              key={u}
              className="absolute inset-x-0 flex border-b border-dashed border-edge/70 last:border-b-0"
              style={{ bottom: (u - 1) * U_HEIGHT, height: U_HEIGHT }}
            >
              {(["left", "right"] as const).map((side) => (
                <div
                  key={side}
                  className="h-full flex-1"
                  onDragEnter={(event) => event.preventDefault()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    // Must agree with the source's effectAllowed or Chrome
                    // refuses the drop without telling anyone.
                    event.dataTransfer.dropEffect = dragKind === "new" ? "copy" : "move";
                    onHoverSlot(rack.id, u, side);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    onDropSlot(rack.id, u, side);
                  }}
                />
              ))}
            </div>
          ))}

          {/* Ghost of where the dragged device would land. */}
          {activePreview && (
            <div
              className={cx(
                "pointer-events-none absolute z-10 rounded-md border-2 border-dashed",
                activePreview.valid
                  ? "border-emerald-400/80 bg-emerald-400/10"
                  : "border-rose-400/80 bg-rose-400/10",
              )}
              style={{
                bottom: (activePreview.startU - 1) * U_HEIGHT + 1,
                height: activePreview.height * U_HEIGHT - 2,
                left: activePreview.full || activePreview.side === "left" ? 2 : "50%",
                right: activePreview.full || activePreview.side === "right" ? 2 : "50%",
              }}
            />
          )}

          {rack.items.map((item) => (
            <PlacedItem
              key={item.id}
              item={item}
              device={devices.get(item.deviceId)}
              rack={rack}
              selected={item.id === selectedItemId}
              dragging={dragKind !== null}
              onSelect={() => onSelectItem(item.id)}
              onDragStart={() =>
                onDragStartItem({ kind: "move", itemId: item.id, rackId: rack.id, deviceId: item.deviceId })
              }
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      </div>

      <footer className="grid grid-cols-3 gap-2 border-t border-edge px-3 py-2.5 text-center">
        <Metric label="Typical" value={formatWatts(power.averageW)} />
        <Metric label="Peak" value={formatWatts(power.maxW)} />
        <Metric label="Hardware" value={formatCurrency(hardware, settings.currency)} />
      </footer>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.6rem] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="font-mono text-xs font-medium text-zinc-200">{value}</p>
    </div>
  );
}

function PlacedItem({
  item,
  device,
  rack,
  selected,
  dragging,
  onSelect,
  onDragStart,
  onDragEnd,
}: {
  item: RackItem;
  device: Device | undefined;
  rack: Rack;
  selected: boolean;
  dragging: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const span = itemSpan(item, device);
  const side = itemSide(item, device);
  const meta = device ? categoryMeta(device.category) : null;
  const label = item.label?.trim() || device?.name || "Unknown device";
  const outOfBounds = span.to > rack.heightU;

  return (
    <button
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", item.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      title={device ? `${device.vendor} ${device.name} · ${device.rackUnits}U · ${device.powerIdleW}–${device.powerMaxW}W` : label}
      style={{
        bottom: (span.from - 1) * U_HEIGHT + 1,
        height: span.height * U_HEIGHT - 2,
        left: side === "right" ? "50%" : 2,
        right: side === "left" ? "50%" : 2,
      }}
      className={cx(
        "absolute z-20 flex flex-col justify-center overflow-hidden rounded-md border px-2 text-left",
        "cursor-grab transition-shadow active:cursor-grabbing",
        meta?.block ?? "border-edge-strong bg-surface-2 text-zinc-300",
        selected && "ring-2 ring-emerald-300 ring-offset-1 ring-offset-canvas",
        outOfBounds && "border-rose-400 ring-2 ring-rose-400/60",
        // Let the drag pass through to the slots underneath so the drop
        // preview keeps updating over occupied space.
        dragging && "pointer-events-none",
      )}
    >
      <span className="flex items-center gap-1 truncate text-[0.7rem] font-semibold leading-tight">
        {outOfBounds && <AlertTriangle className="h-3 w-3 shrink-0 text-rose-300" />}
        {label}
      </span>
      {span.height > 1 && device && (
        <span className="truncate font-mono text-[0.6rem] leading-tight opacity-70">
          {device.vendor} · {device.powerIdleW}–{device.powerMaxW}W
        </span>
      )}
    </button>
  );
}
