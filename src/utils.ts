export function isNonNullable<T extends unknown>(v: T): v is NonNullable<T> {
  return v != null;
}
