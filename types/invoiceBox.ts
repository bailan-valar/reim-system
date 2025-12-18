export type InvoiceBoxStatus = '未使用' | '已使用'

export type InvoiceType =
  | '增值税专用发票'
  | '增值税普通发票'
  | '增值税电子普通发票'
  | '增值税电子专用发票'
  | '其他'

export interface InvoiceBox {
  id: string
  invoiceNumber: string
  invoiceType: InvoiceType
  totalAmount: number
  taxRate?: number | null
  taxAmount?: number | null
  invoiceDate: Date | string
  buyerName?: string | null
  remark?: string | null
  tags?: string | null
  fileName: string
  filePath: string
  status: InvoiceBoxStatus
  usedInItemId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  // 关联的费用项目信息
  expenseItem?: {
    id: string
    description: string | null
    amount: number
    date: Date | string
    category: string
    reimbursement: {
      id: string
      title: string
      status: string
    }
  } | null
}

export interface CreateInvoiceBoxInput {
  invoiceNumber: string
  invoiceType: InvoiceType
  totalAmount: number
  taxRate?: number
  taxAmount?: number
  invoiceDate: Date | string
  buyerName?: string
  remark?: string
  tags?: string
  fileName: string
  filePath: string
}

export interface UpdateInvoiceBoxInput {
  invoiceNumber?: string
  invoiceType?: InvoiceType
  totalAmount?: number
  taxRate?: number
  taxAmount?: number
  invoiceDate?: Date | string
  buyerName?: string
  remark?: string
  tags?: string
  status?: InvoiceBoxStatus
  usedInItemId?: string
}
