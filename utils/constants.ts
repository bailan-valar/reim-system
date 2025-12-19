// Reimbursement status constants
export const REIMBURSEMENT_STATUSES = [
  '待整理',
  '待打印单据',
  '待审批',
  '待打款',
  '已完成'
] as const

export type ReimbursementStatus = typeof REIMBURSEMENT_STATUSES[number]

// Expense category constants
export const EXPENSE_CATEGORIES = [
  '交通',
  '餐饮',
  '住宿',
  '办公',
  '其他'
] as const

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]

// Status colors for UI
export const STATUS_COLORS: Record<ReimbursementStatus, string> = {
  '待整理': 'bg-gray-100 text-gray-800',
  '待打印单据': 'bg-blue-100 text-blue-800',
  '待审批': 'bg-yellow-100 text-yellow-800',
  '待打款': 'bg-purple-100 text-purple-800',
  '已完成': 'bg-green-100 text-green-800'
}

// File upload constants
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/ofd', 'application/x-ofd']
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const UPLOAD_DIR = '/uploads/invoices'
