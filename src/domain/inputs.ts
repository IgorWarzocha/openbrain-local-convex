function asFiniteNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return Number.NaN;
}

function toUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isCanonicalDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === (month ?? 1) - 1 &&
    utc.getUTCDate() === day
  );
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

export function parseDateFilter(value: unknown, now: Date = new Date()): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error("date must be today, yesterday, or YYYY-MM-DD");
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "today") {
    return toUtcDateString(now);
  }
  if (normalized === "yesterday") {
    const yesterday = new Date(now.getTime());
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return toUtcDateString(yesterday);
  }
  if (isCanonicalDateString(normalized)) {
    return normalized;
  }
  throw new Error("date must be today, yesterday, or YYYY-MM-DD");
}

export function parseCanonicalDateFilter(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error("date must be YYYY-MM-DD");
  }
  const normalized = value.trim();
  if (isCanonicalDateString(normalized)) {
    return normalized;
  }
  throw new Error("date must be YYYY-MM-DD");
}

function parseBoundedInteger(value: unknown, fallback: number, fieldName: string): number {
  const n = value === undefined ? fallback : asFiniteNumber(value);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    throw new Error(`${fieldName} must be an integer between 1 and 100`);
  }
  return n;
}

function parseCanonicalBoundedIntegerString(value: string, fieldName: string): number {
  if (!/^(?:[1-9]\d?|100)$/.test(value)) {
    throw new Error(`${fieldName} must be an integer between 1 and 100`);
  }
  return Number(value);
}

export function parseLimit(value: unknown, fallback: number): number {
  return parseBoundedInteger(value, fallback, "limit");
}

export function parseRecent(value: unknown): number {
  if (typeof value === "string") {
    return parseCanonicalBoundedIntegerString(value, "recent");
  }
  return parseBoundedInteger(value, 1, "recent");
}

export function parseThreshold(value: unknown, fallback: number): number {
  const n = value === undefined ? fallback : asFiniteNumber(value);
  if (!Number.isFinite(n) || n < -1 || n > 1) {
    throw new Error("threshold must be a number between -1 and 1");
  }
  return n;
}
