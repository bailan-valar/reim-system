<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900">费用项目</h2>
      <UiButton @click="$emit('add')">
        添加费用
      </UiButton>
    </div>

    <!-- Empty State -->
    <div v-if="!items.length" class="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900">暂无费用项目</h3>
      <p class="mt-1 text-sm text-gray-500">开始添加费用项目到此报销单</p>
      <div class="mt-6">
        <UiButton @click="$emit('add')">
          添加费用
        </UiButton>
      </div>
    </div>

    <!-- List -->
    <div v-else class="grid gap-4 md:grid-cols-2">
      <ExpenseItemCard
        v-for="item in items"
        :key="item.id"
        :item="item"
        @edit="$emit('edit', item)"
        @delete="$emit('delete', item)"
        @upload-invoice="$emit('upload-invoice', item)"
        @delete-invoice="$emit('delete-invoice', item)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ExpenseItem } from '~/types/expenseItem'

defineProps<{
  items: ExpenseItem[]
}>()

defineEmits<{
  add: []
  edit: [item: ExpenseItem]
  delete: [item: ExpenseItem]
  'upload-invoice': [item: ExpenseItem]
  'delete-invoice': [item: ExpenseItem]
}>()
</script>
