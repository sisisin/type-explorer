export function isNonNullable<T extends unknown>(v: T): v is NonNullable<T> {
  return v != null;
}
export function assert(msg: string): string {
  throw new Error(msg);
}

export function getIdGenerator() {
  let id = 0;
  return () => ++id;
}
