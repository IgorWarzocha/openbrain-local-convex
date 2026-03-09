function asFiniteNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }
  return Number.NaN;
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
