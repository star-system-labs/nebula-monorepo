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
        Mine
      </button>
      <button 
        @click="setSelectedCard('claim')" 
        :class="{
          'bg-button border-custom-blue text-yellow-300 font-medium shadow-custom-blue': selectedCard === 'claim',
          'text-custom-blue-inactive bg-button-inactive': selectedCard !== 'claim'
        }" 
        class="border-custom-blue w-full h-10 flex items-center justify-center px-2 sm:px-8 py-2 text-xs sm:text-base rounded-lg cursor-pointer transition-colors ease-in-out duration-300 hover:bg-button-hover active:bg-button-active"
      >
        Claim
      </button>
      <button 
        @click="setSelectedCard('stake')" 
        :class="{
          'bg-button border-custom-blue text-yellow-300 font-medium shadow-custom-blue': selectedCard === 'stake',
          'text-custom-blue-inactive bg-button-inactive': selectedCard !== 'stake'
        }" 
        class="border-custom-blue w-full h-10 flex items-center justify-center px-2 sm:px-8 py-2 text-xs sm:text-base rounded-lg cursor-pointer transition-colors ease-in-out duration-300 hover:bg-button-hover active:bg-button-active"
      >
        Earn
      </button>
    </div>

      <div v-if="selectedCard === 'mine'" class="flex flex-col justify-center w-full">
      <MinerCard :ethBalance="ethBalance" :ppepeBalance="ppepeBalance" :accountAddress="accountAddress" @amountChanged="someMethodInMainCard" @connect="$emit('connect')" />
      <div class="mt-4 text-yellow-300 font-origin font-semibold text-xl sm:text-xs">
        Mine More, Earn More
      </div>
      </div>
      <div v-if="selectedCard === 'claim'" class="w-full">
        <ClaimCard
            :accountAddress="accountAddress"
            :ppepeBalance="ppepeBalance"
            :pepeBalance="pepeBalance"
            :shibBalance="shibBalance"
            :selectedToken="selectedToken"
            :setSelectedToken="setSelectedToken"
            :selectedTokenBalance="selectedTokenBalance"
            :rawPpepeBalance="rawPpepeBalance"
            :rawPepeBalance="rawPepeBalance"
            :rawPndcBalance="rawPndcBalance"
            :rawShibBalance="rawShibBalance"
            :contract-addresses="currentContractAddresses"
            @connect="$emit('connect')"
            />
      </div>
      <div v-if="selectedCard === 'stake'" class="w-full">
        <StakeCard
            v-if="selectedCard === 'stake'"
            :accountAddress="accountAddress"
            :ppepeBalance="ppepeBalance"
            :pepeBalance="pepeBalance"
            :shibBalance="shibBalance"
            :selectedToken="selectedToken"
            :setSelectedToken="setSelectedToken"
            :selectedTokenBalance="selectedTokenBalance"
            :rawPpepeBalance="rawPpepeBalance"
            :rawPepeBalance="rawPepeBalance"
            :rawPndcBalance="rawPndcBalance"
            :rawShibBalance="rawShibBalance"
            :contract-addresses="currentContractAddresses"
            @connect="$emit('connect')"
            />
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
      pepeBalance: {
        type: String,
        default: "0.00"
      },
      pondBalance: {
        type: String,
        defaults: "0.00"
      },
      shibBalance: {
        type: String,
        default: "0.00"
      },
      rawPpepeBalance: {
        type: String,
        defaults: "0.00"
      },
      rawPepeBalance: {
        type: String,
        defaults: "0.00"
      },
      rawShibBalance: {
        type: String,
        defaults: "0.00"
      },
    },
    methods: {
      setSelectedCard(card) {
        this.selectedCard = card;
        localStorage.setItem('selectedCard', card);
      },
      toggleCopeSequence() {
        this.showCopeSequence = !this.showCopeSequence;
      }
    },
    mounted() {
      console.log("Contract Addresses:", this.contractAddresses);
      const savedCard = localStorage.getItem('selectedCard');
      if (savedCard) {
        this.selectedCard = savedCard;
      }
    }
  }
  </script>