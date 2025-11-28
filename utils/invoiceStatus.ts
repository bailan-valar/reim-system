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

export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const colors = {
    '未上传': 'gray',
    '未完全上传': 'yellow',
    '已上传': 'green',
    '已超出': 'orange'
  }
  return colors[status]
}

export function getInvoiceStatusBadgeClass(status: InvoiceStatus): string {
  const classes = {
    '未上传': 'bg-gray-100 text-gray-800',
    '未完全上传': 'bg-yellow-100 text-yellow-800',
    '已上传': 'bg-green-100 text-green-800',
    '已超出': 'bg-orange-100 text-orange-800'
  }
  return classes[status]
}
