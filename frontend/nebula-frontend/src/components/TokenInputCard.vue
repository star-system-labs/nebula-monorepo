<template>
  <div class="flex flex-col items-start border-custom-blue bg-card-blue bg-opacity-100 p-4 rounded-xl w-full">
    <p :class="labelClass">{{ label }}</p>
    <div class="flex items-center justify-between w-full">
      <AmountInput 
        :currency="currency" 
        :maxAmount="balance" 
        :isEditable="isEditable" 
        :displayValue="estimatedReward.toString()"
        @inputChanged="emitAmount" 
        ref="amountInput" 
        />
      <div class="flex flex-col items-center justify-center">
        <img :src="currencyLogo" alt="Currency Logo" class="w-12 rounded-full">
      </div>
    </div>
    <div class="flex items-center text-xxs sm:text-xs md:text-sm lg:text-base xl:text-lg justify-end w-full" v-if="accountAddress">
      <div class="text-yellow-300 flex-shrink-0">{{ $t('message.balance') }}:</div>
      <div class="text-yellow-300 ml-1 flex-shrink-0">{{ balance }}</div>
      <button
      v-if="isMaxSelectable"
      @click="handleMaxClicked"
      class="ml-1 sm:ml-2 md:ml-4 lg:ml-6 xl:ml-8 bg-transparent border-none cursor-pointer px-2 py-1 text-slate-300 hover:text-yellow-300 focus:outline-none transition-colors">
      {{ $t('message.max') }}
    </button>
    <button 
      v-else 
      class="ml-1 sm:ml-2 md:ml-4 lg:ml-6 xl:ml-8 bg-transparent border-none cursor-not-allowed px-2 py-1 text-slate-300 opacity-50"
      disabled>
        {{ $t('message.max') }}
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
    estimatedReward: {
      type: String,
      default: '0.00'
    },
    isLPStaking: {
      type: Boolean,
      default: false
    },
    lpTokenBalances: Object,
    tokenBalances: Object,
    accountAddress: {
      type: String,
      default: null
    },
    isEditable: {
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
    labelClass: {
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
      console.log('LP Token Balances:', this.lpTokenBalances);
      if (this.isLPStaking) {
        const keyMapping = {
          'ppepe': 'ppepelp',
          'pepe': 'pepelp',
          'shib': 'shiblp',
        };
        const normalizedCurrency = this.currency.toLowerCase();
        const mappedKey = keyMapping[normalizedCurrency] || normalizedCurrency;
        const balance = this.lpTokenBalances[mappedKey] || '0';
        console.log(`LP Balance Mapped Key: ${mappedKey}, LP Balance: ${balance}`);
        return balance;
      }
      return this.isToken ? this.rawBalance : this.balance;
    },
    isMaxSelectable() {
      if (this.currency === 'ETH') {
        return parseFloat(this.correctBalance) > 0;
      } else {
        return parseFloat(this.rawBalance) > 0;
      }
    },
  },
  methods: {
    emitAmount(value) {
      console.log('Emitting amount:', value);
      this.$emit('amountChanged', value);
    },
    handleMaxClicked() {
      console.log('Correct balance before parsing:', this.correctBalance);
      let maxAmount = parseFloat(this.correctBalance).toFixed(2);
      console.log('Parsed maxAmount:', maxAmount);
      this.$refs.amountInput.setAmount(maxAmount);
      this.emitAmount(maxAmount);
    },
  },
  watch: {
    estimatedReward(newVal, oldVal) {
      console.log(`estimatedReward changed in TokenInputCard from ${oldVal} to ${newVal}`);
    }
  },
  mounted() {
    console.log('TokenInputCard mounted with estimatedReward:', this.estimatedReward);
    //console.log(this.lpTokenBalances);
    //console.log(this.tokenBalances);
  }
}
</script>