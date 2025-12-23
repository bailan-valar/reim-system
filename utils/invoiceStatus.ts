export type InvoiceStatus = '未上传' | '已开票待上传' | '未完全上传' | '已上传' | '已超出'

export function calculateInvoiceStatus(
  expenseAmount: number,
  invoices: { amount: number }[],
  hasInvoice: boolean = false
): InvoiceStatus {
  if (invoices.length === 0) {
    return hasInvoice ? '已开票待上传' : '未上传'
  }

  // 使用整数运算避免浮点数精度问题（转换为分）
  const expenseAmountCents = Math.round(expenseAmount * 100)
  const totalInvoiceAmountCents = invoices.reduce((sum, inv) => sum + Math.round(inv.amount * 100), 0)

  if (totalInvoiceAmountCents < expenseAmountCents) {
    return '未完全上传'
  } else if (totalInvoiceAmountCents === expenseAmountCents) {
    return '已上传'
  } else {
    return '已超出'  // 替票场景
  }
}

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const colors = {
    '未上传': 'gray',
    '已开票待上传': 'blue',
    '未完全上传': 'yellow',
    '已上传': 'green',
    '已超出': 'orange'
  }
  return colors[status]
}

export function getInvoiceStatusBadgeClass(status: InvoiceStatus): string {
  const classes = {
    '未上传': 'bg-gray-100 text-gray-800',
    '已开票待上传': 'bg-blue-100 text-blue-800',
    '未完全上传': 'bg-yellow-100 text-yellow-800',
    '已上传': 'bg-green-100 text-green-800',
    '已超出': 'bg-orange-100 text-orange-800'
  }
  return classes[status]
}
