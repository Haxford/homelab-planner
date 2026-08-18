import type { Device, DeviceCategory } from "@/lib/types";

/**
 * Built-in hardware catalogue.
 *
 * Prices are rough street-price estimates in GBP (used gear priced as used) and
 * power figures are typical whole-system draw, not PSU ratings. Both are meant
 * as a starting point — edit any device in the app to match what you actually
 * paid and what your meter actually reads.
 */

const d = (device: Device): Device => ({ ...device, builtIn: true });

export const DEVICE_CATEGORIES: {
  id: DeviceCategory;
  label: string;
  /** Tailwind classes for the block drawn in the rack elevation. */
  block: string;
  dot: string;
}[] = [
  { id: "server", label: "Servers", block: "bg-sky-500/25 border-sky-400/60 text-sky-100", dot: "bg-sky-400" },
  { id: "mini-pc", label: "Mini PCs", block: "bg-cyan-500/25 border-cyan-400/60 text-cyan-100", dot: "bg-cyan-400" },
  { id: "workstation", label: "Workstations", block: "bg-violet-500/25 border-violet-400/60 text-violet-100", dot: "bg-violet-400" },
  { id: "nas", label: "NAS & storage", block: "bg-amber-500/25 border-amber-400/60 text-amber-100", dot: "bg-amber-400" },
  { id: "switch", label: "Switches", block: "bg-emerald-500/25 border-emerald-400/60 text-emerald-100", dot: "bg-emerald-400" },
  { id: "router", label: "Routers & firewalls", block: "bg-teal-500/25 border-teal-400/60 text-teal-100", dot: "bg-teal-400" },
  { id: "ups", label: "UPS", block: "bg-orange-500/25 border-orange-400/60 text-orange-100", dot: "bg-orange-400" },
  { id: "pdu", label: "Power distribution", block: "bg-yellow-500/25 border-yellow-400/60 text-yellow-100", dot: "bg-yellow-400" },
  { id: "passive", label: "Panels & shelves", block: "bg-slate-500/25 border-slate-400/60 text-slate-100", dot: "bg-slate-400" },
  { id: "accessory", label: "Accessories", block: "bg-fuchsia-500/25 border-fuchsia-400/60 text-fuchsia-100", dot: "bg-fuchsia-400" },
];

export function categoryMeta(category: DeviceCategory) {
  return DEVICE_CATEGORIES.find((c) => c.id === category) ?? DEVICE_CATEGORIES[0];
}

/** Categories whose devices can host services. */
export const HOST_CATEGORIES: DeviceCategory[] = ["server", "mini-pc", "workstation", "nas"];

export const BUILT_IN_DEVICES: Device[] = [
  // ---------------------------------------------------------------- mini PCs
  d({
    id: "beelink-ser8", name: "Beelink SER8", vendor: "Beelink", category: "mini-pc",
    rackUnits: 1, width: 0.5, cpu: "Ryzen 7 8845HS", cores: 8, threads: 16,
    ramGb: 32, maxRamGb: 64, storageTb: 1, driveBays: 2, ports: 1, portSpeed: 2.5,
    powerIdleW: 12, powerMaxW: 90, price: 520,
    notes: "Strong all-rounder. Needs a shelf — not rackmount.",
  }),
  d({
    id: "minisforum-ms01", name: "Minisforum MS-01", vendor: "Minisforum", category: "mini-pc",
    rackUnits: 1, width: 0.5, cpu: "Core i9-13900H", cores: 14, threads: 20,
    ramGb: 32, maxRamGb: 96, storageTb: 2, driveBays: 3, ports: 4, portSpeed: 10,
    powerIdleW: 18, powerMaxW: 120, price: 750,
    notes: "2x SFP+ 10G and 2x 2.5GbE — the usual Proxmox cluster node.",
  }),
  d({
    id: "nuc13-pro", name: "NUC 13 Pro", vendor: "ASUS", category: "mini-pc",
    rackUnits: 1, width: 0.5, cpu: "Core i5-1340P", cores: 12, threads: 16,
    ramGb: 16, maxRamGb: 64, storageTb: 0.5, driveBays: 2, ports: 1, portSpeed: 2.5,
    powerIdleW: 8, powerMaxW: 60, price: 450,
  }),
  d({
    id: "optiplex-7060-micro", name: "OptiPlex 7060 Micro", vendor: "Dell", category: "mini-pc",
    rackUnits: 1, width: 0.5, cpu: "Core i5-8500T", cores: 6, threads: 6,
    ramGb: 16, maxRamGb: 32, storageTb: 0.5, driveBays: 1, ports: 1, portSpeed: 1,
    powerIdleW: 10, powerMaxW: 45, price: 130,
    notes: "Used-market bargain. Three of these make a cheap cluster.",
  }),
  d({
    id: "thinkcentre-m720q", name: "ThinkCentre M720q Tiny", vendor: "Lenovo", category: "mini-pc",
    rackUnits: 1, width: 0.5, cpu: "Core i5-8400T", cores: 6, threads: 6,
    ramGb: 16, maxRamGb: 32, storageTb: 0.25, driveBays: 1, ports: 1, portSpeed: 1,
    powerIdleW: 9, powerMaxW: 40, price: 120,
    notes: "Takes a low-profile PCIe riser — handy for a 10G NIC.",
  }),
  d({
    id: "elitedesk-800-g4", name: "EliteDesk 800 G4 Mini", vendor: "HP", category: "mini-pc",
    rackUnits: 1, width: 0.5, cpu: "Core i5-8500T", cores: 6, threads: 6,
    ramGb: 16, maxRamGb: 32, storageTb: 0.5, driveBays: 1, ports: 1, portSpeed: 1,
    powerIdleW: 9, powerMaxW: 45, price: 125,
  }),
  d({
    id: "beelink-eq14", name: "Beelink EQ14", vendor: "Beelink", category: "mini-pc",
    rackUnits: 1, width: 0.5, cpu: "Intel N150", cores: 4, threads: 4,
    ramGb: 16, maxRamGb: 16, storageTb: 0.5, driveBays: 1, ports: 2, portSpeed: 2.5,
    powerIdleW: 6, powerMaxW: 25, price: 180,
    notes: "Dual 2.5GbE and very low idle — a tidy OPNsense or Pi-hole box.",
  }),
  d({
    id: "raspberry-pi-5", name: "Raspberry Pi 5 (8GB)", vendor: "Raspberry Pi", category: "mini-pc",
    rackUnits: 1, width: 0.5, cpu: "BCM2712", cores: 4, threads: 4,
    ramGb: 8, maxRamGb: 8, storageTb: 0.25, driveBays: 1, ports: 1, portSpeed: 1,
    powerIdleW: 3, powerMaxW: 12, price: 75,
    notes: "Add a PoE or NVMe HAT. Several fit on one 1U shelf.",
  }),

  // ---------------------------------------------------------------- servers
  d({
    id: "dell-r730xd", name: "PowerEdge R730xd", vendor: "Dell", category: "server",
    rackUnits: 2, width: 1, cpu: "2x Xeon E5-2680 v4", cores: 28, threads: 56,
    ramGb: 128, maxRamGb: 768, storageTb: 24, driveBays: 12, ports: 4, portSpeed: 1,
    powerIdleW: 120, powerMaxW: 600, price: 450,
    notes: "Cheap capacity, loud fans, and a meaningful electricity bill.",
  }),
  d({
    id: "dell-r430", name: "PowerEdge R430", vendor: "Dell", category: "server",
    rackUnits: 1, width: 1, cpu: "2x Xeon E5-2650 v4", cores: 24, threads: 48,
    ramGb: 64, maxRamGb: 384, storageTb: 4, driveBays: 8, ports: 4, portSpeed: 1,
    powerIdleW: 80, powerMaxW: 400, price: 300,
  }),
  d({
    id: "hpe-dl360-gen10", name: "ProLiant DL360 Gen10", vendor: "HPE", category: "server",
    rackUnits: 1, width: 1, cpu: "2x Xeon Silver 4114", cores: 20, threads: 40,
    ramGb: 96, maxRamGb: 1536, storageTb: 4, driveBays: 8, ports: 4, portSpeed: 10,
    powerIdleW: 90, powerMaxW: 500, price: 700,
  }),
  d({
    id: "hpe-dl380-gen9", name: "ProLiant DL380 Gen9", vendor: "HPE", category: "server",
    rackUnits: 2, width: 1, cpu: "2x Xeon E5-2660 v3", cores: 20, threads: 40,
    ramGb: 128, maxRamGb: 768, storageTb: 16, driveBays: 12, ports: 4, portSpeed: 1,
    powerIdleW: 110, powerMaxW: 550, price: 420,
  }),
  d({
    id: "supermicro-1u-x10", name: "Supermicro 1U X10SLM", vendor: "Supermicro", category: "server",
    rackUnits: 1, width: 1, cpu: "Xeon E3-1240 v3", cores: 4, threads: 8,
    ramGb: 32, maxRamGb: 32, storageTb: 4, driveBays: 4, ports: 2, portSpeed: 1,
    powerIdleW: 40, powerMaxW: 180, price: 250,
  }),
  d({
    id: "custom-1u-ryzen", name: "Custom 1U (Ryzen 7)", vendor: "Custom build", category: "server",
    rackUnits: 1, width: 1, cpu: "Ryzen 7 5700X", cores: 8, threads: 16,
    ramGb: 64, maxRamGb: 128, storageTb: 4, driveBays: 4, ports: 2, portSpeed: 2.5,
    powerIdleW: 35, powerMaxW: 200, price: 850,
    notes: "Modern efficiency in a rack chassis, at the cost of building it yourself.",
  }),
  d({
    id: "custom-4u-storage", name: "Custom 4U storage server", vendor: "Custom build", category: "server",
    rackUnits: 4, width: 1, cpu: "Ryzen 5 5600", cores: 6, threads: 12,
    ramGb: 64, maxRamGb: 128, storageTb: 80, driveBays: 12, ports: 2, portSpeed: 10,
    powerIdleW: 70, powerMaxW: 300, price: 1200,
    notes: "Quiet 120mm fans and room for a full ATX board.",
  }),

  // ---------------------------------------------------------- workstations
  d({
    id: "hp-z440", name: "Z440 Workstation", vendor: "HP", category: "workstation",
    rackUnits: 4, width: 1, cpu: "Xeon E5-1650 v4", cores: 6, threads: 12,
    ramGb: 64, maxRamGb: 256, storageTb: 2, driveBays: 4, ports: 1, portSpeed: 1,
    powerIdleW: 45, powerMaxW: 300, price: 350,
    notes: "Tower on a shelf. Quiet, and takes a full-height GPU for transcoding.",
  }),
  d({
    id: "dell-t5820", name: "Precision T5820", vendor: "Dell", category: "workstation",
    rackUnits: 4, width: 1, cpu: "Xeon W-2123", cores: 4, threads: 8,
    ramGb: 32, maxRamGb: 256, storageTb: 2, driveBays: 4, ports: 1, portSpeed: 1,
    powerIdleW: 50, powerMaxW: 320, price: 450,
  }),
  d({
    id: "custom-atx-tower", name: "Custom ATX tower", vendor: "Custom build", category: "workstation",
    rackUnits: 4, width: 1, cpu: "Ryzen 9 7900", cores: 12, threads: 24,
    ramGb: 64, maxRamGb: 192, storageTb: 8, driveBays: 6, ports: 1, portSpeed: 2.5,
    powerIdleW: 40, powerMaxW: 280, price: 1100,
  }),

  // ------------------------------------------------------------------- NAS
  d({
    id: "synology-ds923", name: "DiskStation DS923+", vendor: "Synology", category: "nas",
    rackUnits: 2, width: 0.5, cpu: "Ryzen R1600", cores: 2, threads: 4,
    ramGb: 4, maxRamGb: 32, storageTb: 32, driveBays: 4, ports: 2, portSpeed: 1,
    powerIdleW: 25, powerMaxW: 55, price: 550,
    notes: "Desktop unit — sits on a shelf. Price excludes drives.",
  }),
  d({
    id: "synology-rs1221", name: "RackStation RS1221+", vendor: "Synology", category: "nas",
    rackUnits: 2, width: 1, cpu: "Ryzen V1500B", cores: 4, threads: 8,
    ramGb: 4, maxRamGb: 32, storageTb: 64, driveBays: 8, ports: 4, portSpeed: 1,
    powerIdleW: 60, powerMaxW: 130, price: 1400,
    notes: "Price excludes drives.",
  }),
  d({
    id: "qnap-ts464", name: "TS-464", vendor: "QNAP", category: "nas",
    rackUnits: 2, width: 0.5, cpu: "Celeron N5105", cores: 4, threads: 4,
    ramGb: 8, maxRamGb: 16, storageTb: 32, driveBays: 4, ports: 2, portSpeed: 2.5,
    powerIdleW: 20, powerMaxW: 50, price: 600,
  }),
  d({
    id: "ugreen-dxp4800", name: "DXP4800 Plus", vendor: "UGREEN", category: "nas",
    rackUnits: 2, width: 0.5, cpu: "Pentium Gold 8505", cores: 5, threads: 6,
    ramGb: 8, maxRamGb: 64, storageTb: 32, driveBays: 4, ports: 2, portSpeed: 10,
    powerIdleW: 22, powerMaxW: 60, price: 600,
  }),
  d({
    id: "truenas-4u", name: "TrueNAS build (4U, 8-bay)", vendor: "Custom build", category: "nas",
    rackUnits: 4, width: 1, cpu: "Xeon E-2246G", cores: 6, threads: 12,
    ramGb: 64, maxRamGb: 128, storageTb: 64, driveBays: 8, ports: 2, portSpeed: 10,
    powerIdleW: 65, powerMaxW: 250, price: 900,
    notes: "Chassis, board and HBA only — add drives from the wishlist.",
  }),
  d({
    id: "disk-shelf-ds4246", name: "NetApp DS4246 disk shelf", vendor: "NetApp", category: "nas",
    rackUnits: 4, width: 1, storageTb: 96, driveBays: 24,
    powerIdleW: 120, powerMaxW: 340, price: 250,
    notes: "24 bays for very little money, but it is never quiet.",
  }),

  // -------------------------------------------------------------- switches
  d({
    id: "unifi-lite-8-poe", name: "USW Lite 8 PoE", vendor: "Ubiquiti", category: "switch",
    rackUnits: 1, width: 0.5, ports: 8, portSpeed: 1,
    powerIdleW: 7, powerMaxW: 60, price: 110,
    notes: "52W PoE budget across 4 ports.",
  }),
  d({
    id: "unifi-pro-24-poe", name: "USW Pro 24 PoE", vendor: "Ubiquiti", category: "switch",
    rackUnits: 1, width: 1, ports: 26, portSpeed: 1,
    powerIdleW: 45, powerMaxW: 450, price: 700,
    notes: "24x 1GbE + 2x 10G SFP+, 400W PoE budget.",
  }),
  d({
    id: "unifi-ent-8-poe", name: "USW Enterprise 8 PoE", vendor: "Ubiquiti", category: "switch",
    rackUnits: 1, width: 0.5, ports: 8, portSpeed: 2.5,
    powerIdleW: 15, powerMaxW: 140, price: 380,
    notes: "2.5GbE all round with a 10G SFP+ uplink.",
  }),
  d({
    id: "mikrotik-crs309", name: "CRS309-1G-8S+", vendor: "MikroTik", category: "switch",
    rackUnits: 1, width: 0.5, ports: 9, portSpeed: 10,
    powerIdleW: 18, powerMaxW: 30, price: 240,
    notes: "Eight SFP+ ports — the cheap way into 10G.",
  }),
  d({
    id: "mikrotik-crs326", name: "CRS326-24G-2S+", vendor: "MikroTik", category: "switch",
    rackUnits: 1, width: 1, ports: 26, portSpeed: 1,
    powerIdleW: 12, powerMaxW: 25, price: 150,
  }),
  d({
    id: "zyxel-xgs1210", name: "XGS1210-12", vendor: "Zyxel", category: "switch",
    rackUnits: 1, width: 0.5, ports: 12, portSpeed: 2.5,
    powerIdleW: 10, powerMaxW: 22, price: 180,
    notes: "Multi-gig without the fan noise.",
  }),
  d({
    id: "tplink-sg108", name: "TL-SG108", vendor: "TP-Link", category: "switch",
    rackUnits: 1, width: 0.5, ports: 8, portSpeed: 1,
    powerIdleW: 3, powerMaxW: 5, price: 25,
    notes: "Unmanaged, silent, and fine for a corner of the rack.",
  }),

  // ------------------------------------------------------ routers/firewalls
  d({
    id: "unifi-udm-pro", name: "Dream Machine Pro", vendor: "Ubiquiti", category: "router",
    rackUnits: 1, width: 1, cores: 4, ports: 10, portSpeed: 1,
    powerIdleW: 25, powerMaxW: 50, price: 380,
    notes: "Gateway, controller and 8-port switch in one rackmount box.",
  }),
  d({
    id: "unifi-ucg-ultra", name: "Cloud Gateway Ultra", vendor: "Ubiquiti", category: "router",
    rackUnits: 1, width: 0.5, cores: 4, ports: 5, portSpeed: 1,
    powerIdleW: 5, powerMaxW: 12, price: 130,
  }),
  d({
    id: "protectli-vp2420", name: "Vault VP2420", vendor: "Protectli", category: "router",
    rackUnits: 1, width: 0.5, cpu: "Celeron J6412", cores: 4, threads: 4,
    ramGb: 8, maxRamGb: 16, storageTb: 0.25, ports: 4, portSpeed: 2.5,
    powerIdleW: 10, powerMaxW: 20, price: 350,
    notes: "Fanless OPNsense or pfSense box.",
  }),
  d({
    id: "mikrotik-hex-s", name: "hEX S", vendor: "MikroTik", category: "router",
    rackUnits: 1, width: 0.5, ports: 5, portSpeed: 1,
    powerIdleW: 4, powerMaxW: 8, price: 70,
  }),

  // ------------------------------------------------------------- UPS & PDU
  d({
    id: "apc-smart-1500-rm", name: "Smart-UPS 1500VA RM", vendor: "APC", category: "ups",
    rackUnits: 2, width: 1, powerIdleW: 15, powerMaxW: 30, price: 450,
    notes: "1000W usable. Budget for a battery replacement on used units.",
  }),
  d({
    id: "apc-backups-850", name: "Back-UPS 850VA", vendor: "APC", category: "ups",
    rackUnits: 2, width: 0.5, powerIdleW: 8, powerMaxW: 15, price: 110,
    notes: "Desktop unit for a shelf — fine for a mini PC and a switch.",
  }),
  d({
    id: "eaton-5px-1500", name: "5PX 1500 RT", vendor: "Eaton", category: "ups",
    rackUnits: 2, width: 1, powerIdleW: 18, powerMaxW: 35, price: 700,
    notes: "Proper metering and a network card option.",
  }),
  d({
    id: "pdu-basic-8", name: "8-way rack PDU", vendor: "Generic", category: "pdu",
    rackUnits: 1, width: 1, powerIdleW: 0, powerMaxW: 0, price: 45,
  }),
  d({
    id: "pdu-metered-8", name: "Metered PDU (8-way)", vendor: "APC", category: "pdu",
    rackUnits: 1, width: 1, powerIdleW: 5, powerMaxW: 8, price: 180,
    notes: "Per-outlet metering, so your power numbers stop being guesses.",
  }),

  // --------------------------------------------------------------- passive
  d({
    id: "patch-panel-24", name: "24-port Cat6 patch panel", vendor: "Generic", category: "passive",
    rackUnits: 1, width: 1, ports: 24, powerIdleW: 0, powerMaxW: 0, price: 30,
  }),
  d({
    id: "patch-panel-12", name: "12-port Cat6 patch panel", vendor: "Generic", category: "passive",
    rackUnits: 1, width: 0.5, ports: 12, powerIdleW: 0, powerMaxW: 0, price: 20,
  }),
  d({
    id: "shelf-1u", name: "1U vented shelf", vendor: "Generic", category: "passive",
    rackUnits: 1, width: 1, powerIdleW: 0, powerMaxW: 0, price: 25,
    notes: "Where the non-rackmount gear actually lives.",
  }),
  d({
    id: "shelf-2u", name: "2U vented shelf", vendor: "Generic", category: "passive",
    rackUnits: 2, width: 1, powerIdleW: 0, powerMaxW: 0, price: 35,
  }),
  d({
    id: "cable-brace-1u", name: "1U cable management brace", vendor: "Generic", category: "passive",
    rackUnits: 1, width: 1, powerIdleW: 0, powerMaxW: 0, price: 15,
  }),
  d({
    id: "blank-1u", name: "1U blanking plate", vendor: "Generic", category: "passive",
    rackUnits: 1, width: 1, powerIdleW: 0, powerMaxW: 0, price: 8,
    notes: "Keeps hot air where it belongs.",
  }),

  // ------------------------------------------------------------ accessories
  d({
    id: "fan-panel-1u", name: "1U fan panel", vendor: "Generic", category: "accessory",
    rackUnits: 1, width: 1, powerIdleW: 12, powerMaxW: 25, price: 60,
  }),
  d({
    id: "kvm-1u", name: "1U KVM console", vendor: "Generic", category: "accessory",
    rackUnits: 1, width: 1, powerIdleW: 8, powerMaxW: 20, price: 220,
  }),
];

export const DEVICES_BY_ID = new Map(BUILT_IN_DEVICES.map((device) => [device.id, device]));
