import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const BRAZIL_TIME_ZONE = "America/Sao_Paulo";
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
) {
  if (!value) {
    return "-";
  }

  try {
    const parsedDate = DATE_ONLY_PATTERN.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date(value);

    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: BRAZIL_TIME_ZONE,
      ...options,
    }).format(parsedDate);
  } catch {
    return value;
  }
}

export function formatDateOnly(value: string | null | undefined) {
  return formatDate(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
