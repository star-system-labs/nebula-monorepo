<template>
  <div>
    <h4 class="text-yellow-300 font-nixie font-bold text-sm md:text-base mb-2">Miner Report</h4>
    <div class="text-teal text-xs font-nixie md:text-sm">
      <p class="font-bold" v-for="(value, key) in reportData" :key="key">{{ key }}: {{ value }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  reportData: {
    type: Object,
    required: true,
  },
})
</script> 