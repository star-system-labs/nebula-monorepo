<template>
  <div class="absolute top-50px flex flex-col items-center justify-center border-custom-blue bg-card-blue bg-opacity-50 rounded-xl shadow-md p-6 w-full max-w-md mx-auto my-5 relative sm:max-w-xl md:max-w-xl">
    
    <h1 class="text-yellow-300 font-origin text-4xl mb-4">Nebula</h1>
    
    <div class="selectors flex space-x-4 justify-between mx-5 mb-4 w-full font-origin">
      <button 
        @click="setSelectedCard('mine')" 
        :class="{
          'bg-button border-custom-blue text-yellow-300 font-medium shadow-custom-blue': selectedCard === 'mine', 
          'text-custom-blue-inactive bg-button-inactive': selectedCard !== 'mine' 
        }" 
        class="border-custom-blue w-full h-10 flex items-center justify-center px-2 sm:px-8 py-2 text-sm sm:text-md md:text-lg lg:text-lg rounded-lg cursor-pointer transition-colors ease-in-out duration-300 hover:bg-button-hover active:bg-button-active"
      >
        {{ $t('message.mine') }}
      </button>
      <button 
        @click="setSelectedCard('claim')" 
        :class="{
          'bg-button border-custom-blue text-yellow-300 font-medium shadow-custom-blue': selectedCard === 'claim',
          'text-custom-blue-inactive bg-button-inactive': selectedCard !== 'claim'
        }" 
        class="border-custom-blue w-full h-10 flex items-center justify-center px-2 sm:px-8 py-2 text-sm sm:text-md md:text-lg lg:text-lg rounded-lg cursor-pointer transition-colors ease-in-out duration-300 hover:bg-button-hover active:bg-button-active"
      >
        {{ $t('message.claim') }}
      </button>
      <button 
        @click="setSelectedCard('stake')" 
        :class="{
          'bg-button border-custom-blue text-yellow-300 font-medium shadow-custom-blue': selectedCard === 'stake',
          'text-custom-blue-inactive bg-button-inactive': selectedCard !== 'stake'
        }" 
        class="border-custom-blue w-full h-10 flex items-center justify-center px-2 sm:px-8 py-2 text-sm sm:text-md md:text-lg lg:text-lg rounded-lg cursor-pointer transition-colors ease-in-out duration-300 hover:bg-button-hover active:bg-button-active"
      >
        {{ $t('message.earn') }}
      </button>
    </div>

      <div v-if="selectedCard === 'mine'" class="flex flex-col justify-center w-full">
      <MinerCard 
        v-if="selectedCard === 'mine'"
        :ethBalance="ethBalance" 
        :ppepeBalance="ppepeBalance" 
        :abbreviatedPpepeBalance="abbreviatedPpepeBalance"
        :accountAddress="accountAddress" 
        @amountChanged="handleAmountChanged" 
        @connect="handleConnect"
        @updateBalances="$emit('updateBalances')"
      />
      <div class="mt-4 text-yellow-300 font-origin font-semibold md:text-md lg:text-lg">
        {{ displayMessage }}
      </div>
      </div>
      <div v-if="selectedCard === 'claim'" class="w-full">
        <ClaimCard
            :accountAddress="accountAddress"
            :selectedToken="selectedToken"
            :setSelectedToken="setSelectedToken"
            :selectedTokenBalance="selectedTokenBalance"
            :rawPpepeBalance="rawPpepeBalance"
            :rawPepeBalance="rawPepeBalance"
            :rawShibBalance="rawShibBalance"
            :ppepeBalance="ppepeBalance"
            :pepeBalance="pepeBalance"
            :shibBalance="shibBalance"
            :pepelpBalance="pepelpBalance"
            :shiblpBalance="shiblpBalance"
            :ppepelpBalance="ppepelpBalance"
            :contract-addresses="currentContractAddresses"
            @connect="handleConnect"
            />
            <div class="mt-4 text-yellow-300 font-origin font-semibold md:text-md lg:text-lg">
        {{ displayMessage }}
      </div>
      </div>
      <div v-if="selectedCard === 'stake'" class="w-full">
        <StakeCard
            v-if="selectedCard === 'stake'"
            :accountAddress="accountAddress"
            :selectedToken="selectedToken"
            :setSelectedToken="setSelectedToken"
            :selectedTokenBalance="selectedTokenBalance"
            :rawPpepeBalance="rawPpepeBalance"
            :rawPepeBalance="rawPepeBalance"
            :rawShibBalance="rawShibBalance"
            :ppepeBalance="ppepeBalance"
            :pepeBalance="pepeBalance"
            :shibBalance="shibBalance"
            :pepelpBalance="pepelpBalance"
            :shiblpBalance="shiblpBalance"
            :ppepelpBalance="ppepelpBalance"
            :contract-addresses="currentContractAddresses"
            @connect="handleConnect"
            @updateBalances="handleUpdateBalances"
            />
            <div class="mt-4 text-yellow-300 font-origin font-semibold md:text-md lg:text-lg">
        {{ displayMessage }}
      </div>
    </div>
  </div>
</template>
  
  <script>
  import ClaimCard from './ClaimCard.vue';
  import StakeCard from './StakeCard.vue';
  import MinerCard from './MinerCard.vue';
  import widgetAnalytics from '@/utils/widgetAnalytics';
  
  export default {
    name: 'MainCard',
    components: {
      ClaimCard,
      StakeCard,
      MinerCard
    },
    data() {
      return {
        selectedCard: 'mine',
        showCopeSequence: false,
        selectedToken: 'PPePe'
      };
    },
    props: {
      contractAddresses: Object,
      accountAddress: {
        type: String,
        default: null
      },
      ethBalance: {
        type: String,
        default: "0.00"
      },
      ppepeBalance: {
        type: String,
        default: "0.00"
      },
      abbreviatedPpepeBalance: {
        type: String,
        default: "0.00"
      },
      pepeBalance: {
        type: String,
        default: "0.00"
      },
      shibBalance: {
        type: String,
        default: "0.00"
      },
      pepelpBalance: {
        type: String,
        default: "0.00"
      },
      shiblpBalance: {
        type: String,
        default: "0.00"
      },
      ppepelpBalance: {
        type: String,
        default: "0.00"
      },
      rawPpepeBalance: {
        type: String,
        default: "0.00"
      },
      rawPepeBalance: {
        type: String,
        default: "0.00"
      },
      rawShibBalance: {
        type: String,
        default: "0.00"
      },
    },
    methods: {
      async handleUpdateBalances(balances) {
        try {
          await this.$emit('updateBalances', balances);
        } catch (error) {
          console.error('Balance update error:', error);
        }
      },
      setSelectedCard(card) {
        this.selectedCard = card;
        localStorage.setItem('selectedCard', card);
        
        widgetAnalytics.trackInteraction('card_select', true, {
          cardType: card,
          previousCard: this.selectedCard,
          timestamp: Date.now()
        });
      },
      toggleCopeSequence() {
        this.showCopeSequence = !this.showCopeSequence;
      },
      async handleConnect() {
        try {
          await this.$emit('connect');
        } catch (error) {
          console.error('Connection error:', error);
        }
      },
      async handleAmountChanged(amount) {
        try {
          await this.$emit('amountChanged', amount);
        } catch (error) {
          console.error('Amount change error:', error);
        }
      },
      setSelectedToken(token) {
        this.selectedToken = token
      }
    },
    computed: {
      displayMessage() {
        console.log('Current selectedCard:', this.selectedCard);
        switch (this.selectedCard) {
          case 'mine':
            return this.$t('message.minemore');
          case 'stake':
            return this.$t('message.mememore');
          case 'claim':
            return this.$t('message.claimmore');
          default:
            return this.$t('message.mememore');
        }
      },
      selectedTokenBalance() {
        return '0.00'
      },
      currentContractAddresses() {
        return {}
      }
    },
    mounted() {
      //console.log("Contract Addresses:", this.contractAddresses);
      const savedCard = localStorage.getItem('selectedCard');
      if (savedCard && savedCard !== this.selectedCard) {
        this.setSelectedCard(savedCard);
      }
    },
    watch: {
      selectedCard(newVal) {
        console.log('Selected card changed to:', newVal);
      }
    },
  }
  </script>