export interface Invoice {
  id: string
  expenseItemId: string
  fileName: string
  filePath: string
  amount: number
  date: Date | string
  description?: string | null
  expenseCategory?: string | null  // 费用项目名称（从OCR识别的Name字段）
  uploadedAt: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateInvoiceInput {
  fileName: string
  filePath: string
  amount: number
  date: Date | string
  description?: string
  expenseCategory?: string  // 费用项目名称（从OCR识别的Name字段）
}
