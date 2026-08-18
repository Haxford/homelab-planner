import { BUILT_IN_DEVICES } from "@/lib/catalog/devices";
import { BUILT_IN_SERVICES } from "@/lib/catalog/services";
import { HOST_CATEGORIES } from "@/lib/catalog/devices";
import type { Device, Plan, Rack, RackItem, Service } from "@/lib/types";

/** Built-in catalogue plus the user's own entries, user entries winning on id. */
export function mergeDevices(custom: Device[]): Device[] {
  const byId = new Map(BUILT_IN_DEVICES.map((device) => [device.id, device]));
  for (const device of custom) byId.set(device.id, device);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeServices(custom: Service[]): Service[] {
  const byId = new Map(BUILT_IN_SERVICES.map((service) => [service.id, service]));
  for (const service of custom) byId.set(service.id, service);
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

// --------------------------------------------------------------- placement

/** The rack units an item occupies, given the device it refers to. */
export function itemSpan(item: RackItem, device: Device | undefined) {
  const height = Math.max(1, device?.rackUnits ?? 1);
  return { from: item.startU, to: item.startU + height - 1, height };
}

export function itemSide(item: RackItem, device: Device | undefined): "left" | "right" | "full" {
  if (!device || device.width === 1) return "full";
  return item.side ?? "left";
}

function overlaps(aFrom: number, aTo: number, bFrom: number, bTo: number) {
  return aFrom <= bTo && bFrom <= aTo;
}

/**
 * Whether a device fits at startU: inside the rack, and not colliding with
 * anything already there. Half-width gear may share a U with the other side.
 */
export function canPlace(
  rack: Rack,
  devices: Map<string, Device>,
  device: Device,
  startU: number,
  side: "left" | "right",
  ignoreItemId?: string,
): boolean {
  const height = Math.max(1, device.rackUnits);
  const to = startU + height - 1;
  if (startU < 1 || to > rack.heightU) return false;

  const wantSide = device.width === 1 ? "full" : side;

  return !rack.items.some((item) => {
    if (item.id === ignoreItemId) return false;
    const other = devices.get(item.deviceId);
    const otherSpan = itemSpan(item, other);
    if (!overlaps(startU, to, otherSpan.from, otherSpan.to)) return false;
    const otherSide = itemSide(item, other);
    // Full-width blocks the whole U; two half-width items coexist only on
    // opposite sides.
    if (wantSide === "full" || otherSide === "full") return true;
    return wantSide === otherSide;
  });
}

/** Lowest position the device fits at, or null when the rack is full. */
export function findFreeSlot(
  rack: Rack,
  devices: Map<string, Device>,
  device: Device,
): { startU: number; side: "left" | "right" } | null {
  const sides: ("left" | "right")[] = device.width === 1 ? ["left"] : ["left", "right"];
  for (let startU = 1; startU + Math.max(1, device.rackUnits) - 1 <= rack.heightU; startU += 1) {
    for (const side of sides) {
      if (canPlace(rack, devices, device, startU, side)) return { startU, side };
    }
  }
  return null;
}

export function usedUnits(rack: Rack, devices: Map<string, Device>): number {
  const occupied = new Set<string>();
  for (const item of rack.items) {
    const device = devices.get(item.deviceId);
    const { from, to } = itemSpan(item, device);
    const side = itemSide(item, device);
    for (let u = from; u <= to; u += 1) {
      if (side === "full") {
        occupied.add(`${u}:left`);
        occupied.add(`${u}:right`);
      } else {
        occupied.add(`${u}:${side}`);
      }
    }
  }
  // Two half-slots make one full U.
  return occupied.size / 2;
}

// ------------------------------------------------------------------ totals

export interface PowerCost {
  idleW: number;
  maxW: number;
  /** Idle plus load factor of the idle-to-max range. */
  averageW: number;
  kwhPerYear: number;
  costPerYear: number;
  costPerMonth: number;
}

export function computePower(watts: { idleW: number; maxW: number }, settings: Plan["settings"]): PowerCost {
  const averageW = watts.idleW + (watts.maxW - watts.idleW) * settings.loadFactor;
  const kwhPerYear = (averageW / 1000) * settings.hoursPerDay * 365;
  const costPerYear = kwhPerYear * settings.kwhRate;
  return {
    idleW: watts.idleW,
    maxW: watts.maxW,
    averageW,
    kwhPerYear,
    costPerYear,
    costPerMonth: costPerYear / 12,
  };
}

export interface PlanTotals {
  rackCount: number;
  deviceCount: number;
  usedU: number;
  totalU: number;
  hardwareCost: number;
  rackCost: number;
  wishlistCost: number;
  wishlistOutstanding: number;
  capex: number;
  power: PowerCost;
  cores: number;
  ramGb: number;
  storageTb: number;
}

export function computeTotals(plan: Plan, devices: Map<string, Device>): PlanTotals {
  let deviceCount = 0;
  let usedU = 0;
  let totalU = 0;
  let hardwareCost = 0;
  let rackCost = 0;
  let idleW = 0;
  let maxW = 0;
  let cores = 0;
  let ramGb = 0;
  let storageTb = 0;

  for (const rack of plan.racks) {
    totalU += rack.heightU;
    rackCost += rack.price ?? 0;
    usedU += usedUnits(rack, devices);
    for (const item of rack.items) {
      const device = devices.get(item.deviceId);
      if (!device) continue;
      deviceCount += 1;
      hardwareCost += device.price;
      idleW += device.powerIdleW;
      maxW += device.powerMaxW;
      if (HOST_CATEGORIES.includes(device.category)) {
        cores += device.cores ?? 0;
        ramGb += device.ramGb ?? 0;
      }
      storageTb += device.storageTb ?? 0;
    }
  }

  const wishlistCost = plan.wishlist.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const wishlistOutstanding = plan.wishlist
    .filter((item) => !item.purchased)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    rackCount: plan.racks.length,
    deviceCount,
    usedU,
    totalU,
    hardwareCost,
    rackCost,
    wishlistCost,
    wishlistOutstanding,
    capex: hardwareCost + rackCost + wishlistCost,
    power: computePower({ idleW, maxW }, plan.settings),
    cores,
    ramGb,
    storageTb,
  };
}

// ------------------------------------------------------------ resource fit

export interface HostUsage {
  itemId: string;
  rackId: string;
  rackName: string;
  label: string;
  device: Device;
  capacity: { cores: number; ramGb: number; storageGb: number };
  used: { cores: number; ramGb: number; storageGb: number };
  services: { instanceId: string; service: Service; label: string }[];
  /** Worst utilisation across the three dimensions, as a fraction. */
  worst: number;
  status: "ok" | "tight" | "over";
}

export function hostStatus(worst: number): HostUsage["status"] {
  if (worst > 1) return "over";
  if (worst >= 0.75) return "tight";
  return "ok";
}

/** Every rack item that can run services, with what has been assigned to it. */
export function computeHostUsage(
  plan: Plan,
  devices: Map<string, Device>,
  services: Map<string, Service>,
): HostUsage[] {
  const hosts: HostUsage[] = [];

  for (const rack of plan.racks) {
    for (const item of rack.items) {
      const device = devices.get(item.deviceId);
      if (!device || !HOST_CATEGORIES.includes(device.category)) continue;

      const assigned = plan.serviceInstances.filter((instance) => instance.hostItemId === item.id);
      const used = { cores: 0, ramGb: 0, storageGb: 0 };
      const serviceRows: HostUsage["services"] = [];

      for (const instance of assigned) {
        const service = services.get(instance.serviceId);
        if (!service) continue;
        used.cores += service.cpuCores;
        used.ramGb += service.ramGb;
        used.storageGb += service.storageGb;
        serviceRows.push({
          instanceId: instance.id,
          service,
          label: instance.label?.trim() || service.name,
        });
      }

      const capacity = {
        cores: device.cores ?? 0,
        ramGb: device.ramGb ?? 0,
        storageGb: (device.storageTb ?? 0) * 1000,
      };

      const ratios = [
        capacity.cores > 0 ? used.cores / capacity.cores : used.cores > 0 ? Infinity : 0,
        capacity.ramGb > 0 ? used.ramGb / capacity.ramGb : used.ramGb > 0 ? Infinity : 0,
        capacity.storageGb > 0 ? used.storageGb / capacity.storageGb : used.storageGb > 0 ? Infinity : 0,
      ];
      const worst = Math.max(...ratios);

      hosts.push({
        itemId: item.id,
        rackId: rack.id,
        rackName: rack.name,
        label: item.label?.trim() || device.name,
        device,
        capacity,
        used,
        services: serviceRows,
        worst,
        status: hostStatus(worst),
      });
    }
  }

  return hosts;
}

/** Flattened view of every placed item, handy for pickers and tables. */
export function allRackItems(plan: Plan, devices: Map<string, Device>) {
  return plan.racks.flatMap((rack) =>
    rack.items.map((item) => ({
      item,
      rack,
      device: devices.get(item.deviceId),
      label: item.label?.trim() || devices.get(item.deviceId)?.name || "Unknown device",
    })),
  );
}

// ---------------------------------------------------------------- networking

/** Usable host addresses in a CIDR block, or null if it cannot be parsed. */
export function parseCidr(cidr: string): { prefix: number; hosts: number; network: string } | null {
  const match = /^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/.exec(cidr.trim());
  if (!match) return null;
  const octets = match[1].split(".").map(Number);
  if (octets.some((octet) => octet > 255)) return null;
  const prefix = Number(match[2]);
  if (prefix < 0 || prefix > 32) return null;
  const total = 2 ** (32 - prefix);
  return { prefix, hosts: prefix >= 31 ? total : Math.max(0, total - 2), network: match[1] };
}

export function ipInSubnet(ip: string, cidr: string): boolean {
  const parsed = parseCidr(cidr);
  if (!parsed) return false;
  const toInt = (value: string) => {
    const parts = value.split(".").map(Number);
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return null;
    return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
  };
  const ipInt = toInt(ip);
  const netInt = toInt(parsed.network);
  if (ipInt === null || netInt === null) return false;
  const mask = parsed.prefix === 0 ? 0 : (0xffffffff << (32 - parsed.prefix)) >>> 0;
  return (ipInt & mask) === (netInt & mask);
}
