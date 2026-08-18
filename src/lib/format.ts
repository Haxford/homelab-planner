import type { Settings } from "@/lib/types";

const CURRENCY_LOCALE: Record<Settings["currency"], string> = {
  GBP: "en-GB",
  USD: "en-US",
  EUR: "de-DE",
};

export function formatCurrency(value: number, currency: Settings["currency"], fractionDigits = 0) {
  return new Intl.NumberFormat(CURRENCY_LOCALE[currency] ?? "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatWatts(watts: number) {
  const value = Number.isFinite(watts) ? watts : 0;
  if (value >= 1000) return `${(value / 1000).toFixed(2)} kW`;
  return `${Math.round(value)} W`;
}

export function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits }).format(
    Number.isFinite(value) ? value : 0,
  );
}

export function formatStorage(gb: number) {
  if (gb >= 1000) return `${formatNumber(gb / 1000, 1)} TB`;
  return `${formatNumber(gb, 0)} GB`;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
