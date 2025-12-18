<template>
  <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
    <!-- Status badge -->
    <div class="flex justify-between items-start mb-3">
      <span
        :class="[
          'px-2 py-1 rounded text-xs font-medium',
          invoice.status === '未使用'
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        ]"
      >
        {{ invoice.status }}
      </span>
      <div class="flex gap-2">
        <button
          @click="$emit('view', invoice)"
          class="text-blue-600 hover:text-blue-700 text-sm"
          title="查看"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          v-if="invoice.status === '未使用'"
          @click="$emit('edit', invoice)"
          class="text-gray-600 hover:text-gray-700 text-sm"
          title="编辑"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          v-if="invoice.status === '未使用'"
          @click="$emit('delete', invoice)"
          class="text-red-600 hover:text-red-700 text-sm"
          title="删除"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Invoice info -->
    <div class="space-y-2">
      <div>
        <p class="text-xs text-gray-500">发票号码</p>
        <p class="font-medium text-gray-900 truncate">{{ invoice.invoiceNumber }}</p>
      </div>

      <div>
        <p class="text-xs text-gray-500">发票类型</p>
        <p class="text-sm text-gray-700">{{ invoice.invoiceType }}</p>
      </div>

      <div class="flex justify-between items-center">
        <div>
          <p class="text-xs text-gray-500">票面总额</p>
          <p class="text-lg font-bold text-blue-600">¥{{ formatAmount(invoice.totalAmount) }}</p>
        </div>
        <div v-if="invoice.taxRate" class="text-right">
          <p class="text-xs text-gray-500">税率</p>
          <p class="text-sm text-gray-700">{{ invoice.taxRate }}%</p>
        </div>
      </div>

      <div v-if="invoice.taxAmount" class="flex justify-between items-center">
        <div>
          <p class="text-xs text-gray-500">税额</p>
          <p class="text-sm text-gray-700">¥{{ formatAmount(invoice.taxAmount) }}</p>
        </div>
      </div>

      <div>
        <p class="text-xs text-gray-500">开票日期</p>
        <p class="text-sm text-gray-700">{{ formatDate(invoice.invoiceDate) }}</p>
      </div>

      <div v-if="invoice.buyerName">
        <p class="text-xs text-gray-500">购买方</p>
        <p class="text-sm text-gray-700 truncate" :title="invoice.buyerName">{{ invoice.buyerName }}</p>
      </div>

      <div v-if="invoice.remark">
        <p class="text-xs text-gray-500">备注</p>
        <p class="text-sm text-gray-700 line-clamp-2" :title="invoice.remark">{{ invoice.remark }}</p>
      </div>

      <!-- Tags -->
      <div v-if="invoice.tags" class="flex flex-wrap gap-1">
        <span
          v-for="tag in parseTags(invoice.tags)"
          :key="tag"
          class="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Linked Reimbursement Info -->
      <div v-if="invoice.expenseItem" class="pt-2 border-t">
        <p class="text-xs text-gray-500 mb-1">关联报销单</p>
        <div class="bg-blue-50 rounded p-2 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-blue-900 truncate">
              {{ invoice.expenseItem.reimbursement.title }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 rounded text-xs',
                getStatusColor(invoice.expenseItem.reimbursement.status)
              ]"
            >
              {{ invoice.expenseItem.reimbursement.status }}
            </span>
          </div>
          <div class="text-xs text-blue-700">
            <span>{{ invoice.expenseItem.category }}</span>
            <span class="mx-1">·</span>
            <span>¥{{ formatAmount(invoice.expenseItem.amount) }}</span>
          </div>
        </div>
      </div>

      <!-- Attachment indicator -->
      <div class="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <span class="truncate">{{ invoice.fileName }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InvoiceBox } from '~/types/invoiceBox'

defineProps<{
  invoice: InvoiceBox
}>()

defineEmits<{
  edit: [invoice: InvoiceBox]
  delete: [invoice: InvoiceBox]
  view: [invoice: InvoiceBox]
}>()

function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  return tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    '待整理': 'bg-yellow-100 text-yellow-800',
    '待打印单据': 'bg-orange-100 text-orange-800',
    '待审批': 'bg-blue-100 text-blue-800',
    '待打款': 'bg-purple-100 text-purple-800',
    '已完成': 'bg-green-100 text-green-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
</script>
