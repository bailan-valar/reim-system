<template>
  <span :class="statusClass" class="px-2 py-1 text-xs font-medium rounded">
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import type { InvoiceStatus } from '~/utils/invoiceStatus'
import { getInvoiceStatusBadgeClass } from '~/utils/invoiceStatus'
import { formatCurrency } from '~/utils/formatters'

const props = defineProps<{
  status: InvoiceStatus
  count: number
  expenseAmount?: number
  totalInvoiceAmount?: number
}>()

const statusClass = computed(() => {
  return getInvoiceStatusBadgeClass(props.status)
})

const statusText = computed(() => {
  if (props.count === 0) {
    return '未上传发票'
  }

  let text = `${props.status} (${props.count}张)`

  // 如果状态是"未完全上传"，显示还差多少金额
  if (props.status === '未完全上传' && props.expenseAmount && props.totalInvoiceAmount !== undefined) {
    const difference = props.expenseAmount - props.totalInvoiceAmount
    if (difference > 0) {
      text += ` 还差${formatCurrency(difference)}`
    }
  }

  return text
})
</script>
