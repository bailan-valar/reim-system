<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-2xl font-bold">发票详情</h2>
            <span
              :class="[
                'inline-block mt-2 px-3 py-1 rounded text-sm font-medium',
                invoice.status === '未使用'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              ]"
            >
              {{ invoice.status }}
            </span>
          </div>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Invoice Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">发票信息</h3>

            <div>
              <p class="text-sm text-gray-500">发票号码</p>
              <p class="text-base font-medium text-gray-900">{{ invoice.invoiceNumber }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">发票类型</p>
              <p class="text-base text-gray-900">{{ invoice.invoiceType }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">票面总额</p>
              <p class="text-2xl font-bold text-blue-600">¥{{ formatAmount(invoice.totalAmount) }}</p>
            </div>

            <div v-if="invoice.taxRate" class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">税率</p>
                <p class="text-base text-gray-900">{{ invoice.taxRate }}%</p>
              </div>
              <div v-if="invoice.taxAmount">
                <p class="text-sm text-gray-500">税额</p>
                <p class="text-base text-gray-900">¥{{ formatAmount(invoice.taxAmount) }}</p>
              </div>
            </div>

            <div>
              <p class="text-sm text-gray-500">开票日期</p>
              <p class="text-base text-gray-900">{{ formatDate(invoice.invoiceDate) }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500">创建时间</p>
              <p class="text-base text-gray-900">{{ formatDateTime(invoice.createdAt) }}</p>
            </div>

            <div v-if="invoice.usedInItemId">
              <p class="text-sm text-gray-500">关联费用项目</p>
              <p class="text-base text-gray-900">{{ invoice.usedInItemId }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-500 mb-2">附件</p>
              <div class="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span class="text-sm text-gray-700 flex-1 truncate">{{ invoice.fileName }}</span>
                <a
                  :href="invoice.filePath"
                  target="_blank"
                  class="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  下载
                </a>
              </div>
            </div>
          </div>

          <!-- Invoice Preview -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">发票预览</h3>

            <div class="border rounded-lg overflow-hidden bg-gray-50">
              <div v-if="isPDF" class="aspect-[3/4] flex items-center justify-center">
                <iframe
                  :src="invoice.filePath"
                  class="w-full h-full"
                  frameborder="0"
                ></iframe>
              </div>
              <div v-else-if="isImage" class="aspect-[3/4] flex items-center justify-center p-4">
                <img
                  :src="invoice.filePath"
                  :alt="invoice.fileName"
                  class="max-w-full max-h-full object-contain"
                />
              </div>
              <div v-else class="aspect-[3/4] flex items-center justify-center">
                <div class="text-center text-gray-500">
                  <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p>无法预览此文件类型</p>
                  <a
                    :href="invoice.filePath"
                    target="_blank"
                    class="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block"
                  >
                    点击下载查看
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-6 border-t mt-6">
          <button
            @click="$emit('close')"
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InvoiceBox } from '~/types/invoiceBox'

const props = defineProps<{
  invoice: InvoiceBox
}>()

defineEmits<{
  close: []
}>()

const isPDF = computed(() => {
  return props.invoice.fileName.toLowerCase().endsWith('.pdf')
})

const isImage = computed(() => {
  const ext = props.invoice.fileName.toLowerCase()
  return ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg')
})

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

function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
