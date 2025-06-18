<template>
  <button 
    @click="connectWallet" 
    :disabled="isConnecting"
    class="bg-gradient-to-r from-indigo-800 via-indigo-500 to-purple-900 
           text-yellow-300 px-8 py-3 rounded-xl border-none 
           font-origin font-semibold cursor-pointer 
           transition-opacity hover:opacity-80 disabled:opacity-50"
  >
    {{ isConnecting ? 'Connecting...' : 'Connect Wallet' }}
  </button>
</template>

<script>
export default {
  name: 'ConnectWalletButton',
  props: {
    isConnecting: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    connectWallet() {
      this.$emit('connect');
    }
  }
};
</script>

<style scoped>
</style>

  