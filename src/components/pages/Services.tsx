"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, Check, Copy, FileCode2, Plus, Trash2 } from "lucide-react";
import { SERVICE_CATEGORIES, serviceCategoryMeta } from "@/lib/catalog/services";
import { portConflicts, toCompose } from "@/lib/compose";
import { formatNumber, formatStorage } from "@/lib/format";
import { newId } from "@/lib/id";
import { computeHostUsage, indexById, mergeDevices, mergeServices } from "@/lib/selectors";
import { usePlan } from "@/lib/store";
import type { Service, ServiceCategory } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Meter,
  Modal,
  NumberInput,
  PageHeader,
  Select,
  Stat,
  TextInput,
  Textarea,
  cx,
} from "@/components/ui";

export function Services() {
  const { plan, setPlan } = usePlan();
  const devices = useMemo(() => indexById(mergeDevices(plan.customDevices)), [plan.customDevices]);
  const serviceList = useMemo(() => mergeServices(plan.customServices), [plan.customServices]);
  const services = useMemo(() => indexById(serviceList), [serviceList]);
  const hosts = useMemo(() => computeHostUsage(plan, devices, services), [plan, devices, services]);

  const [pendingService, setPendingService] = useState("");
  const [pendingHost, setPendingHost] = useState("");
  const [composeFor, setComposeFor] = useState<{ label: string; yaml: string } | null>(null);
  const [newService, setNewService] = useState<Service | null>(null);

  const unassigned = plan.serviceInstances
    .filter((instance) => !instance.hostItemId)
    .map((instance) => ({ instance, service: services.get(instance.serviceId) }))
    .filter((row): row is { instance: typeof row.instance; service: Service } => Boolean(row.service));

  function addInstance() {
    if (!pendingService) return;
    setPlan((previous) => ({
      ...previous,
      serviceInstances: [
        ...previous.serviceInstances,
        { id: newId("svc"), serviceId: pendingService, hostItemId: pendingHost || null },
      ],
    }));
    setPendingService("");
  }

  function moveInstance(instanceId: string, hostItemId: string | null) {
    setPlan((previous) => ({
      ...previous,
      serviceInstances: previous.serviceInstances.map((instance) =>
        instance.id === instanceId ? { ...instance, hostItemId } : instance,
      ),
    }));
  }

  function removeInstance(instanceId: string) {
    setPlan((previous) => ({
      ...previous,
      serviceInstances: previous.serviceInstances.filter((instance) => instance.id !== instanceId),
    }));
  }

  function saveCustomService(service: Service) {
    setPlan((previous) => {
      const exists = previous.customServices.some((entry) => entry.id === service.id);
      return {
        ...previous,
        customServices: exists
          ? previous.customServices.map((entry) => (entry.id === service.id ? service : entry))
          : [...previous.customServices, service],
      };
    });
    setNewService(null);
  }

  const totalRam = plan.serviceInstances.reduce(
    (sum, instance) => sum + (services.get(instance.serviceId)?.ramGb ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        title="Services"
        description="What you plan to run and where it lands. Assign a service to a host and the meters tell you whether it fits."
        actions={
          <Button onClick={() => setNewService(emptyService())}>
            <Plus className="h-4 w-4" />
            Custom service
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Services planned" value={plan.serviceInstances.length} icon={<Boxes className="h-3.5 w-3.5" />} />
        <Stat
          label="Hosts"
          value={hosts.length}
          hint={`${hosts.filter((h) => h.status === "over").length} over capacity`}
          tone={hosts.some((h) => h.status === "over") ? "danger" : "default"}
        />
        <Stat label="Memory requested" value={`${formatNumber(totalRam)} GB`} hint="Across every assigned and unassigned service" />
      </div>

      <Card
        className="mt-4"
        title="Add a service"
        description="Pick something from the catalogue and drop it on a host — or leave it unassigned for now."
      >
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Service" className="min-w-52 flex-1">
            {(id) => (
              <Select id={id} value={pendingService} onChange={(event) => setPendingService(event.target.value)}>
                <option value="">Choose a service…</option>
                {SERVICE_CATEGORIES.map((meta) => {
                  const inCategory = serviceList.filter((service) => service.category === meta.id);
                  if (inCategory.length === 0) return null;
                  return (
                    <optgroup key={meta.id} label={meta.label}>
                      {inCategory.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} — {service.cpuCores}c, {service.ramGb}GB
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </Select>
            )}
          </Field>
          <Field label="Host" className="min-w-52 flex-1">
            {(id) => (
              <Select id={id} value={pendingHost} onChange={(event) => setPendingHost(event.target.value)}>
                <option value="">Unassigned</option>
                {hosts.map((host) => (
                  <option key={host.itemId} value={host.itemId}>
                    {host.label} ({host.rackName})
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Button variant="primary" onClick={addInstance} disabled={!pendingService}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </Card>

      {hosts.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icon={<Boxes className="h-8 w-8" />}
            title="No hosts in your racks yet"
            description="Place a server, mini PC, workstation or NAS in the rack builder and it will show up here ready to take services."
          />
        </Card>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {hosts.map((host) => {
            const conflicts = portConflicts(host.services.map((row) => row.service));
            return (
              <Card
                key={host.itemId}
                title={
                  <span className="flex items-center gap-2">
                    {host.label}
                    <Badge tone={host.status}>
                      {host.status === "over" ? "over" : host.status === "tight" ? "tight" : "ok"}
                    </Badge>
                  </span>
                }
                description={`${host.device.name} · ${host.rackName}`}
                actions={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setComposeFor({
                        label: host.label,
                        yaml: toCompose(host.label, host.services.map((row) => row.service)),
                      })
                    }
                  >
                    <FileCode2 className="h-3.5 w-3.5" />
                    Compose
                  </Button>
                }
              >
                <div className="space-y-2.5">
                  <Meter
                    label="CPU"
                    value={host.used.cores}
                    max={host.capacity.cores}
                    detail={`${formatNumber(host.used.cores, 2)} / ${host.capacity.cores || "?"} cores`}
                  />
                  <Meter
                    label="RAM"
                    value={host.used.ramGb}
                    max={host.capacity.ramGb}
                    detail={`${formatNumber(host.used.ramGb)} / ${host.capacity.ramGb || "?"} GB`}
                  />
                  <Meter
                    label="Storage"
                    value={host.used.storageGb}
                    max={host.capacity.storageGb}
                    detail={`${formatStorage(host.used.storageGb)} / ${
                      host.capacity.storageGb ? formatStorage(host.capacity.storageGb) : "?"
                    }`}
                  />
                </div>

                {conflicts.length > 0 && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[0.7rem] text-amber-200">
                    <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                    <span>
                      Port {conflicts.join(", ")} requested more than once — remap one of them in your compose file.
                    </span>
                  </p>
                )}

                <ul className="mt-3 space-y-1">
                  {host.services.map((row) => (
                    <ServiceRow
                      key={row.instanceId}
                      service={row.service}
                      hosts={hosts.map((h) => ({ id: h.itemId, label: h.label }))}
                      currentHost={host.itemId}
                      onMove={(target) => moveInstance(row.instanceId, target)}
                      onRemove={() => removeInstance(row.instanceId)}
                    />
                  ))}
                  {host.services.length === 0 && (
                    <li className="rounded-md border border-dashed border-edge-strong px-2 py-3 text-center text-[0.7rem] text-zinc-500">
                      Nothing assigned yet.
                    </li>
                  )}
                </ul>
              </Card>
            );
          })}
        </div>
      )}

      {unassigned.length > 0 && (
        <Card
          className="mt-4"
          title="Unassigned"
          description="These count towards nothing until they have a host."
        >
          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {unassigned.map(({ instance, service }) => (
              <ServiceRow
                key={instance.id}
                service={service}
                hosts={hosts.map((h) => ({ id: h.itemId, label: h.label }))}
                currentHost=""
                onMove={(target) => moveInstance(instance.id, target)}
                onRemove={() => removeInstance(instance.id)}
              />
            ))}
          </ul>
        </Card>
      )}

      <ComposeModal compose={composeFor} onClose={() => setComposeFor(null)} />

      {newService && (
        <ServiceForm
          service={newService}
          existingIds={serviceList.map((s) => s.id)}
          onClose={() => setNewService(null)}
          onSave={saveCustomService}
        />
      )}
    </>
  );
}

function ServiceRow({
  service,
  hosts,
  currentHost,
  onMove,
  onRemove,
}: {
  service: Service;
  hosts: { id: string; label: string }[];
  currentHost: string;
  onMove: (hostItemId: string | null) => void;
  onRemove: () => void;
}) {
  const accent = serviceCategoryMeta(service.category).accent;
  return (
    <li className="flex items-center gap-1.5 rounded-md border border-edge bg-surface-2/50 px-2 py-1">
      <span className="min-w-0 flex-1 truncate text-xs text-zinc-200">{service.name}</span>
      <span className={cx("shrink-0 rounded border px-1 py-px font-mono text-[0.6rem]", accent)}>
        {service.cpuCores}c · {service.ramGb}G
      </span>
      <select
        value={currentHost}
        onChange={(event) => onMove(event.target.value || null)}
        aria-label={`Host for ${service.name}`}
        className="max-w-24 shrink-0 rounded border border-edge-strong bg-canvas px-1 py-0.5 text-[0.65rem] text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
      >
        <option value="">Unassigned</option>
        {hosts.map((host) => (
          <option key={host.id} value={host.id}>
            {host.label}
          </option>
        ))}
      </select>
      <Button variant="ghost" size="sm" aria-label={`Remove ${service.name}`} onClick={onRemove}>
        <Trash2 className="h-3 w-3" />
      </Button>
    </li>
  );
}

function ComposeModal({
  compose,
  onClose,
}: {
  compose: { label: string; yaml: string } | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!compose) return;
    try {
      await navigator.clipboard.writeText(compose.yaml);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Modal
      open={Boolean(compose)}
      onClose={onClose}
      wide
      title={compose ? `docker-compose.yml — ${compose.label}` : ""}
      description="A skeleton built from the catalogue. Check ports, volumes and environment against each project's docs."
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={copy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </>
      }
    >
      <pre className="scroll-slim overflow-x-auto rounded-lg border border-edge bg-canvas px-3 py-2.5 font-mono text-[0.7rem] leading-relaxed text-zinc-300">
        {compose?.yaml}
      </pre>
    </Modal>
  );
}

function emptyService(): Service {
  return {
    id: "",
    name: "",
    category: "productivity",
    cpuCores: 0.5,
    ramGb: 1,
    storageGb: 10,
    ports: [],
  };
}

function ServiceForm({
  service,
  existingIds,
  onClose,
  onSave,
}: {
  service: Service;
  existingIds: string[];
  onClose: () => void;
  onSave: (service: Service) => void;
}) {
  const [draft, setDraft] = useState<Service>({ ...service });
  const [portText, setPortText] = useState(service.ports.join(", "));

  const set = <K extends keyof Service>(key: K, value: Service[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  function handleSave() {
    const name = draft.name.trim();
    if (!name) return;

    let id = draft.id;
    if (!id) {
      const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "service";
      id = base;
      let suffix = 2;
      while (existingIds.includes(id)) id = `${base}-${suffix++}`;
    }

    const ports = portText
      .split(/[,\s]+/)
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0 && value < 65536);

    onSave({ ...draft, id, name, ports, builtIn: false });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Custom service"
      description="Anything the catalogue is missing. Resource figures are what you expect it to use day to day."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} disabled={!draft.name.trim()}>
            Save service
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2">
          {(id) => <TextInput id={id} value={draft.name} onChange={(e) => set("name", e.target.value)} autoFocus />}
        </Field>
        <Field label="Category">
          {(id) => (
            <Select id={id} value={draft.category} onChange={(e) => set("category", e.target.value as ServiceCategory)}>
              {SERVICE_CATEGORIES.map((meta) => (
                <option key={meta.id} value={meta.id}>
                  {meta.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Docker image" hint="Leave blank if it runs on the host directly.">
          {(id) => (
            <TextInput id={id} value={draft.image ?? ""} onChange={(e) => set("image", e.target.value || undefined)} placeholder="linuxserver/…" />
          )}
        </Field>
        <Field label="CPU cores">
          {(id) => (
            <NumberInput id={id} min={0} step="0.25" value={draft.cpuCores} onChange={(e) => set("cpuCores", Number(e.target.value) || 0)} />
          )}
        </Field>
        <Field label="RAM (GB)">
          {(id) => <NumberInput id={id} min={0} step="0.25" value={draft.ramGb} onChange={(e) => set("ramGb", Number(e.target.value) || 0)} />}
        </Field>
        <Field label="Storage (GB)">
          {(id) => <NumberInput id={id} min={0} value={draft.storageGb} onChange={(e) => set("storageGb", Number(e.target.value) || 0)} />}
        </Field>
        <Field label="Ports" hint="Comma separated.">
          {(id) => <TextInput id={id} value={portText} onChange={(e) => setPortText(e.target.value)} placeholder="8080, 8443" />}
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          {(id) => <Textarea id={id} value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value || undefined)} />}
        </Field>
      </div>
    </Modal>
  );
}
