import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "short",
    timeStyle: "short",
  },
) {
  if (!value) {
    return "-";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", options).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

export function formatDuration(hours: number | null | undefined) {
  if (hours === null || hours === undefined) {
    return "-";
  }

  return `${hours.toFixed(1)}h`;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function sanitizeFilename(value: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9._-]/g, "-");
  return sanitized.slice(0, 120) || "arquivo";
}

export function compact<T>(values: Array<T | null | undefined>) {
  return values.filter((value): value is T => value !== null && value !== undefined);
}
