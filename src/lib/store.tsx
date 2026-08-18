"use client";

import { useSyncExternalStore } from "react";
import type { Plan, Settings } from "@/lib/types";
import { newId } from "@/lib/id";

const STORAGE_KEY = "homelab-planner.plan";
export const PLAN_VERSION = 1;

const DEFAULT_SETTINGS: Settings = {
  currency: "GBP",
  kwhRate: 0.25,
  hoursPerDay: 24,
  loadFactor: 0.35,
};

/**
 * A small worked example so a first-time visitor lands on something real
 * rather than an empty grid. Cleared by "Start empty plan" in Settings.
 */
export function createStarterPlan(): Plan {
  // Ids are literals rather than generated, so the plan rendered on the server
  // is byte-identical to the one React hydrates on the client.
  return {
    version: PLAN_VERSION,
    name: "My homelab",
    settings: { ...DEFAULT_SETTINGS },
    racks: [
      {
        id: "rack_hall",
        name: "Hall cupboard",
        heightU: 12,
        price: 160,
        notes: "Wall-mounted, 450mm deep — nothing full-depth fits.",
        items: [
          { id: "item_patch", deviceId: "patch-panel-24", startU: 12 },
          { id: "item_switch", deviceId: "mikrotik-crs326", startU: 11 },
          { id: "item_gateway", deviceId: "unifi-udm-pro", startU: 10, label: "gw-01" },
          { id: "item_blank", deviceId: "blank-1u", startU: 9 },
          { id: "item_shelf", deviceId: "shelf-1u", startU: 8 },
          { id: "item_prox", deviceId: "minisforum-ms01", startU: 7, side: "left", label: "prox-01" },
          { id: "item_pi", deviceId: "raspberry-pi-5", startU: 7, side: "right", label: "pi-dns" },
          { id: "item_nas", deviceId: "synology-ds923", startU: 5, side: "left", label: "nas-01" },
          { id: "item_ups", deviceId: "apc-backups-850", startU: 1, side: "left" },
        ],
      },
    ],
    customDevices: [],
    customServices: [],
    serviceInstances: [
      // Sized to leave headroom on every host — the point of the example is to
      // show what a plan that fits looks like.
      { id: "svc_proxmox", serviceId: "proxmox", hostItemId: "item_prox" },
      { id: "svc_docker", serviceId: "docker", hostItemId: "item_prox" },
      { id: "svc_jellyfin", serviceId: "jellyfin", hostItemId: "item_prox" },
      { id: "svc_ha", serviceId: "home-assistant", hostItemId: "item_prox" },
      { id: "svc_npm", serviceId: "npm", hostItemId: "item_prox" },
      { id: "svc_immich", serviceId: "immich", hostItemId: "item_prox" },
      { id: "svc_pihole", serviceId: "pihole", hostItemId: "item_pi" },
      { id: "svc_duplicati", serviceId: "duplicati", hostItemId: "item_nas" },
      { id: "svc_syncthing", serviceId: "syncthing", hostItemId: "item_nas" },
      { id: "svc_kuma", serviceId: "uptime-kuma", hostItemId: null },
    ],
    subnets: [
      { id: "net_lan", name: "LAN", cidr: "192.168.1.0/24", vlanId: 1, gateway: "192.168.1.1", notes: "Trusted devices." },
      { id: "net_iot", name: "IoT", cidr: "192.168.30.0/24", vlanId: 30, gateway: "192.168.30.1", notes: "No outbound internet." },
    ],
    reservations: [
      { id: "res_gw", subnetId: "net_lan", ip: "192.168.1.1", hostname: "gw-01", rackItemId: "item_gateway" },
      { id: "res_sw", subnetId: "net_lan", ip: "192.168.1.2", hostname: "sw-01", rackItemId: "item_switch" },
      { id: "res_prox", subnetId: "net_lan", ip: "192.168.1.10", hostname: "prox-01", rackItemId: "item_prox" },
      { id: "res_pi", subnetId: "net_lan", ip: "192.168.1.11", hostname: "pi-dns", rackItemId: "item_pi" },
      { id: "res_nas", subnetId: "net_lan", ip: "192.168.1.20", hostname: "nas-01", rackItemId: "item_nas" },
    ],
    wishlist: [
      { id: "wish_disks", name: "Seagate Exos 16TB", price: 210, quantity: 2, purchased: false, notes: "Mirror for the NAS." },
      { id: "wish_dac", name: "10G SFP+ DAC cable (1m)", price: 18, quantity: 2, purchased: false },
      { id: "wish_gpu", name: "Quadro P2000 (transcode GPU)", price: 130, quantity: 1, purchased: false, notes: "Goes inside prox-01 rather than in a rack slot." },
    ],
  };
}

export function createEmptyPlan(): Plan {
  return {
    version: PLAN_VERSION,
    name: "Untitled plan",
    settings: { ...DEFAULT_SETTINGS },
    racks: [],
    customDevices: [],
    customServices: [],
    serviceInstances: [],
    subnets: [],
    reservations: [],
    wishlist: [],
  };
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const asNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

/**
 * Coerce anything that claims to be a plan into a usable one. Imported files
 * may be hand-edited or come from an older version, so every field is checked
 * rather than trusted.
 */
export function sanitisePlan(raw: unknown): Plan {
  if (!raw || typeof raw !== "object") throw new Error("File does not contain a plan object.");
  const input = raw as Partial<Plan> & Record<string, unknown>;
  const settings = (input.settings ?? {}) as Partial<Settings>;

  const plan: Plan = {
    version: PLAN_VERSION,
    name: typeof input.name === "string" && input.name.trim() ? input.name : "Imported plan",
    settings: {
      currency: (["GBP", "USD", "EUR"] as const).includes(settings.currency as Settings["currency"])
        ? (settings.currency as Settings["currency"])
        : DEFAULT_SETTINGS.currency,
      kwhRate: asNumber(settings.kwhRate, DEFAULT_SETTINGS.kwhRate),
      hoursPerDay: Math.min(24, Math.max(0, asNumber(settings.hoursPerDay, DEFAULT_SETTINGS.hoursPerDay))),
      loadFactor: Math.min(1, Math.max(0, asNumber(settings.loadFactor, DEFAULT_SETTINGS.loadFactor))),
    },
    racks: asArray<Plan["racks"][number]>(input.racks).map((rack) => ({
      ...rack,
      id: rack.id ?? newId("rack"),
      name: rack.name ?? "Rack",
      heightU: Math.max(1, Math.round(asNumber(rack.heightU, 12))),
      price: asNumber(rack.price, 0),
      items: asArray<Plan["racks"][number]["items"][number]>(rack.items).map((item) => ({
        ...item,
        id: item.id ?? newId("item"),
        startU: Math.max(1, Math.round(asNumber(item.startU, 1))),
      })),
    })),
    customDevices: asArray(input.customDevices),
    customServices: asArray(input.customServices),
    serviceInstances: asArray<Plan["serviceInstances"][number]>(input.serviceInstances).map((instance) => ({
      ...instance,
      id: instance.id ?? newId("svc"),
      hostItemId: instance.hostItemId ?? null,
    })),
    subnets: asArray(input.subnets),
    reservations: asArray(input.reservations),
    wishlist: asArray<Plan["wishlist"][number]>(input.wishlist).map((item) => ({
      ...item,
      id: item.id ?? newId("wish"),
      quantity: Math.max(1, Math.round(asNumber(item.quantity, 1))),
      price: asNumber(item.price, 0),
      purchased: Boolean(item.purchased),
    })),
  };

  // Drop assignments and reservations pointing at rack items that no longer exist.
  const itemIds = new Set(plan.racks.flatMap((rack) => rack.items.map((item) => item.id)));
  plan.serviceInstances = plan.serviceInstances.map((instance) =>
    instance.hostItemId && !itemIds.has(instance.hostItemId) ? { ...instance, hostItemId: null } : instance,
  );
  plan.reservations = plan.reservations.map((reservation) =>
    reservation.rackItemId && !itemIds.has(reservation.rackItemId)
      ? { ...reservation, rackItemId: null }
      : reservation,
  );

  return plan;
}

type PlanUpdater = Plan | ((previous: Plan) => Plan);

/**
 * The plan lives in a small external store rather than in React state.
 *
 * localStorage is read once when this module first evaluates in the browser,
 * so the very first client render already has the saved plan — no loading
 * effect, no cascading render. Hydration still matches the server because
 * `getServerSnapshot` hands React the same starter plan the server rendered,
 * and React only switches to the live snapshot once hydration is done.
 */

const SERVER_PLAN: Plan = createStarterPlan();

let currentPlan: Plan = SERVER_PLAN;
const listeners = new Set<() => void>();

function readStoredPlan(): Plan | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? sanitisePlan(JSON.parse(stored)) : null;
  } catch (error) {
    console.warn("Could not read the saved plan, starting fresh.", error);
    return null;
  }
}

if (typeof window !== "undefined") {
  currentPlan = readStoredPlan() ?? currentPlan;
}

function emit() {
  for (const listener of listeners) listener();
}

function commit(next: Plan, { persist = true } = {}) {
  if (next === currentPlan) return;
  currentPlan = next;
  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn("Could not save the plan.", error);
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  // Another tab editing the same plan wins, rather than being silently
  // overwritten the next time this tab saves.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    const incoming = readStoredPlan();
    if (incoming) commit(incoming, { persist: false });
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => currentPlan;
const getServerSnapshot = () => SERVER_PLAN;

export function setPlan(updater: PlanUpdater) {
  commit(typeof updater === "function" ? updater(currentPlan) : updater);
}

export function replacePlan(next: Plan) {
  commit(next);
}

export function resetPlan(mode: "starter" | "empty") {
  commit(mode === "starter" ? createStarterPlan() : createEmptyPlan());
}

export function usePlan() {
  const plan = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { plan, setPlan, replacePlan, resetPlan };
}
