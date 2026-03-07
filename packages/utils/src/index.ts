export function formatStatus(count: number): string {
  return `${count.toString().padStart(2, '0')} checks wired`
}
