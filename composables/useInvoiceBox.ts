import type { InvoiceBox, CreateInvoiceBoxInput, UpdateInvoiceBoxInput } from '~/types/invoiceBox'
import type { ApiResponse } from '~/types/api'

export const useInvoiceBox = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取发票箱列表
  const fetchInvoiceBoxList = async (status?: string) => {
    loading.value = true
    error.value = null

    try {
      const query = status ? `?status=${status}` : ''
      const { data } = await $fetch<ApiResponse<InvoiceBox[]>>(
        `/api/invoice-box${query}`
      )
      return data
    } catch (e: any) {
      error.value = e.message || '获取发票箱列表失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 获取单个发票箱详情
  const fetchInvoiceBox = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<InvoiceBox>>(
        `/api/invoice-box/${id}`
      )
      return data
    } catch (e: any) {
      error.value = e.message || '获取发票详情失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 创建发票箱记录
  const createInvoiceBox = async (input: CreateInvoiceBoxInput) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<InvoiceBox>>(
        '/api/invoice-box',
        {
          method: 'POST',
          body: input
        }
      )
      return data
    } catch (e: any) {
      error.value = e.message || '创建发票失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 更新发票箱记录
  const updateInvoiceBox = async (id: string, input: UpdateInvoiceBoxInput) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<InvoiceBox>>(
        `/api/invoice-box/${id}`,
        {
          method: 'PUT',
          body: input
        }
      )
      return data
    } catch (e: any) {
      error.value = e.message || '更新发票失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 删除发票箱记录
  const deleteInvoiceBox = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/invoice-box/${id}`, {
        method: 'DELETE'
      })
    } catch (e: any) {
      error.value = e.message || '删除发票失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 上传发票到发票箱
  const uploadInvoiceBox = async (file: File) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await $fetch<ApiResponse<InvoiceBox>>(
        '/api/invoice-box/upload',
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

  // 识别发票
  const recognizeInvoice = async (file: File) => {
    loading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)

      const { data } = await $fetch<ApiResponse<any>>(
        '/api/invoice-box/recognize',
        {
          method: 'POST',
          body: formData
        }
      )
      return data
    } catch (e: any) {
      error.value = e.message || '识别发票失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchInvoiceBoxList,
    fetchInvoiceBox,
    createInvoiceBox,
    updateInvoiceBox,
    deleteInvoiceBox,
    uploadInvoiceBox,
    recognizeInvoice
  }
}
