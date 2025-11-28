export type ExpenseCategory =
  | '交通'
  | '餐饮'
  | '住宿'
  | '办公'
  | '其他'

import type { Invoice } from './invoice'

export interface ExpenseItem {
  id: string
  reimbursementId: string
  amount: number
  date: Date | string
  description?: string | null
  category: ExpenseCategory
  invoices?: Invoice[]
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateExpenseItemInput {
  amount: number
  date: Date | string
  description?: string
  category: ExpenseCategory
}

export interface UpdateExpenseItemInput {
  amount?: number
  date?: Date | string
  description?: string
  category?: ExpenseCategory
}
