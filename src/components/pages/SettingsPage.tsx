"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { PlanDataButtons } from "@/components/AppShell";
import { usePlan } from "@/lib/store";
import {
  Button,
  Card,
  Field,
  NumberInput,
  PageHeader,
  Select,
  TextInput,
} from "@/components/ui";

export function SettingsPage() {
  const { plan, setPlan, resetPlan } = usePlan();
  const [confirming, setConfirming] = useState<"starter" | "empty" | null>(null);

  function updateSettings(patch: Partial<typeof plan.settings>) {
    setPlan((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } }));
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Plan-wide details, and where to get your data in and out."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Plan">
          <div className="space-y-3">
            <Field label="Plan name" hint="Used in the header and in the exported filename.">
              {(id) => (
                <TextInput
                  id={id}
                  value={plan.name}
                  onChange={(event) => setPlan((previous) => ({ ...previous, name: event.target.value }))}
                />
              )}
            </Field>
            <Field label="Currency">
              {(id) => (
                <Select
                  id={id}
                  value={plan.settings.currency}
                  onChange={(event) =>
                    updateSettings({ currency: event.target.value as typeof plan.settings.currency })
                  }
                >
                  <option value="GBP">GBP (£)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </Select>
              )}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Electricity (${plan.settings.currency}/kWh)`}>
                {(id) => (
                  <NumberInput
                    id={id}
                    min={0}
                    step="0.01"
                    value={plan.settings.kwhRate}
                    onChange={(event) => updateSettings({ kwhRate: Math.max(0, Number(event.target.value) || 0) })}
                  />
                )}
              </Field>
              <Field label="Hours per day">
                {(id) => (
                  <NumberInput
                    id={id}
                    min={0}
                    max={24}
                    value={plan.settings.hoursPerDay}
                    onChange={(event) =>
                      updateSettings({ hoursPerDay: Math.min(24, Math.max(0, Number(event.target.value) || 0)) })
                    }
                  />
                )}
              </Field>
            </div>
            <Field
              label={`Typical load — ${Math.round(plan.settings.loadFactor * 100)}%`}
              hint="Used to estimate average draw between idle and peak."
            >
              {(id) => (
                <input
                  id={id}
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(plan.settings.loadFactor * 100)}
                  onChange={(event) => updateSettings({ loadFactor: Number(event.target.value) / 100 })}
                  className="w-full accent-emerald-400"
                />
              )}
            </Field>
          </div>
        </Card>

        <div className="space-y-4">
          <Card
            title="Your data"
            description="Plans live in this browser's local storage. Nothing is uploaded anywhere — clearing site data or switching browser loses the plan unless you export it."
          >
            <PlanDataButtons />
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-edge pt-3 text-xs">
              <Row label="Racks" value={plan.racks.length} />
              <Row label="Devices placed" value={plan.racks.reduce((sum, rack) => sum + rack.items.length, 0)} />
              <Row label="Services" value={plan.serviceInstances.length} />
              <Row label="Custom hardware" value={plan.customDevices.length} />
              <Row label="Custom services" value={plan.customServices.length} />
              <Row label="Subnets" value={plan.subnets.length} />
            </dl>
          </Card>

          <Card title="Start over" description="This cannot be undone — export first if you want a copy.">
            {confirming ? (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2.5">
                <p className="flex items-start gap-2 text-xs text-rose-200">
                  <AlertTriangle className="mt-px h-4 w-4 shrink-0" />
                  Replace the current plan with{" "}
                  {confirming === "starter" ? "the worked example" : "an empty plan"}? Everything you
                  have added will be lost.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => setConfirming(null)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      resetPlan(confirming);
                      setConfirming(null);
                    }}
                  >
                    Yes, replace it
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setConfirming("empty")}>
                  <RotateCcw className="h-4 w-4" />
                  Start empty
                </Button>
                <Button onClick={() => setConfirming("starter")}>
                  <Sparkles className="h-4 w-4" />
                  Load the example
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-4" title="About the numbers">
        <div className="space-y-2 text-xs leading-relaxed text-zinc-400">
          <p>
            Prices in the built-in catalogue are rough street-price estimates — used gear priced as
            used — and power figures are typical whole-system draw rather than PSU ratings. They are a
            starting point, not a quote. Edit any device on the Hardware page to match what you
            actually paid and what your meter actually reads, and the rest of the app follows.
          </p>
          <p>
            Service resource figures are steady-state working estimates. They are deliberately
            generous enough to size a host sensibly, so a host showing 80% here will not be at 80% in
            production.
          </p>
        </div>
      </Card>
    </>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-mono tabular-nums text-zinc-300">{value}</dd>
    </div>
  );
}
