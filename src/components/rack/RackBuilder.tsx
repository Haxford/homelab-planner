"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Plus, Server } from "lucide-react";
import { RACK_PRESETS } from "@/lib/catalog/racks";
import { newId } from "@/lib/id";
import {
  canPlace,
  findFreeSlot,
  indexById,
  mergeDevices,
  mergeServices,
} from "@/lib/selectors";
import { usePlan } from "@/lib/store";
import type { Plan, Rack, RackItem } from "@/lib/types";
import { Button, EmptyState, Modal, PageHeader, Select, cx } from "@/components/ui";
import { DevicePalette } from "./DevicePalette";
import { Inspector } from "./Inspector";
import { RackColumn } from "./RackColumn";
import type { DragPayload, DropPreview } from "./types";

export function RackBuilder() {
  const { plan, setPlan } = usePlan();
  const devices = useMemo(() => mergeDevices(plan.customDevices), [plan.customDevices]);
  const deviceMap = useMemo(() => indexById(devices), [devices]);
  const services = useMemo(() => mergeServices(plan.customServices), [plan.customServices]);

  const [activeRackId, setActiveRackId] = useState<string | null>(plan.racks[0]?.id ?? null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [preview, setPreview] = useState<DropPreview | null>(null);
  const [dragKind, setDragKind] = useState<DragPayload["kind"] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [addRackOpen, setAddRackOpen] = useState(false);

  // Read synchronously inside dragover handlers, where state would lag.
  const dragPayload = useRef<DragPayload | null>(null);

  const activeRack =
    plan.racks.find((rack) => rack.id === activeRackId) ?? plan.racks[0] ?? null;

  const selected = useMemo(
    () =>
      plan.racks
        .flatMap((rack) => rack.items.map((item) => ({ rack, item })))
        .find((entry) => entry.item.id === selectedItemId) ?? null,
    [plan.racks, selectedItemId],
  );

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 3500);
  }, []);

  const updateRack = useCallback(
    (rackId: string, updater: (rack: Rack) => Rack) => {
      setPlan((previous) => ({
        ...previous,
        racks: previous.racks.map((rack) => (rack.id === rackId ? updater(rack) : rack)),
      }));
    },
    [setPlan],
  );

  /**
   * Where a device dropped on unit `u` should actually sit: tall devices
   * dropped near the ceiling slide down so they stay inside the rack.
   */
  const resolveDrop = useCallback(
    (rack: Rack, deviceId: string, u: number, side: "left" | "right", ignoreItemId?: string): DropPreview => {
      const device = deviceMap.get(deviceId);
      const height = Math.max(1, device?.rackUnits ?? 1);
      const startU = Math.max(1, Math.min(u, rack.heightU - height + 1));
      return {
        rackId: rack.id,
        startU,
        side,
        height,
        full: device?.width !== 0.5,
        valid: device ? canPlace(rack, deviceMap, device, startU, side, ignoreItemId) : false,
      };
    },
    [deviceMap],
  );

  const handleHoverSlot = useCallback(
    (rackId: string, u: number, side: "left" | "right") => {
      const payload = dragPayload.current;
      const rack = plan.racks.find((candidate) => candidate.id === rackId);
      if (!payload || !rack) return;
      const ignore = payload.kind === "move" ? payload.itemId : undefined;
      setPreview(resolveDrop(rack, payload.deviceId, u, side, ignore));
    },
    [plan.racks, resolveDrop],
  );

  const endDrag = useCallback(() => {
    dragPayload.current = null;
    setPreview(null);
    setDragKind(null);
  }, []);

  const handleDropSlot = useCallback(
    (rackId: string, u: number, side: "left" | "right") => {
      const payload = dragPayload.current;
      const rack = plan.racks.find((candidate) => candidate.id === rackId);
      if (!payload || !rack) return endDrag();

      const ignore = payload.kind === "move" ? payload.itemId : undefined;
      const target = resolveDrop(rack, payload.deviceId, u, side, ignore);

      if (!target.valid) {
        flash("That spot is taken — drop it on a free slot.");
        return endDrag();
      }

      if (payload.kind === "new") {
        const item: RackItem = {
          id: newId("item"),
          deviceId: payload.deviceId,
          startU: target.startU,
          side,
        };
        updateRack(rack.id, (current) => ({ ...current, items: [...current.items, item] }));
        setSelectedItemId(item.id);
      } else {
        const moved = payload;
        setPlan((previous) => {
          const source = previous.racks.find((candidate) => candidate.id === moved.rackId);
          const original = source?.items.find((candidate) => candidate.id === moved.itemId);
          if (!original) return previous;
          const relocated: RackItem = { ...original, startU: target.startU, side };
          return {
            ...previous,
            racks: previous.racks.map((candidate) => {
              // Moving between racks removes it from one and adds it to the other.
              const withoutItem = candidate.items.filter((entry) => entry.id !== moved.itemId);
              if (candidate.id === rack.id) return { ...candidate, items: [...withoutItem, relocated] };
              if (candidate.id === moved.rackId) return { ...candidate, items: withoutItem };
              return candidate;
            }),
          };
        });
        setActiveRackId(rack.id);
      }

      endDrag();
    },
    [plan.racks, resolveDrop, updateRack, setPlan, endDrag, flash],
  );

  /** Click-to-add: drop it in the lowest free slot of the active rack. */
  const addDeviceToActiveRack = useCallback(
    (deviceId: string) => {
      if (!activeRack) return;
      const device = deviceMap.get(deviceId);
      if (!device) return;
      const slot = findFreeSlot(activeRack, deviceMap, device);
      if (!slot) {
        flash(`No free ${device.rackUnits}U slot in ${activeRack.name}.`);
        return;
      }
      const item: RackItem = { id: newId("item"), deviceId, startU: slot.startU, side: slot.side };
      updateRack(activeRack.id, (rack) => ({ ...rack, items: [...rack.items, item] }));
      setSelectedItemId(item.id);
    },
    [activeRack, deviceMap, updateRack, flash],
  );

  const moveSelected = useCallback(
    (delta: number) => {
      if (!selected) return;
      const device = deviceMap.get(selected.item.deviceId);
      if (!device) return;
      const side = device.width === 0.5 ? selected.item.side ?? "left" : "left";
      const target = selected.item.startU + delta;
      if (!canPlace(selected.rack, deviceMap, device, target, side, selected.item.id)) {
        flash(delta > 0 ? "Blocked above." : "Blocked below.");
        return;
      }
      updateRack(selected.rack.id, (rack) => ({
        ...rack,
        items: rack.items.map((item) =>
          item.id === selected.item.id ? { ...item, startU: target } : item,
        ),
      }));
    },
    [selected, deviceMap, updateRack, flash],
  );

  const flipSide = useCallback(() => {
    if (!selected) return;
    const device = deviceMap.get(selected.item.deviceId);
    if (!device || device.width !== 0.5) return;
    const side = (selected.item.side ?? "left") === "left" ? "right" : "left";
    if (!canPlace(selected.rack, deviceMap, device, selected.item.startU, side, selected.item.id)) {
      flash("The other side is occupied.");
      return;
    }
    updateRack(selected.rack.id, (rack) => ({
      ...rack,
      items: rack.items.map((item) => (item.id === selected.item.id ? { ...item, side } : item)),
    }));
  }, [selected, deviceMap, updateRack, flash]);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    const removedId = selected.item.id;
    setPlan((previous) => ({
      ...previous,
      racks: previous.racks.map((rack) => ({
        ...rack,
        items: rack.items.filter((item) => item.id !== removedId),
      })),
      // Services and reservations outlive the hardware, they just lose their home.
      serviceInstances: previous.serviceInstances.map((instance) =>
        instance.hostItemId === removedId ? { ...instance, hostItemId: null } : instance,
      ),
      reservations: previous.reservations.map((reservation) =>
        reservation.rackItemId === removedId ? { ...reservation, rackItemId: null } : reservation,
      ),
    }));
    setSelectedItemId(null);
  }, [selected, setPlan]);

  const addRack = useCallback(
    (presetId: string) => {
      const preset = RACK_PRESETS.find((entry) => entry.id === presetId) ?? RACK_PRESETS[0];
      const rack: Rack = {
        id: newId("rack"),
        name: preset.name,
        heightU: preset.heightU,
        price: preset.price,
        notes: preset.notes,
        items: [],
      };
      setPlan((previous) => ({ ...previous, racks: [...previous.racks, rack] }));
      setActiveRackId(rack.id);
      setAddRackOpen(false);
    },
    [setPlan],
  );

  const duplicateRack = useCallback(
    (rackId: string) => {
      setPlan((previous) => {
        const source = previous.racks.find((rack) => rack.id === rackId);
        if (!source) return previous;
        const copy: Rack = {
          ...source,
          id: newId("rack"),
          name: `${source.name} (copy)`,
          items: source.items.map((item) => ({ ...item, id: newId("item") })),
        };
        return { ...previous, racks: [...previous.racks, copy] };
      });
    },
    [setPlan],
  );

  const deleteRack = useCallback(
    (rackId: string) => {
      setPlan((previous: Plan) => {
        const doomed = previous.racks.find((rack) => rack.id === rackId);
        const orphanIds = new Set(doomed?.items.map((item) => item.id) ?? []);
        return {
          ...previous,
          racks: previous.racks.filter((rack) => rack.id !== rackId),
          serviceInstances: previous.serviceInstances.map((instance) =>
            instance.hostItemId && orphanIds.has(instance.hostItemId)
              ? { ...instance, hostItemId: null }
              : instance,
          ),
          reservations: previous.reservations.map((reservation) =>
            reservation.rackItemId && orphanIds.has(reservation.rackItemId)
              ? { ...reservation, rackItemId: null }
              : reservation,
          ),
        };
      });
      setSelectedItemId(null);
    },
    [setPlan],
  );

  const assignService = useCallback(
    (serviceId: string) => {
      if (!selected) return;
      setPlan((previous) => ({
        ...previous,
        serviceInstances: [
          ...previous.serviceInstances,
          { id: newId("svc"), serviceId, hostItemId: selected.item.id },
        ],
      }));
    },
    [selected, setPlan],
  );

  const unassignService = useCallback(
    (instanceId: string) => {
      setPlan((previous) => ({
        ...previous,
        serviceInstances: previous.serviceInstances.filter((instance) => instance.id !== instanceId),
      }));
    },
    [setPlan],
  );

  const selectedInstances = useMemo(
    () => (selected ? plan.serviceInstances.filter((i) => i.hostItemId === selected.item.id) : []),
    [plan.serviceInstances, selected],
  );

  return (
    <>
      <PageHeader
        title="Rack builder"
        description="Drag hardware from the palette into a rack, or press + to drop it in the lowest free slot. Half-width gear pairs up two to a U."
        actions={
          <Button variant="primary" onClick={() => setAddRackOpen(true)}>
            <Plus className="h-4 w-4" />
            Add rack
          </Button>
        }
      />

      {notice && (
        <div className="mb-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {notice}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_19rem]">
        <div className="order-2 min-w-0 rounded-xl border border-edge bg-surface/80 xl:order-1 xl:max-h-[calc(100vh-11rem)] xl:sticky xl:top-24">
          <DevicePalette
            devices={devices}
            currency={plan.settings.currency}
            disabled={!activeRack}
            onDragStart={(payload) => {
              dragPayload.current = payload;
              setDragKind(payload.kind);
            }}
            onDragEnd={endDrag}
            onAdd={addDeviceToActiveRack}
          />
        </div>

        <div className="order-1 min-w-0 xl:order-2">
          {plan.racks.length === 0 ? (
            <EmptyState
              icon={<Server className="h-8 w-8" />}
              title="No racks yet"
              description="Start with a cabinet size — you can change the height later, and nothing is lost if you resize."
              action={
                <Button variant="primary" onClick={() => setAddRackOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add your first rack
                </Button>
              }
            />
          ) : (
            <div className="scroll-slim flex gap-4 overflow-x-auto pb-3">
              {plan.racks.map((rack) => (
                <RackColumn
                  key={rack.id}
                  rack={rack}
                  devices={deviceMap}
                  settings={plan.settings}
                  active={rack.id === activeRack?.id}
                  selectedItemId={selectedItemId}
                  preview={preview}
                  dragKind={dragKind}
                  onActivate={() => {
                    setActiveRackId(rack.id);
                    setSelectedItemId(null);
                  }}
                  onSelectItem={(itemId) => {
                    setActiveRackId(rack.id);
                    setSelectedItemId(itemId);
                  }}
                  onDragStartItem={(payload) => {
                    dragPayload.current = payload;
                    setDragKind(payload.kind);
                  }}
                  onDragEnd={endDrag}
                  onHoverSlot={handleHoverSlot}
                  onLeave={() => setPreview(null)}
                  onDropSlot={handleDropSlot}
                  onDuplicate={() => duplicateRack(rack.id)}
                  onDelete={() => deleteRack(rack.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className={cx(
            // min-w-0 lets the inner scroll containers actually scroll instead
            // of stretching this grid column past the viewport.
            "order-3 min-w-0 rounded-xl border border-edge bg-surface/80",
            "xl:sticky xl:top-24 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto scroll-slim",
          )}
        >
          <Inspector
            rack={activeRack}
            item={selected?.item ?? null}
            device={selected ? deviceMap.get(selected.item.deviceId) : undefined}
            settings={plan.settings}
            services={services}
            instances={selectedInstances}
            onUpdateItem={(patch) => {
              if (!selected) return;
              updateRack(selected.rack.id, (rack) => ({
                ...rack,
                items: rack.items.map((item) =>
                  item.id === selected.item.id ? { ...item, ...patch } : item,
                ),
              }));
            }}
            onRemoveItem={removeSelected}
            onMove={moveSelected}
            onFlipSide={flipSide}
            onUpdateRack={(patch) => activeRack && updateRack(activeRack.id, (rack) => ({ ...rack, ...patch }))}
            onAssignService={assignService}
            onUnassignService={unassignService}
          />
        </div>
      </div>

      <AddRackModal open={addRackOpen} onClose={() => setAddRackOpen(false)} onAdd={addRack} />
    </>
  );
}

function AddRackModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (presetId: string) => void;
}) {
  const [presetId, setPresetId] = useState(RACK_PRESETS[3].id);
  const preset = RACK_PRESETS.find((entry) => entry.id === presetId) ?? RACK_PRESETS[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a rack"
      description="Pick a size to start from. Name, height and price are all editable afterwards."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onAdd(presetId)}>
            Add rack
          </Button>
        </>
      }
    >
      <Select value={presetId} onChange={(event) => setPresetId(event.target.value)} aria-label="Rack size">
        {RACK_PRESETS.map((entry) => (
          <option key={entry.id} value={entry.id}>
            {entry.name}
          </option>
        ))}
      </Select>
      <p className="mt-3 text-xs leading-relaxed text-zinc-400">{preset.notes}</p>
    </Modal>
  );
}
