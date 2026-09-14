export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'
export type PaymentStatus = 'Paid' | 'Unpaid / Payable' | 'Pending Reimbursement' | 'Deposit Deduction'
export type PaymentMethod = 'Bank Transfer' | 'E-Wallet' | 'Prepaid Balance' | 'Cash'
export type CourierType = 'Internal Provider' | 'Gojek / Grab Express' | 'Self Pickup'
export type OnTimeStatus = 'On-Time' | 'Delayed' | 'Missed'
export type PackagingCondition = 'Intact' | 'Damaged/Spilled'

export interface Transaction {
  id: string
  userId: string
  date: string
  mealSlot: MealSlot
  vendor: string
  planType: string
  pax: number
  basePrice: number
  deliveryFee: number
  courierType: CourierType
  shippingDistanceKm: number
  packagingFee: number
  packagingDeposit: number
  depositReturned: boolean
  addonItems: string
  addonPrice: number
  voucherCode: string
  discount: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  onTimeStatus: OnTimeStatus
  qualityRating: 1 | 2 | 3 | 4 | 5
  packagingCondition: PackagingCondition
  menuNotes: string
  createdAt: string
  updatedAt: string
}

export interface Budget { userId: string; monthlyCap: number; updatedAt: string }
