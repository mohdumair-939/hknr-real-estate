/** Storage keys are generated server-side; this guards anything that reaches a filesystem path or URL. */
export function assertSafeKey(key: string): void {
  if (!/^[a-z0-9][a-z0-9/_.-]*$/.test(key) || key.includes("..") || key.includes("//")) {
    throw new Error("Unsafe storage key");
  }
}
