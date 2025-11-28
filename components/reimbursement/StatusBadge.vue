<template>
  <span :class="badgeClasses">
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import type { ReimbursementStatus } from '~/types/reimbursement'
import { STATUS_COLORS } from '~/utils/constants'

const props = defineProps<{
  status: ReimbursementStatus
}>()

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium'
  const colorClass = STATUS_COLORS[props.status] || 'bg-gray-100 text-gray-800'
  return `${base} ${colorClass}`
})
</script>
