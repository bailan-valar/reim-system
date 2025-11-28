export type InvoiceStatus = '未上传' | '未完全上传' | '已上传' | '已超出'

export function calculateInvoiceStatus(
  expenseAmount: number,
  invoices: { amount: number }[]
): InvoiceStatus {
  if (invoices.length === 0) {
    return '未上传'
  }

  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0)

  if (totalInvoiceAmount < expenseAmount) {
    return '未完全上传'
  } else if (totalInvoiceAmount === expenseAmount) {
    return '已上传'
  } else {
    return '已超出'  // 替票场景
  }
}
