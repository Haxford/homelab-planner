/** Core domain model for the homelab planner. */

export type DeviceCategory =
  | "mini-pc"
  | "server"
  | "workstation"
  | "nas"
  | "switch"
  | "router"
  | "ups"
  | "pdu"
  | "passive"
  | "accessory";

export type ServiceCategory =
  | "virtualisation"
  | "media"
  | "downloads"
  | "home-automation"
  | "storage"
  | "networking"
  | "security"
  | "monitoring"
  | "productivity"
  | "development"
  | "ai";

/**
 * A piece of hardware that can be placed in a rack. Built-in entries ship with
 * the app; users can add their own or clone a built-in and edit it.
 */
export interface Device {
  id: string;
  name: string;
  vendor: string;
  category: DeviceCategory;
  /** Height in rack units. Non-rackmount gear is listed at the U it eats on a shelf. */
  rackUnits: number;
  /** Full-width (1) or half-width (0.5) so two can share the same U. */
  width: 1 | 0.5;
  cpu?: string;
  cores?: number;
  threads?: number;
  ramGb?: number;
  maxRamGb?: number;
  storageTb?: number;
  driveBays?: number;
  /** Number of ethernet ports the device offers (switch port count, or NICs on a host). */
  ports?: number;
  /** Speed of those ports in Gbps. */
  portSpeed?: number;
  powerIdleW: number;
  powerMaxW: number;
  price: number;
  notes?: string;
  builtIn?: boolean;
}

/** A workload you intend to run, with the resources it needs to run well. */
export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  /** CPU cores, fractional allowed — most containers idle well below one core. */
  cpuCores: number;
  ramGb: number;
  storageGb: number;
  ports: number[];
  image?: string;
  notes?: string;
  builtIn?: boolean;
}

/** A device placed at a specific position in a specific rack. */
export interface RackItem {
  id: string;
  deviceId: string;
  /** Lowest rack unit the item occupies, 1-indexed from the bottom of the rack. */
  startU: number;
  /** Left or right when the device is half-width; ignored for full-width gear. */
  side?: "left" | "right";
  /** Instance name, e.g. "prox-01". Falls back to the device name. */
  label?: string;
}

export interface Rack {
  id: string;
  name: string;
  heightU: number;
  price: number;
  notes?: string;
  items: RackItem[];
}

/** A service you have decided to run, optionally pinned to a host. */
export interface ServiceInstance {
  id: string;
  serviceId: string;
  /** RackItem id of the host, or null while unassigned. */
  hostItemId: string | null;
  label?: string;
}

export interface Subnet {
  id: string;
  name: string;
  cidr: string;
  vlanId?: number;
  gateway?: string;
  notes?: string;
}

export interface Reservation {
  id: string;
  subnetId: string;
  ip: string;
  hostname: string;
  rackItemId?: string | null;
  notes?: string;
}

/** Something you want to buy but have not placed in a rack yet. */
export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  purchased: boolean;
  notes?: string;
}

export interface Settings {
  currency: "GBP" | "USD" | "EUR";
  /** Electricity price per kWh in the chosen currency. */
  kwhRate: number;
  /** Hours per day the lab is powered. */
  hoursPerDay: number;
  /**
   * Where between idle and max draw the gear typically sits, 0–1.
   * 0 assumes everything idles forever, 1 assumes everything is pinned.
   */
  loadFactor: number;
}

export interface Plan {
  /** Schema version, bumped when the shape changes so imports can be migrated. */
  version: number;
  name: string;
  settings: Settings;
  racks: Rack[];
  /** User-authored devices, merged with the built-in catalog at read time. */
  customDevices: Device[];
  customServices: Service[];
  serviceInstances: ServiceInstance[];
  subnets: Subnet[];
  reservations: Reservation[];
  wishlist: WishlistItem[];
}
