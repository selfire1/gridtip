export function getWithoutDiacritics(original: string) {
  return original.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
