<template>
 <div class="flex flex-col items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-50 p-5 rounded-xl w-full mx-auto">
  <div class="flex flex-col items-center font-origin w-full text-center">
    <div class="flex flex-col items-center font-origin w-full text-center">
    <div class="toggle-switch flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative">
      <div class="absolute left-0 top-0 h-full w-1/2 bg-button-active rounded-xl transition-all duration-300"
           :class="selectedOption === 'Staking' ? 'left-0' : 'left-1/2'"></div>
      <div 
        class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10"
        :class="selectedOption === 'Staking' ? 'text-yellow-300' : 'text-custom-blue-inactive'"
        @click="setSelectedOption('Staking')">
        Staking
      </div>
      <div 
        class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10"
        :class="selectedOption === 'Vesting' ? 'text-yellow-300' : 'text-custom-blue-inactive'"
        @click="setSelectedOption('Vesting')">
        Vesting
      </div>
    </div>
    <div class="currency-toggle flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative">
      <div class="absolute left-0 top-0 h-full w-1/3 bg-button-active rounded-xl transition-all duration-300"
           :style="toggleStyle"></div>
      <div v-for="(currency, index) in currencies"
           :key="currency"
           :class="selectedToken === currency ? 'text-yellow-300' : 'text-custom-blue-inactive'"
           class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10"
           @click.stop="setSelectedCurrency(currency)">
        <img :src="currencyLogos[index]" alt="Currency Logo" class="w-6 h-6 rounded-full mr-2">{{ currency }}
      </div>
     </div>
    </div>
   </div>

    <TokenInputCard
      class="w-[350px] mb-4 text-teal font-origin"
      :isToken="true"
      :rawBalance="selectedToken === 'PPePe' ? rawPpepeBalance : selectedToken === 'PePe' ? rawPepeBalance : selectedToken === 'Shib' ? rawShibBalance : '0'"
  :currency="selectedToken"
  :balance="selectedTokenBalance"
      label="You Stake:"
      :currencyLogo="selectedCurrencyLogo"
      :tokenName="setSelectedCurrency"
      :isEditable="true"
      :isMaxSelectable="true"
      @amountChanged="handleAmountChanged"
      :accountAddress="accountAddress"
    />

    <div v-if="selectedOption === 'Vesting'" class="my-4 flex flex-col items-center">
      <input type="range" min="30" max="360" step="30" v-model="vestingPeriod" class="range range-primary w-full max-w-xs" @input="adjustVestingPeriod">
      <div class="text-teal font-origin mt-2">Vesting Period: {{ formattedVestingPeriod }}</div>
    </div>

    <ConnectWalletButton v-if="!accountAddress" @connect="$emit('connect')" class="mb-6"/>
    <button v-else @click="handleStakeClick" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 mb-6">
      <SpinnerSVG v-if="loading" />
      <span v-else>{{ stakeButtonText }}</span>
    </button>
  </div>
</template>

<script>
import ConnectWalletButton from './ConnectWalletButton.vue';
import TokenInputCard from './TokenInputCard.vue';
import SpinnerSVG from './SpinnerSVG.vue';
import LPStakingABI from '../ABI/LPStakingABI.json';
import TokenABI from '../ABI/TokenABI.json';
import { ethers } from 'ethers';
let provider;

export default {
  name: 'StakeCard',
  components: {
    TokenInputCard,
    ConnectWalletButton,
    SpinnerSVG
  },
  props: {
    rawPpepeBalance: String,
    rawPepeBalance: String,
    rawShibBalance: String,
    ppepeBalance: String,
    pepeBalance: String,
    shibBalance: String,
    accountAddress: {
      type: String,
      default: null
    },
  },
  data() {
    return {
      contractAddresses: {
      mainnet: {
        pepe: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
        pond: '0x423f4e6138E475D85CF7Ea071AC92097Ed631eea',
        shib: '0x11541e990036ec13D521d584F098a83bD0F4BFC3',
        ppepe: '0x98830a6cc6f8964cec4ffd65f19edebba6fef865'
      },
      sepolia: {
        pepe: '0x27dF660eE7D634401A37de335946472B8928A10E',
        shib: '0xA0DB56d00465c2665acD333A848C5BDEF9D8FD19',
        ppepe: '0x2cD6B2b4f4D9fA59f8E9638c00F5902fD1d9afbc'
      }
    },
    currentNetwork: 'mainnet',
      stakingcontractAddresses: {
      'PPePe': '0xBD80F58B727a85658BeEB3712c25bDd42d7Bff72',
      'PePe': '0xFe20461D6Bdacf74bDaF3D88643c0679B181F627',
      'Shib': '0x2842844B0B08A859CA42FA9B1DA34cF348b8CDb4'
      },
      vestingContractAddresses: {
      'PPePe': '0x282E7FD85AB9d38C2a89194Be4E3cE1017C41C2E',
      'PePe': '0x49ad849920cB44963fF348E32bFA3C6ee8eFb9CF',
      'Shib': '0xCa617C39e4F4C3fB87b3250A73Eec5Def35ed430'
      },
      vestingPeriod: 30,
      selectedToken: 'PPePe',
      loading: false,
      stakeButtonText: 'Stake',
      currencies: ['PPePe', 'PePe', 'Shib'],
      currencyLogos: [
        require('@/assets/ppepe.png'),
        require('@/assets/pepe.png'),
        require('@/assets/shib.png')
      ],
      enteredAmountData: '0.00',
      walletBalanceData: '0.00',
      selectedOption: 'Staking',
    };
  },
  methods: {
    adjustVestingPeriod() {
      if (this.vestingPeriod > 330) {
        this.vestingPeriod = 365;
      }
      console.log("Vesting Period Updated: ", this.vestingPeriod);
    },
    setSelectedOption(option) {
      this.selectedOption = option;
      console.log("Selected Option: ", this.selectedOption);
  
      if (option === 'Staking') {
        this.stakeButtonText = 'Staking';
        console.log("Selected Contract Address: ", this.selectedStakingContractAddress);
      } else {
        this.stakeButtonText = 'Vesting';
        console.log("Selected Contract Address: ", this.selectedVestingContractAddress);
      }
    },
    setSelectedCurrency(currency) {
      this.selectedToken = currency;
      this.selectedTokenBalance;
    },
    handleAmountChanged(value) {
      console.log(`Amount Changed in StakeCard:`, value);
      this.enteredAmountData = value;
      this.walletBalanceData = this.selectedTokenBalance;
    },
    async handleStakeClick() {
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        const signer = provider.getSigner();
        const networkAddresses = this.contractAddresses[this.currentNetwork];
        const tokenContractAddress = networkAddresses[this.selectedToken.toLowerCase()];
        if (!tokenContractAddress) {
          console.error(`No contract address found for token: ${this.selectedToken}`);
          return;
        }
        console.log("Selected token:", this.selectedToken);
        const tokenContract = new ethers.Contract(tokenContractAddress, TokenABI, signer);
        console.log("Token contract address:", this.contractAddresses[this.selectedToken]);
        const stakingContractAddress = this.stakingcontractAddresses[this.selectedToken];
        console.log("Staking contract address:", this.stakingcontractAddresses[this.selectedToken]);
        const stakingContract = new ethers.Contract(stakingContractAddress, LPStakingABI, signer);
        // eslint-disable-next-line no-undef
        const amountInWei = BigInt(this.enteredAmountData) * BigInt(10 ** 18);

        const approveTx = await tokenContract.approve(stakingContractAddress, amountInWei.toString());
        await approveTx.wait();

        console.log("Tokens approved for staking");

        if (this.selectedOption === 'Staking') {
          const stakeTx = await stakingContract.stakeLPToken(amountInWei.toString());
          await stakeTx.wait();
          console.log("Tokens staked successfully");
        } else if (this.selectedOption === 'Vesting') {
          let contractAddress;
          if (this.selectedOption === 'Staking') {
          contractAddress = this.selectedStakingContractAddress;
          contractAddress.stakeLPToken(this.enteredAmountData)
        } else if (this.selectedOption === 'Vesting') {
          contractAddress = this.selectedVestingContractAddress;
          contractAddress.vest(this.enteredAmountData, this.vestingPeriod)
        }
        console.log("Selected Token: ", this.selectedToken);
        console.log("Contract Address: ", contractAddress);
      }
      } catch (error) {
        console.error("Error calling stakeLPToken: ", error);
      }
    },
    updateWalletBalance() {
      this.walletBalanceData = this.selectedTokenBalance;
    }
  },
  computed: {
    selectedVestingContractAddress() {
      console.log("Vesting Contract Address: ", this.vestingContractAddresses[this.selectedToken]);
      return this.vestingContractAddresses[this.selectedToken];
    },
    selectedStakingContractAddress() {
      console.log("Staking Contract Address: ", this.stakingcontractAddresses[this.selectedToken]);
      return this.stakingcontractAddresses[this.selectedToken];
    },
    formattedVestingPeriod() {
      if (this.vestingPeriod === 365) {
        return "12 months 365 days";
      }
      const months = Math.floor(this.vestingPeriod / 30);
      const days = this.vestingPeriod;
      let monthString = months === 1 ? "month" : "months";
      let dayString = days === 1 ? "day" : "days";
      let formattedString = `${months} ${monthString} ${days} ${dayString}`;
      return formattedString;
    },
    selectedCurrencyLogo() {
      let index = this.currencies.indexOf(this.selectedToken);
      return this.currencyLogos[index];
    },
    selectedTokenBalance() {
      console.log("Selected Token: ", this.selectedToken);
      switch (this.selectedToken) {
        case 'PPePe':
          console.log("PPePe Balance: ", this.ppepeBalance);
          console.log("rawPpepeBalance:", this.rawPpepeBalance);
          return this.ppepeBalance;
        case 'PePe':
          console.log("PePe Balance: ", this.pepeBalance);
          console.log("rawPepeBalance:", this.rawPepeBalance);
          return this.pepeBalance;
        case 'Shib':
          console.log("Shib Balance: ", this.shibBalance);
          console.log("rawShibBalance:", this.rawShibBalance);
          return this.shibBalance;
        default:
          return '0.00';
      }
    },
    toggleStyle() {
      let index = this.currencies.indexOf(this.selectedToken);
      let percentage = 33.33 * index;
      return { left: `${percentage}%` };
    },
  },
  mounted() {
    this.walletBalanceData = this.selectedTokenBalance;
    console.log("rawPpepeBalance on mount in StakeCard:", this.rawPpepeBalance);
  },
  watch: {
    rawPpepeBalance(newVal) {
      console.log("New rawPpepeBalance:", newVal);
    },
    rawPepeBalance(newVal) {
      console.log("New rawPepeBalance:", newVal);
    },
    rawShibBalance(newVal) {
      console.log("New rawShibBalance:", newVal);
    },
    vestingPeriod(newValue) {
      if (newValue > 330) {
        this.vestingPeriod = 365;
      }
    },
    enteredAmountData(newVal) {
      console.log("enteredAmountData updated: ", newVal);
    },
    walletBalanceData(newVal) {
      console.log("walletBalanceData updated: ", newVal)
    },
  },
  created() {
  console.log("StakeCard raw balances:", this.rawPpepeBalance, this.rawPepeBalance, this.rawShibBalance);
},
};
</script>

<style scoped>
.range {
  -webkit-appearance: none;
  width: 100%;
  height: 2px;
  background: #131820;
  outline: none;
  opacity: 0.7;
  -webkit-transition: .2s;
  transition: opacity .2s;
}

.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: #0751bf;
  cursor: pointer;
  margin-left: 0;
}

.range::-moz-range-thumb {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #0751bf;
  cursor: pointer;
  margin-left: 0;
  border: none;
}
</style>

