import type { ExpenseItem } from './expenseItem'
import type { Company } from './company'

export type ReimbursementType =
  | '现金报销'
  | '差旅费报销'

export type ReimbursementStatus =
  | '待整理'
  | '待打印单据'
  | '待审批'
  | '待打款'
  | '已完成'

export interface Reimbursement {
  id: string
  title: string
  description?: string | null
  type: ReimbursementType
  status: ReimbursementStatus
  totalAmount: number
  startDate?: Date | string | null
  endDate?: Date | string | null
  companyId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  items?: ExpenseItem[]
  company?: Company | null
}

export interface CreateReimbursementInput {
  title: string
  description?: string
  type?: ReimbursementType
  status?: ReimbursementStatus
  startDate?: string
  endDate?: string
  companyId?: string
}

export interface UpdateReimbursementInput {
  title?: string
  description?: string
  type?: ReimbursementType
  status?: ReimbursementStatus
  startDate?: string | null
  endDate?: string | null
  companyId?: string | null
}

export interface ReimbursementListQuery {
  status?: ReimbursementStatus
  companyId?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount' | 'startDate'
  order?: 'asc' | 'desc'
}
