<template>
  <button @click="connect" class="bg-gradient-to-r from-indigo-800 via-indigo-500 to-purple-900 text-yellow-300 px-8 py-3 rounded-xl border-none font-origin font-semibold cursor-pointer transition-opacity hover:opacity-80">
    {{ $t('message.connectwallet') }}
  </button>
</template>

  
  <script>
  export default {
    name: 'ConnectWalletButton',
    methods: {
      connect() {
        this.$emit('connect');
      }
    }
  }
  </script>

  