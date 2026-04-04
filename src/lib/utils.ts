import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy", { locale: es });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return format(new Date(date), "dd MMM yyyy HH:mm", { locale: es });
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatCurrency(
  amount: number | string,
  currency: "ARS" | "USD" | "EUR" = "ARS"
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR").format(num);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateInvoiceNumber(prefix: string, nextNumber: number): string {
  return `${prefix}-${new Date().getFullYear()}-${String(nextNumber).padStart(4, "0")}`;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "…";
}

export function bytesToHuman(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function getColorByStatus(status: string): string {
  const map: Record<string, string> = {
    PLANNING: "blue",
    ACTIVE: "green",
    ON_HOLD: "yellow",
    COMPLETED: "emerald",
    CANCELLED: "red",
    TODO: "slate",
    IN_PROGRESS: "blue",
    IN_REVIEW: "purple",
    BLOCKED: "red",
    DONE: "green",
    BACKLOG: "slate",
    DRAFT: "slate",
    SENT: "blue",
    PAID: "green",
    OVERDUE: "red",
    LEAD: "slate",
    CONTACTED: "blue",
    PROPOSAL_SENT: "yellow",
    NEGOTIATION: "orange",
    WON: "green",
    LOST: "red",
  };
  return map[status] ?? "slate";
}
