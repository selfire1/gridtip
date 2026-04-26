export function getMostRecent<
  TKey extends keyof T,
  T extends { [key in TKey]: Date } & Record<string, unknown>,
>(array: T[], dateKey: keyof T) {
  return Math.max(...array.map((item) => item[dateKey].getTime()))
}
