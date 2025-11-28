import type { ApiResponse, UploadResponse } from '~/types/api'

export const useFileUpload = () => {
  const uploading = ref(false)
  const error = ref<string | null>(null)

  // Upload invoice file
  const uploadInvoice = async (file: File, itemId: string) => {
    uploading.value = true
    error.value = null

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('itemId', itemId)

      const { data } = await $fetch<ApiResponse<UploadResponse>>('/api/uploads/invoice', {
        method: 'POST',
        body: formData
      })
      return data
    } catch (e: any) {
      error.value = e.message || '上传发票失败'
      throw e
    } finally {
      uploading.value = false
    }
  }

  // Delete invoice file
  const deleteInvoice = async (fileName: string, itemId: string) => {
    uploading.value = true
    error.value = null

    try {
      await $fetch(`/api/uploads/${fileName}`, {
        method: 'DELETE',
        query: { itemId }
      })
    } catch (e: any) {
      error.value = e.message || '删除发票失败'
      throw e
    } finally {
      uploading.value = false
    }
  }

  return {
    uploading: readonly(uploading),
    error: readonly(error),
    uploadInvoice,
    deleteInvoice
  }
}
