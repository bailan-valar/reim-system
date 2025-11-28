import type { ExpenseItem, CreateExpenseItemInput, UpdateExpenseItemInput } from '~/types/expenseItem'
import type { ApiResponse } from '~/types/api'

export const useExpenseItems = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Create expense item
  const createExpenseItem = async (reimbursementId: string, input: CreateExpenseItemInput) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<ExpenseItem>>(`/api/reimbursements/${reimbursementId}/items`, {
        method: 'POST',
        body: input
      })
      return data
    } catch (e: any) {
      error.value = e.message || '创建费用项目失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Update expense item
  const updateExpenseItem = async (reimbursementId: string, itemId: string, input: UpdateExpenseItemInput) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch<ApiResponse<ExpenseItem>>(`/api/reimbursements/${reimbursementId}/items/${itemId}`, {
        method: 'PUT',
        body: input
      })
      return data
    } catch (e: any) {
      error.value = e.message || '更新费用项目失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // Delete expense item
  const deleteExpenseItem = async (reimbursementId: string, itemId: string) => {
    loading.value = true
    error.value = null

    try {
      await $fetch(`/api/reimbursements/${reimbursementId}/items/${itemId}`, {
        method: 'DELETE'
      })
    } catch (e: any) {
      error.value = e.message || '删除费用项目失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    createExpenseItem,
    updateExpenseItem,
    deleteExpenseItem
  }
}
