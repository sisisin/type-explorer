export function isNonNullable<T extends unknown>(v: T): v is NonNullable<T> {
  return v != null;
}
export function assert(msg: string): string {
  throw new Error(msg);
}

export function getOrThrow<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Value must be non nullable');
  return value;
}

export function getIdGenerator() {
  let id = 0;
  return () => ++id;
}
