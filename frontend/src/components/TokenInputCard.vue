<template>
  <div class="flex flex-col items-start border-custom-blue bg-card-blue bg-opacity-100 p-4 rounded-xl w-full">
    <div class="text-sm mb-2">{{ label }}</div>
    <div class="flex items-center justify-between w-full">
      <AmountInput :currency="currency" :maxAmount="balance" :isEditable="isEditable" @inputChanged="emitAmount" ref="amountInput" />
      <div class="flex flex-col items-center justify-center">
        <img :src="currencyLogo" alt="Currency Logo" class="w-12 rounded-full">
      </div>
    </div>
    <div class="flex items-center text-xxs sm:text-xs md:text-sm lg:text-base xl:text-lg justify-end w-full" v-if="accountAddress">
      <div class="text-yellow-300 flex-shrink-0">Balance:</div>
      <div class="text-yellow-300 ml-1 flex-shrink-0">{{ balance }}</div>
      <button
      v-if="isMaxSelectable"
      @click="handleMaxClicked"
      class="ml-1 sm:ml-2 md:ml-4 lg:ml-6 xl:ml-8 bg-transparent border-none cursor-pointer px-2 py-1 text-slate-300 hover:text-yellow-300 focus:outline-none transition-colors">
      Max
    </button>
    <button 
      v-else 
      class="ml-1 sm:ml-2 md:ml-4 lg:ml-6 xl:ml-8 bg-transparent border-none cursor-not-allowed px-2 py-1 text-slate-300 opacity-50"
      disabled>
        Max
    </button>
    </div>
  </div>
</template>

<script>
import AmountInput from './AmountInput.vue';

export default {
  name: 'TokenInputCard',
  components: {
    AmountInput,
  },
  props: {
    accountAddress: {
      type: String,
      default: null
    },
    isEditable: {
      type: Boolean,
      default: true
    },
    isMaxSelectable: {
      type: Boolean,
      default: true
    },
    currency: {
      type: String,
      default: 'ETH'
    },
    label: {
      type: String,
      default: ''
    },
    currencyLogo: {
      type: String,
      default: ''
    },
    balance: {
      type: String,
      default: '0.00'
    },
    quote: {
      type: String,
      default: null
    },
    isToken: {
      type: Boolean,
      default: false
    },
    rawBalance: {
      type: String,
      default: '0'
    },
  },
  computed: {
    correctBalance() {
      return this.isToken ? this.rawBalance : this.balance;
    }
  },
  methods: {
    handleMaxClicked() {
      const maxAmount = this.correctBalance;
      this.$refs.amountInput.setAmount(maxAmount);
      this.emitAmount(maxAmount);
    },
    emitAmount(value) {
      this.$emit('amountChanged', value);
    }
  }
}
</script>

