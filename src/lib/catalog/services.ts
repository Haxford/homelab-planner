import type { Service, ServiceCategory } from "@/lib/types";

/**
 * Built-in catalogue of self-hosted workloads.
 *
 * Resource figures are steady-state working estimates, not hard minimums —
 * enough to size a host sensibly.
 *
 * `storageGb` is what the service puts on *its own host*: config, database,
 * cache and any data it genuinely owns. A media library read over a NAS share
 * is not counted against the machine running Jellyfin — size that on the
 * storage host instead, or add the drives to the wishlist.
 */

const s = (service: Service): Service => ({ ...service, builtIn: true });

export const SERVICE_CATEGORIES: {
  id: ServiceCategory;
  label: string;
  accent: string;
}[] = [
  { id: "virtualisation", label: "Virtualisation", accent: "text-sky-300 bg-sky-500/10 border-sky-500/30" },
  { id: "media", label: "Media", accent: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
  { id: "downloads", label: "Downloads", accent: "text-orange-300 bg-orange-500/10 border-orange-500/30" },
  { id: "home-automation", label: "Home automation", accent: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  { id: "storage", label: "Storage & backup", accent: "text-yellow-300 bg-yellow-500/10 border-yellow-500/30" },
  { id: "networking", label: "Networking", accent: "text-teal-300 bg-teal-500/10 border-teal-500/30" },
  { id: "security", label: "Security & access", accent: "text-rose-300 bg-rose-500/10 border-rose-500/30" },
  { id: "monitoring", label: "Monitoring", accent: "text-violet-300 bg-violet-500/10 border-violet-500/30" },
  { id: "productivity", label: "Productivity", accent: "text-blue-300 bg-blue-500/10 border-blue-500/30" },
  { id: "development", label: "Development", accent: "text-cyan-300 bg-cyan-500/10 border-cyan-500/30" },
  { id: "ai", label: "AI", accent: "text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30" },
];

export function serviceCategoryMeta(category: ServiceCategory) {
  return SERVICE_CATEGORIES.find((c) => c.id === category) ?? SERVICE_CATEGORIES[0];
}

export const BUILT_IN_SERVICES: Service[] = [
  // ------------------------------------------------------- virtualisation
  s({ id: "proxmox", name: "Proxmox VE", category: "virtualisation", cpuCores: 1, ramGb: 2, storageGb: 32, ports: [8006], notes: "Hypervisor overhead on the host itself." }),
  s({ id: "docker", name: "Docker Engine", category: "virtualisation", cpuCores: 0.2, ramGb: 0.5, storageGb: 20, ports: [], image: "docker" }),
  s({ id: "portainer", name: "Portainer", category: "virtualisation", cpuCores: 0.25, ramGb: 0.5, storageGb: 2, ports: [9443], image: "portainer/portainer-ce" }),

  // ---------------------------------------------------------------- media
  s({ id: "jellyfin", name: "Jellyfin", category: "media", cpuCores: 2, ramGb: 2, storageGb: 50, ports: [8096], image: "jellyfin/jellyfin", notes: "Config, metadata and transcode cache only — the library itself normally lives on a NAS share, so size that on the storage host." }),
  s({ id: "plex", name: "Plex", category: "media", cpuCores: 2, ramGb: 2, storageGb: 60, ports: [32400], image: "plexinc/pms-docker", notes: "Metadata and thumbnails only; the library lives on your storage host." }),
  s({ id: "jellyseerr", name: "Jellyseerr", category: "media", cpuCores: 0.5, ramGb: 0.5, storageGb: 2, ports: [5055], image: "fallenbagel/jellyseerr" }),
  s({ id: "audiobookshelf", name: "Audiobookshelf", category: "media", cpuCores: 0.5, ramGb: 1, storageGb: 40, ports: [13378], image: "advplyr/audiobookshelf" }),
  s({ id: "navidrome", name: "Navidrome", category: "media", cpuCores: 0.5, ramGb: 0.5, storageGb: 30, ports: [4533], image: "deluan/navidrome" }),
  s({ id: "calibre-web", name: "Calibre-Web", category: "media", cpuCores: 0.25, ramGb: 0.5, storageGb: 20, ports: [8083], image: "linuxserver/calibre-web" }),

  // ------------------------------------------------------------ downloads
  s({ id: "sonarr", name: "Sonarr", category: "downloads", cpuCores: 0.5, ramGb: 0.5, storageGb: 5, ports: [8989], image: "linuxserver/sonarr" }),
  s({ id: "radarr", name: "Radarr", category: "downloads", cpuCores: 0.5, ramGb: 0.5, storageGb: 5, ports: [7878], image: "linuxserver/radarr" }),
  s({ id: "prowlarr", name: "Prowlarr", category: "downloads", cpuCores: 0.25, ramGb: 0.25, storageGb: 1, ports: [9696], image: "linuxserver/prowlarr" }),
  s({ id: "bazarr", name: "Bazarr", category: "downloads", cpuCores: 0.25, ramGb: 0.5, storageGb: 2, ports: [6767], image: "linuxserver/bazarr" }),
  s({ id: "qbittorrent", name: "qBittorrent", category: "downloads", cpuCores: 1, ramGb: 1, storageGb: 200, ports: [8080, 6881], image: "linuxserver/qbittorrent", notes: "Staging area for incomplete downloads before they move to the library." }),
  s({ id: "sabnzbd", name: "SABnzbd", category: "downloads", cpuCores: 1.5, ramGb: 1, storageGb: 150, ports: [8085], image: "linuxserver/sabnzbd", notes: "Par2 repair is CPU-hungry in bursts." }),

  // ------------------------------------------------------ home automation
  s({ id: "home-assistant", name: "Home Assistant", category: "home-automation", cpuCores: 2, ramGb: 2, storageGb: 32, ports: [8123], image: "homeassistant/home-assistant" }),
  s({ id: "zigbee2mqtt", name: "Zigbee2MQTT", category: "home-automation", cpuCores: 0.25, ramGb: 0.25, storageGb: 1, ports: [8081], image: "koenkk/zigbee2mqtt", notes: "Needs a USB coordinator passed through to the host." }),
  s({ id: "mosquitto", name: "Mosquitto MQTT", category: "home-automation", cpuCores: 0.1, ramGb: 0.25, storageGb: 1, ports: [1883], image: "eclipse-mosquitto" }),
  s({ id: "esphome", name: "ESPHome", category: "home-automation", cpuCores: 1, ramGb: 1, storageGb: 10, ports: [6052], image: "esphome/esphome", notes: "Compiles firmware — spiky CPU." }),
  s({ id: "frigate", name: "Frigate NVR", category: "home-automation", cpuCores: 4, ramGb: 4, storageGb: 500, ports: [5000], image: "blakeblackshear/frigate", notes: "Recordings are genuinely local. Wants a Coral TPU or an iGPU, and eats disk fast." }),

  // -------------------------------------------------------------- storage
  s({ id: "nextcloud", name: "Nextcloud", category: "storage", cpuCores: 2, ramGb: 2, storageGb: 250, ports: [443], image: "nextcloud" }),
  s({ id: "immich", name: "Immich", category: "storage", cpuCores: 2, ramGb: 4, storageGb: 500, ports: [2283], image: "ghcr.io/immich-app/immich-server", notes: "The photo library is its own data, so this really does land on the host. ML tagging is the heavy part — give it an iGPU if you can." }),
  s({ id: "paperless", name: "Paperless-ngx", category: "storage", cpuCores: 1, ramGb: 2, storageGb: 50, ports: [8000], image: "ghcr.io/paperless-ngx/paperless-ngx" }),
  s({ id: "syncthing", name: "Syncthing", category: "storage", cpuCores: 0.5, ramGb: 0.5, storageGb: 100, ports: [8384], image: "syncthing/syncthing" }),
  s({ id: "minio", name: "MinIO", category: "storage", cpuCores: 1, ramGb: 2, storageGb: 250, ports: [9000], image: "minio/minio" }),
  s({ id: "duplicati", name: "Duplicati", category: "storage", cpuCores: 0.5, ramGb: 1, storageGb: 20, ports: [8200], image: "linuxserver/duplicati" }),

  // ----------------------------------------------------------- networking
  s({ id: "pihole", name: "Pi-hole", category: "networking", cpuCores: 0.25, ramGb: 0.5, storageGb: 2, ports: [53, 80], image: "pihole/pihole" }),
  s({ id: "adguard", name: "AdGuard Home", category: "networking", cpuCores: 0.25, ramGb: 0.5, storageGb: 2, ports: [3000, 53], image: "adguard/adguardhome" }),
  s({ id: "unbound", name: "Unbound", category: "networking", cpuCores: 0.1, ramGb: 0.25, storageGb: 1, ports: [5335], image: "mvance/unbound" }),
  s({ id: "npm", name: "Nginx Proxy Manager", category: "networking", cpuCores: 0.5, ramGb: 0.5, storageGb: 2, ports: [81, 443], image: "jc21/nginx-proxy-manager" }),
  s({ id: "traefik", name: "Traefik", category: "networking", cpuCores: 0.5, ramGb: 0.5, storageGb: 1, ports: [8080, 443], image: "traefik" }),
  s({ id: "unifi-controller", name: "UniFi Network Application", category: "networking", cpuCores: 1, ramGb: 2, storageGb: 20, ports: [8443], image: "linuxserver/unifi-network-application" }),

  // ------------------------------------------------------------- security
  s({ id: "tailscale", name: "Tailscale", category: "security", cpuCores: 0.1, ramGb: 0.25, storageGb: 1, ports: [], image: "tailscale/tailscale" }),
  s({ id: "wireguard", name: "WireGuard", category: "security", cpuCores: 0.25, ramGb: 0.25, storageGb: 1, ports: [51820], image: "linuxserver/wireguard" }),
  s({ id: "authentik", name: "Authentik", category: "security", cpuCores: 1, ramGb: 2, storageGb: 10, ports: [9000], image: "ghcr.io/goauthentik/server" }),
  s({ id: "vaultwarden", name: "Vaultwarden", category: "security", cpuCores: 0.25, ramGb: 0.25, storageGb: 2, ports: [8082], image: "vaultwarden/server" }),
  s({ id: "crowdsec", name: "CrowdSec", category: "security", cpuCores: 0.5, ramGb: 0.5, storageGb: 5, ports: [8083], image: "crowdsecurity/crowdsec" }),

  // ----------------------------------------------------------- monitoring
  s({ id: "grafana", name: "Grafana", category: "monitoring", cpuCores: 0.5, ramGb: 1, storageGb: 5, ports: [3001], image: "grafana/grafana" }),
  s({ id: "prometheus", name: "Prometheus", category: "monitoring", cpuCores: 1, ramGb: 2, storageGb: 50, ports: [9090], image: "prom/prometheus" }),
  s({ id: "influxdb", name: "InfluxDB", category: "monitoring", cpuCores: 1, ramGb: 2, storageGb: 50, ports: [8086], image: "influxdb" }),
  s({ id: "uptime-kuma", name: "Uptime Kuma", category: "monitoring", cpuCores: 0.25, ramGb: 0.25, storageGb: 2, ports: [3002], image: "louislam/uptime-kuma" }),
  s({ id: "scrutiny", name: "Scrutiny", category: "monitoring", cpuCores: 0.1, ramGb: 0.25, storageGb: 2, ports: [8087], image: "ghcr.io/analogj/scrutiny", notes: "SMART monitoring — worth it before a disk dies, not after." }),

  // --------------------------------------------------------- productivity
  s({ id: "vikunja", name: "Vikunja", category: "productivity", cpuCores: 0.25, ramGb: 0.5, storageGb: 5, ports: [3456], image: "vikunja/vikunja" }),
  s({ id: "n8n", name: "n8n", category: "productivity", cpuCores: 0.5, ramGb: 1, storageGb: 10, ports: [5678], image: "n8nio/n8n" }),
  s({ id: "homepage", name: "Homepage", category: "productivity", cpuCores: 0.25, ramGb: 0.25, storageGb: 1, ports: [3003], image: "ghcr.io/gethomepage/homepage" }),

  // ---------------------------------------------------------- development
  s({ id: "gitea", name: "Gitea", category: "development", cpuCores: 0.5, ramGb: 1, storageGb: 20, ports: [3004], image: "gitea/gitea" }),
  s({ id: "woodpecker", name: "Woodpecker CI", category: "development", cpuCores: 1, ramGb: 2, storageGb: 20, ports: [8000], image: "woodpeckerci/woodpecker-server" }),
  s({ id: "postgres", name: "PostgreSQL", category: "development", cpuCores: 1, ramGb: 2, storageGb: 20, ports: [5432], image: "postgres" }),
  s({ id: "mariadb", name: "MariaDB", category: "development", cpuCores: 0.5, ramGb: 1, storageGb: 20, ports: [3306], image: "mariadb" }),
  s({ id: "redis", name: "Redis", category: "development", cpuCores: 0.25, ramGb: 1, storageGb: 2, ports: [6379], image: "redis" }),

  // ------------------------------------------------------------------- ai
  s({ id: "ollama", name: "Ollama", category: "ai", cpuCores: 4, ramGb: 16, storageGb: 100, ports: [11434], image: "ollama/ollama", notes: "RAM figure assumes mid-size models on CPU. A GPU changes everything here." }),
  s({ id: "open-webui", name: "Open WebUI", category: "ai", cpuCores: 0.5, ramGb: 1, storageGb: 10, ports: [8088], image: "ghcr.io/open-webui/open-webui" }),
  s({ id: "whisper-asr", name: "Whisper ASR", category: "ai", cpuCores: 4, ramGb: 4, storageGb: 20, ports: [9001], image: "onerahmet/openai-whisper-asr-webservice" }),
];

export const SERVICES_BY_ID = new Map(BUILT_IN_SERVICES.map((service) => [service.id, service]));
