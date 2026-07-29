export class CanonicalSerializationError extends Error {
  constructor(
    readonly path: string,
    message: string,
  ) {
    super(`${path}: ${message}`);
    this.name = "CanonicalSerializationError";
  }
}

function isPlainObject(
  value: object,
): value is Readonly<Record<string, unknown>> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function canonicalize(value: unknown, path: string): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new CanonicalSerializationError(
        path,
        "numbers must be finite",
      );
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) =>
      canonicalize(item, `${path}[${index}]`),
    );
  }
  if (typeof value === "object") {
    if (!isPlainObject(value)) {
      throw new CanonicalSerializationError(
        path,
        "only plain objects are supported",
      );
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort(compareText)) {
      const child = value[key];
      if (child === undefined) continue;
      result[key] = canonicalize(child, `${path}.${key}`);
    }
    return result;
  }
  throw new CanonicalSerializationError(
    path,
    `unsupported value type: ${typeof value}`,
  );
}

export function canonicalStringifyV2(value: unknown): string {
  return JSON.stringify(canonicalize(value, "$"));
}
