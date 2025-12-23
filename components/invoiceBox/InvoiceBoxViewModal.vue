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

            <div v-if="invoice.buyerName">
              <p class="text-sm text-gray-500">购买方名称</p>
              <p class="text-base text-gray-900">{{ invoice.buyerName }}</p>
            </div>

            <div v-if="invoice.expenseCategory">
              <p class="text-sm text-gray-500">费用项目</p>
              <p class="text-base font-medium text-gray-900">{{ invoice.expenseCategory }}</p>
            </div>

            <div v-if="invoice.remark">
              <p class="text-sm text-gray-500">备注</p>
              <p class="text-base text-gray-900 whitespace-pre-wrap">{{ invoice.remark }}</p>
            </div>

            <div v-if="invoice.tags">
              <p class="text-sm text-gray-500 mb-2">标签</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="tag in parseTags(invoice.tags)"
                  :key="tag"
                  class="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <div>
              <p class="text-sm text-gray-500">创建时间</p>
              <p class="text-base text-gray-900">{{ formatDateTime(invoice.createdAt) }}</p>
            </div>

            <!-- Linked Reimbursement Details -->
            <div v-if="invoice.expenseItem" class="bg-blue-50 rounded-lg p-4 space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-blue-900">关联报销单</h4>
                <span
                  :class="[
                    'px-3 py-1 rounded text-xs font-medium',
                    getStatusColor(invoice.expenseItem.reimbursement.status)
                  ]"
                >
                  {{ invoice.expenseItem.reimbursement.status }}
                </span>
              </div>

              <div>
                <p class="text-xs text-blue-600 mb-1">报销单标题</p>
                <p class="text-base font-medium text-blue-900">{{ invoice.expenseItem.reimbursement.title }}</p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-xs text-blue-600">费用类别</p>
                  <p class="text-sm text-blue-900">{{ invoice.expenseItem.category }}</p>
                </div>
                <div>
                  <p class="text-xs text-blue-600">费用金额</p>
                  <p class="text-sm font-semibold text-blue-900">¥{{ formatAmount(invoice.expenseItem.amount) }}</p>
                </div>
              </div>

              <div>
                <p class="text-xs text-blue-600">费用日期</p>
                <p class="text-sm text-blue-900">{{ formatDate(invoice.expenseItem.date) }}</p>
              </div>

              <div v-if="invoice.expenseItem.description">
                <p class="text-xs text-blue-600">费用说明</p>
                <p class="text-sm text-blue-900">{{ invoice.expenseItem.description }}</p>
              </div>

              <div class="pt-2 border-t border-blue-200 flex items-center justify-between">
                <NuxtLink
                  :to="`/reimbursements/${invoice.expenseItem.reimbursement.id}`"
                  class="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                >
                  查看完整报销单
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </NuxtLink>
                <button
                  @click="handleUnlink"
                  :disabled="unlinking"
                  class="text-sm text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                  {{ unlinking ? '取消中...' : '取消关联' }}
                </button>
              </div>
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
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="text-lg font-semibold text-gray-900">发票预览</h3>
              <div v-if="isPDF && pdfDimensions" class="text-sm text-gray-600">
                <span class="font-medium">尺寸:</span>
                {{ Math.round(pdfDimensions.width) }} × {{ Math.round(pdfDimensions.height) }} px
              </div>
              <div v-else-if="isPDF && loadingDimensions" class="text-sm text-gray-500">
                <span class="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1"></span>
                获取尺寸中...
              </div>
            </div>
                {{ invoice.filePath }}

            <div class="border rounded-lg overflow-hidden bg-gray-50">
              <div v-if="isPDF" class="aspect-[3/4] flex items-center justify-center">
                <iframe
                  ref="pdfIframe"
                  :src="invoice.filePath"
                  class="w-full h-full"
                  frameborder="0"
                  @load="handlePdfLoad"
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
        <div class="flex justify-between items-center pt-6 border-t mt-6">
          <button
            @click="handleDelete"
            :disabled="deleting"
            class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {{ deleting ? '删除中...' : '删除发票' }}
          </button>
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
import { waitForPdfDimensions, type PdfDimensions } from '~/utils/pdfDimensions'

const props = defineProps<{
  invoice: InvoiceBox
}>()

const emit = defineEmits<{
  close: []
  unlinked: []
  deleted: []
}>()

const unlinking = ref(false)
const deleting = ref(false)
const pdfIframe = ref<HTMLIFrameElement | null>(null)
const pdfDimensions = ref<PdfDimensions | null>(null)
const loadingDimensions = ref(false)

async function handlePdfLoad() {
  if (!pdfIframe.value) return

  loadingDimensions.value = true
  try {
    const dimensions = await waitForPdfDimensions(pdfIframe.value)
    if (dimensions) {
      pdfDimensions.value = dimensions
      console.log('[InvoiceBoxViewModal] PDF dimensions loaded:', dimensions)
    }
  } catch (error) {
    console.error('[InvoiceBoxViewModal] Failed to get PDF dimensions:', error)
  } finally {
    loadingDimensions.value = false
  }
}

async function handleUnlink() {
  if (!confirm('确定要取消与报销单的关联吗？取消后该发票将恢复为"未使用"状态。')) {
    return
  }

  unlinking.value = true
  try {
    await $fetch('/api/invoice-box/unlink', {
      method: 'POST',
      body: {
        invoiceId: props.invoice.id
      }
    })

    alert('取消关联成功')
    emit('unlinked')
    emit('close')
  } catch (error: any) {
    console.error('取消关联失败:', error)
    alert(error.data?.message || '取消关联失败')
  } finally {
    unlinking.value = false
  }
}

async function handleDelete() {
  const confirmMessage = props.invoice.status === '已使用'
    ? '确定要删除此发票吗？删除后将自动取消与报销单的关联，且无法恢复。'
    : '确定要删除此发票吗？删除后无法恢复。'

  if (!confirm(confirmMessage)) {
    return
  }

  deleting.value = true
  try {
    await $fetch(`/api/invoice-box/${props.invoice.id}`, {
      method: 'DELETE'
    })

    alert('发票删除成功')
    emit('deleted')
    emit('close')
  } catch (error: any) {
    console.error('删除发票失败:', error)
    alert(error.data?.message || '删除发票失败')
  } finally {
    deleting.value = false
  }
}

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
