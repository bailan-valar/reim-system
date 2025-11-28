<template>
  <span :class="statusClass" class="px-2 py-1 text-xs font-medium rounded">
    {{ statusText }}
  </span>
</template>

<script setup lang="ts">
import type { InvoiceStatus } from '~/utils/invoiceStatus'
import { getInvoiceStatusBadgeClass } from '~/utils/invoiceStatus'

const props = defineProps<{
  status: InvoiceStatus
  count: number
}>()

const statusClass = computed(() => {
  return getInvoiceStatusBadgeClass(props.status)
})

const statusText = computed(() => {
  if (props.count === 0) {
    return '未上传发票'
  }
  return `${props.status} (${props.count}张)`
})
</script>
