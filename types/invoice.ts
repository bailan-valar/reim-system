export interface Invoice {
  id: string
  expenseItemId: string
  fileName: string
  filePath: string
  amount: number
  date: Date | string
  description?: string | null
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
}
