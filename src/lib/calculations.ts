import type { Transaction } from '../types'

export function calculateNetTotal(transaction: Pick<Transaction, 'pax' | 'basePrice' | 'deliveryFee' | 'packagingFee' | 'addonPrice' | 'discount'>): number {
  return transaction.pax * transaction.basePrice + transaction.deliveryFee + transaction.packagingFee + transaction.addonPrice - transaction.discount
}

export function calculateTotalSpend(transactions: Transaction[]): number {
  return transactions.reduce((total, transaction) => total + calculateNetTotal(transaction), 0)
}

export function calculateAverageCostPerPax(transactions: Transaction[]): number {
  const pax = transactions.reduce((total, transaction) => total + transaction.pax, 0)
  return pax === 0 ? 0 : calculateTotalSpend(transactions) / pax
}

export interface VendorStats { vendor: string; entries: number; totalSpend: number; averageRating: number; onTimePercentage: number }

export function getVendorStats(transactions: Transaction[]): VendorStats[] {
  const grouped = new Map<string, Transaction[]>()
  transactions.forEach((transaction) => grouped.set(transaction.vendor, [...(grouped.get(transaction.vendor) ?? []), transaction]))
  return [...grouped.entries()].map(([vendor, entries]) => {
    const onTime = entries.filter((entry) => entry.onTimeStatus === 'On-Time').length
    return { vendor, entries: entries.length, totalSpend: calculateTotalSpend(entries), averageRating: entries.reduce((sum, entry) => sum + entry.qualityRating, 0) / entries.length, onTimePercentage: entries.length === 0 ? 0 : onTime / entries.length * 100 }
  }).sort((left, right) => right.totalSpend - left.totalSpend)
}
