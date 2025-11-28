import type { Reimbursement, CreateReimbursementInput, UpdateReimbursementInput, ReimbursementListQuery } from '~/types/reimbursement'
import type { ApiResponse } from '~/types/api'

export const useReimbursements = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all reimbursements
  const fetchReimbursements = async (query?: ReimbursementListQuery) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<Reimbursement[]>>('/api/reimbursements', {
        query: query || {}
      })
      return data || []
    } catch (e: any) {
      error.value = e.message || '获取报销单列表失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Fetch single reimbursement
  const fetchReimbursement = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<Reimbursement>>(`/api/reimbursements/${id}`)
      return data
    } catch (e: any) {
      error.value = e.message || '获取报销单详情失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Create reimbursement
  const createReimbursement = async (input: CreateReimbursementInput) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<Reimbursement>>('/api/reimbursements', {
        method: 'POST',
        body: input
      })
      return data
    } catch (e: any) {
      error.value = e.message || '创建报销单失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Update reimbursement
  const updateReimbursement = async (id: string, input: UpdateReimbursementInput) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<Reimbursement>>(`/api/reimbursements/${id}`, {
        method: 'PUT',
        body: input
      })
      return data
    } catch (e: any) {
      error.value = e.message || '更新报销单失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Delete reimbursement
  const deleteReimbursement = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/reimbursements/${id}`, {
        method: 'DELETE'
      })
    } catch (e: any) {
      error.value = e.message || '删除报销单失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    fetchReimbursements,
    fetchReimbursement,
    createReimbursement,
    updateReimbursement,
    deleteReimbursement
  }
}
