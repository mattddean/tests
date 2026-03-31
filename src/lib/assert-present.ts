export function assertPresent<T>(value: T | undefined | null, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}
