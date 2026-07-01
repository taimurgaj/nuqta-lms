import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function generateClassCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

export function generateUrduJoinCode(): string {
  const digits = "۰۱۲۳۴۵۶۷۸۹";
  return Array.from({ length: 8 }, () =>
    digits[Math.floor(Math.random() * digits.length)]
  ).join("");
}

export function formatUrduDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("ur-PK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getGradeColor(grade: number | null): string {
  if (grade === null) return "text-gray-500";
  if (grade >= 90) return "text-green-600";
  if (grade >= 75) return "text-blue-600";
  if (grade >= 60) return "text-yellow-600";
  return "text-red-600";
}
