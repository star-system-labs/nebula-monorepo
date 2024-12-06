<template>
  <div class="bg-gray-800 text-white h-[5vh] flex items-center">
    <div class="max-w-screen-xl mx-auto flex justify-between items-center w-full px-4">
      <div class="text-xl sm:text-2xl">
        Star System Labs
      </div>
      <div v-if="accountAddress" class="flex items-center space-x-2">
        <div class="flex items-center">{{ shortenedAddress }}</div>
        <div class="flex items-center space-x-2">
        </div>
        <div :class="{ 'text-purple-400': networkName === 'Sepolia' }" class="flex items-center">
            {{ networkName }} 
            <img v-if="networkIcon" 
                 :src="networkIcon" 
                 alt="Network Icon" 
                 class="ml-2 w-5 h-5 sm:w-7 sm:h-7"> 
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['accountAddress', 'networkIcon', 'balance', 'pepeBalance', 'shibBalance', 'networkName'],
  computed: {
  shortenedAddress() {
    if (this.accountAddress) {
      return `${this.accountAddress.slice(0, 6)}...${this.accountAddress.slice(-4)}`;
    }
    return null;
  },
  networkClass() {
    return [
      'network-text', 
      this.networkName === 'Sepolia' ? 'testnet' : ''
    ];
  },
  ethBalance() {
    return this.balance || "0";
  },
  formattedPepeBalance() {
    return this.pepeBalance || "0";
  },
  formattedPndcBalance() {
    return this.shibBalance || "0";
  }
},
  name: 'AppNavbar'
};
</script>