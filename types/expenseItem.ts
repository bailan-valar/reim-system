export type ExpenseCategory =
  | '火车'
  | '打车'
  | '飞机'
  | '餐饮'
  | '住宿'
  | '办公'
  | '云服务'
  | '其他'

import type { InvoiceBox } from './invoiceBox'

export interface ExpenseItem {
  id: string
  reimbursementId: string
  amount: number
  date: Date | string
  description?: string | null
  category: ExpenseCategory
  hasInvoice: boolean
  departure?: string | null
  arrival?: string | null
  invoiceBoxes?: InvoiceBox[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateExpenseItemInput {
  amount: number
  date: Date | string
  description?: string
  category: ExpenseCategory
  hasInvoice?: boolean
  departure?: string
  arrival?: string
  invoiceBoxIds?: string[]
}

export interface UpdateExpenseItemInput {
  amount?: number
  date?: Date | string
  description?: string
  category?: ExpenseCategory
  hasInvoice?: boolean
  departure?: string
  arrival?: string
}
