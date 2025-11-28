<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}>()

const cardClasses = computed(() => {
  const base = 'bg-white rounded-lg shadow-sm border border-gray-200'

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const hoverClass = props.hover ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : ''

  return [
    base,
    paddings[props.padding || 'md'],
    hoverClass
  ].filter(Boolean).join(' ')
})
</script>
