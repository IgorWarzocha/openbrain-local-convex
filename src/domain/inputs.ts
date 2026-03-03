import { z } from "zod";

export const ThoughtSourceSchema = z.enum(["cli", "manual", "api"]);
export type ThoughtSource = z.infer<typeof ThoughtSourceSchema>;

function asFiniteNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return Number.NaN;
}

export function parseThoughtSource(value: unknown, fallback: ThoughtSource = "api"): ThoughtSource {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = ThoughtSourceSchema.safeParse(String(value));
  if (!parsed.success) {
    throw new Error(`invalid source '${String(value)}', expected one of: cli, manual, api`);
  }
  return parsed.data;
}

export function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((tag) => String(tag).trim()).filter(Boolean)));
  }
  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );
  }
  if (value === undefined || value === null) {
    return [];
  }
  throw new Error("tags must be a comma-separated string or string array");
}

export function parseLimit(value: unknown, fallback: number): number {
  const n = value === undefined ? fallback : asFiniteNumber(value);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    throw new Error("limit must be an integer between 1 and 100");
  }
  return n;
}

export function parseThreshold(value: unknown, fallback: number): number {
  const n = value === undefined ? fallback : asFiniteNumber(value);
  if (!Number.isFinite(n) || n < -1 || n > 1) {
    throw new Error("threshold must be a number between -1 and 1");
  }
  return n;
}

