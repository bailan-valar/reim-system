import type { Invoice } from '~/types/invoice'
import type { ApiResponse, BulkInvoiceUploadResponse } from '~/types/api'

export const useInvoices = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 上传单张发票
  const uploadInvoice = async (
    reimbursementId: string,
    itemId: string,
    file: File
  ) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await $fetch<ApiResponse<Invoice>>(
        `/api/reimbursements/${reimbursementId}/items/${itemId}/invoices/upload`,
        {
          method: 'POST',
          body: formData
        }
      )
      return data
    } catch (e: any) {
      error.value = e.message || '上传发票失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 批量上传发票
  const uploadInvoices = async (
    reimbursementId: string,
    itemId: string,
    files: File[]
  ) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const { data } = await $fetch<ApiResponse<BulkInvoiceUploadResponse>>(
        `/api/reimbursements/${reimbursementId}/items/${itemId}/invoices/bulk-upload`,
        {
          method: 'POST',
          body: formData
        }
      )
      return data
    } catch (e: any) {
      error.value = e.message || '批量上传发票失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 删除发票
  const deleteInvoice = async (
    reimbursementId: string,
    itemId: string,
    invoiceId: string
  ) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(
        `/api/reimbursements/${reimbursementId}/items/${itemId}/invoices/${invoiceId}`,
        {
          method: 'DELETE'
        }
      )
    } catch (e: any) {
      error.value = e.message || '删除发票失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 获取费用项目的所有发票
  const fetchInvoices = async (
    reimbursementId: string,
    itemId: string
  ) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<Invoice[]>>(
        `/api/reimbursements/${reimbursementId}/items/${itemId}/invoices`
      )
      return data
    } catch (e: any) {
      error.value = e.message || '获取发票列表失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    uploadInvoice,
    uploadInvoices,
    deleteInvoice,
    fetchInvoices
  }
}
