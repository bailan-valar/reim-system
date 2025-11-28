export type ExpenseCategory =
  | '交通'
  | '餐饮'
  | '住宿'
  | '办公'
  | '其他'

export interface ExpenseItem {
  id: string
  reimbursementId: string
  amount: number
  date: Date | string
  description?: string | null
  category: ExpenseCategory
  invoiceFileName?: string | null
  invoiceFilePath?: string | null
  hasInvoice: boolean
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
