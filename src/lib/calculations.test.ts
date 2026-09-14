import { describe, expect, it } from 'vitest'
import { calculateNetTotal, getVendorStats } from './calculations'
import { dateMatchesRange } from './dateRange'
import type { Transaction } from '../types'

const transaction: Transaction = { id: '1', userId: 'u', date: '2026-09-14', mealSlot: 'Lunch', vendor: 'Dapur Nusa', planType: 'Standard', pax: 10, basePrice: 30000, deliveryFee: 20000, courierType: 'Internal Provider', shippingDistanceKm: 2, packagingFee: 5000, packagingDeposit: 0, depositReturned: false, addonItems: '', addonPrice: 10000, voucherCode: '', discount: 5000, paymentStatus: 'Paid', paymentMethod: 'Bank Transfer', onTimeStatus: 'On-Time', qualityRating: 5, packagingCondition: 'Intact', menuNotes: '', createdAt: '', updatedAt: '' }

describe('calculations', () => {
  it('calculates the shared net total formula', () => expect(calculateNetTotal(transaction)).toBe(330000))
  it('groups vendor performance and guards percentages', () => expect(getVendorStats([transaction])[0]).toMatchObject({ vendor: 'Dapur Nusa', entries: 1, totalSpend: 330000, onTimePercentage: 100 }))
  it('matches a date against a preset', () => expect(dateMatchesRange('2026-09-14', 'Today', new Date('2026-09-14T12:00:00'))).toBe(true))
})
