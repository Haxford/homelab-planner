"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import {
  Download,
  HardDrive,
  LayoutDashboard,
  Network,
  Server,
  Settings as SettingsIcon,
  Upload,
  Wallet,
  Boxes,
} from "lucide-react";
import { usePlan, sanitisePlan } from "@/lib/store";
import { Button, cx } from "@/components/ui";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/rack", label: "Rack builder", icon: Server },
  { href: "/hardware", label: "Hardware", icon: HardDrive },
  { href: "/services", label: "Services", icon: Boxes },
  { href: "/network", label: "Network", icon: Network },
  { href: "/budget", label: "Budget & power", icon: Wallet },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "homelab";
}

export function PlanDataButtons({ compact = false }: { compact?: boolean }) {
  const { plan, replacePlan } = usePlan();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  function exportPlan() {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(plan.name)}-plan.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importPlan(file: File) {
    try {
      const text = await file.text();
      replacePlan(sanitisePlan(JSON.parse(text)));
      setMessage("Plan imported.");
    } catch (error) {
      setMessage(error instanceof Error ? `Import failed: ${error.message}` : "Import failed.");
    }
    window.setTimeout(() => setMessage(null), 4000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size={compact ? "sm" : "md"} onClick={exportPlan}>
        <Download className="h-3.5 w-3.5" />
        Export
      </Button>
      <Button size={compact ? "sm" : "md"} onClick={() => fileInput.current?.click()}>
        <Upload className="h-3.5 w-3.5" />
        Import
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void importPlan(file);
          event.target.value = "";
        }}
      />
      {message && <span className="text-xs text-zinc-400">{message}</span>}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { plan } = usePlan();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-edge bg-canvas/85 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60">
            <span className="grid h-7 w-7 place-items-center rounded-md border border-emerald-400/40 bg-emerald-500/15">
              <Server className="h-3.5 w-3.5 text-emerald-300" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">
              Homelab Planner
            </span>
            <span className="hidden truncate text-xs text-zinc-500 sm:inline">/ {plan.name}</span>
          </Link>
          <PlanDataButtons compact />
        </div>

        {/* Horizontal nav on small screens; the sidebar takes over from lg up. */}
        <nav className="scroll-slim flex gap-1 overflow-x-auto border-t border-edge px-3 py-1.5 lg:hidden">
          {NAV.map((entry) => {
            const active = pathname === entry.href;
            return (
              <Link
                key={entry.href}
                href={entry.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active ? "bg-emerald-500/15 text-emerald-300" : "text-zinc-400 hover:bg-surface-2 hover:text-zinc-100",
                )}
              >
                <entry.icon className="h-3.5 w-3.5" />
                {entry.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-edge px-3 py-4 lg:block">
          <nav className="sticky top-24 flex flex-col gap-0.5">
            {NAV.map((entry) => {
              const active = pathname === entry.href;
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-zinc-400 hover:bg-surface-2 hover:text-zinc-100",
                  )}
                >
                  <entry.icon className="h-4 w-4" />
                  {entry.label}
                </Link>
              );
            })}
            <p className="mt-6 border-t border-edge px-2.5 pt-4 text-[0.7rem] leading-relaxed text-zinc-600">
              Plans are saved in this browser only. Export to JSON to keep a copy
              or move it to another machine.
            </p>
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
