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
  fileName: string
  filePath: string
  status: InvoiceBoxStatus
  usedInItemId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface CreateInvoiceBoxInput {
  invoiceNumber: string
  invoiceType: InvoiceType
  totalAmount: number
  taxRate?: number
  taxAmount?: number
  invoiceDate: Date | string
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
  status?: InvoiceBoxStatus
  usedInItemId?: string
}
