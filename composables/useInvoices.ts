import type { InvoiceBox } from '~/types/invoiceBox'
import type { ApiResponse } from '~/types/api'

export const useInvoices = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 从发票箱关联发票
  const linkInvoiceBox = async (
    reimbursementId: string,
    itemId: string,
    invoiceBoxId: string
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<InvoiceBox>>(
        `/api/reimbursements/${reimbursementId}/items/${itemId}/link-invoice-box`,
        {
          method: 'POST',
          body: { invoiceBoxId }
        }
      )
      return data
    } catch (e: any) {
      error.value = e.message || '关联发票失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 取消关联发票箱
  const unlinkInvoiceBox = async (
    reimbursementId: string,
    itemId: string,
    invoiceBoxId: string
  ) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(
        `/api/reimbursements/${reimbursementId}/items/${itemId}/unlink-invoice-box`,
        {
          method: 'POST',
          body: { invoiceBoxId }
        }
      )
    } catch (e: any) {
      error.value = e.message || '取消关联失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    linkInvoiceBox,
    unlinkInvoiceBox
  }
}
