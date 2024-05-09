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
        class="border-custom-blue w-full h-10 flex items-center justify-center px-2 sm:px-8 py-2 text-xs sm:text-base rounded-lg cursor-pointer transition-colors ease-in-out duration-300 hover:bg-button-hover active:bg-button-active"
      >
        {{ $t('message.mine') }}
      </button>
      <button 
        @click="setSelectedCard('claim')" 
        :class="{
          'bg-button border-custom-blue text-yellow-300 font-medium shadow-custom-blue': selectedCard === 'claim',
          'text-custom-blue-inactive bg-button-inactive': selectedCard !== 'claim'
        }" 
        class="border-custom-blue w-full h-10 flex items-center justify-center px-2 sm:px-8 py-2 text-xs sm:text-base rounded-lg cursor-pointer transition-colors ease-in-out duration-300 hover:bg-button-hover active:bg-button-active"
      >
        {{ $t('message.claim') }}
      </button>
      <button 
        @click="setSelectedCard('stake')" 
        :class="{
          'bg-button border-custom-blue text-yellow-300 font-medium shadow-custom-blue': selectedCard === 'stake',
          'text-custom-blue-inactive bg-button-inactive': selectedCard !== 'stake'
        }" 
        class="border-custom-blue w-full h-10 flex items-center justify-center px-2 sm:px-8 py-2 text-xs sm:text-base rounded-lg cursor-pointer transition-colors ease-in-out duration-300 hover:bg-button-hover active:bg-button-active"
      >
        {{ $t('message.earn') }}
      </button>
    </div>

      <div v-if="selectedCard === 'mine'" class="flex flex-col justify-center w-full">
      <MinerCard 
        :ethBalance="ethBalance" 
        :ppepeBalance="ppepeBalance" 
        :abbreviatedPpepeBalance="abbreviatedPpepeBalance"
        :accountAddress="accountAddress" 
        @amountChanged="handleAmountChanged" 
        @connect="$emit('connect')" 
      />
      <div class="mt-4 text-yellow-300 font-origin font-semibold text-xl sm:text-xs">
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
            @connect="$emit('handleConnect')"
            />
            <div class="mt-4 text-yellow-300 font-origin font-semibold text-xl sm:text-xs">
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
            @connect="$emit('connect')"
            @updateBalances="handleUpdateBalances"
            />
            <div class="mt-4 text-yellow-300 font-origin font-semibold text-xl sm:text-xs">
        {{ displayMessage }}
      </div>
    </div>
  </div>
</template>
  
  <script>
  import ClaimCard from './ClaimCard.vue';
  import StakeCard from './StakeCard.vue';
  import MinerCard from './MinerCard.vue';
  
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
        showCopeSequence: false
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
      handleUpdateBalances(newBalances) {
        this.$emit('updateBalances', newBalances);
      },
      setSelectedCard(card) {
        this.selectedCard = card;
        localStorage.setItem('selectedCard', card);
      },
      toggleCopeSequence() {
        this.showCopeSequence = !this.showCopeSequence;
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