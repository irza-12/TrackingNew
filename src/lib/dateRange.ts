export type DateRangePreset = 'All Time' | 'Today' | 'Yesterday' | 'This Week' | 'Last 7 Days' | 'This Month' | 'Last Month' | 'Custom Range'

function startOfDay(date: Date): Date { const result = new Date(date); result.setHours(0, 0, 0, 0); return result }
function endOfDay(date: Date): Date { const result = new Date(date); result.setHours(23, 59, 59, 999); return result }

export function dateMatchesRange(dateValue: string, preset: DateRangePreset, now = new Date(), customStart?: string, customEnd?: string): boolean {
  if (preset === 'All Time') return true
  const date = startOfDay(new Date(`${dateValue}T00:00:00`)); const today = startOfDay(now)
  let start = today; let end = endOfDay(today)
  if (preset === 'Yesterday') { start.setDate(start.getDate() - 1); end = endOfDay(start) }
  if (preset === 'This Week') { start.setDate(start.getDate() - start.getDay()); end = endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)) }
  if (preset === 'Last 7 Days') { start.setDate(start.getDate() - 6) }
  if (preset === 'This Month') { start = new Date(today.getFullYear(), today.getMonth(), 1); end = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0)) }
  if (preset === 'Last Month') { start = new Date(today.getFullYear(), today.getMonth() - 1, 1); end = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0)) }
  if (preset === 'Custom Range') { if (!customStart || !customEnd) return false; start = startOfDay(new Date(`${customStart}T00:00:00`)); end = endOfDay(new Date(`${customEnd}T00:00:00`)) }
  return date >= start && date <= end
}
