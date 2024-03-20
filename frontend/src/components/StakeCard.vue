<template>
  <div class="flex flex-col items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-50 p-5 rounded-xl w-full mx-auto">
   <div class="flex flex-col items-center font-origin w-full text-center">
     <div class="flex flex-col items-center font-origin w-full text-center">
     <div class="toggle-switch flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative">
       <div class="absolute left-0 top-0 h-full w-1/2 bg-button-active rounded-xl transition-all duration-300"
            :class="selectedOption === 'Staking' ? 'left-0' : 'left-1/2'"></div>
       <div 
         class="flex py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-lg"
         :class="selectedOption === 'Staking' ? 'text-yellow-300' : 'text-custom-blue-inactive'"
         @click="setSelectedOption('Staking')">
         LP Staking
       </div>
       <div 
         class="flex py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-lg"
         :class="selectedOption === 'Vesting' ? 'text-yellow-300' : 'text-custom-blue-inactive'"
         @click="setSelectedOption('Vesting')">
         Vesting
       </div>
     </div>
     <div class="currency-toggle cursor-pointer flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative">
       <div class="absolute left-0 top-0 h-full w-1/3 bg-button-active rounded-xl transition-all duration-300"
            :style="toggleStyle"></div>
       <div v-for="(currency, index) in currencies"
            :key="currency"
            :class="selectedToken === currency ? 'text-yellow-300' : 'text-custom-blue-inactive'"
            class="flex items-center justify-center text-center py-1 px-4 sm:px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-lg"
            @click.stop="setSelectedCurrency(currency)">
         <img :src="currencyLogos[index]" alt="Currency Logo" class="w-6 h-6 rounded-full mr-2">{{ currency }}
       </div>
      </div>
     </div>
    </div>
 
     <TokenInputCard
       class="w-[350px] mb-4 text-teal font-origin"
       :isToken="true"
       :isLPStaking="selectedOption === 'Staking'"
       :selectedOption="selectedOption"
       :lpTokenBalances="lpTokenBalances"
       :tokenBalances="tokenBalances"
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
 import TokenABI from '../ABI/IERC20.json';
 import VestingABI from '../ABI/VestingABI.json';
 import { ethers } from 'ethers';
 import { toHandlers } from 'vue';
 
 export default {
   name: 'ClaimCard',
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
       currentNetwork: 'mainnet',
       tokenBalances: {
         ppepe: '0',
         pepe: '0',
         shib: '0',
       },
       lpTokenBalances: {
         PrimordialPePeLP: '0',
         PePeLP: '0',
         ShibaLP: '0',
       },
       erc20ABI: [
         {
           "constant": true,
           "inputs": [{"name": "_owner", "type": "address"}],
           "name": "balanceOf",
           "outputs": [{"name": "balance", "type": "uint256"}],
           "type": "function"
         },
       ],
       contractAddresses: {
        mainnet: {
          staking: {
           PPePe: '0xe80d3A916331F6937Ee7174c26096a7b76BA441B',
           PePe: '0x8CCFd0d157eff755b70Ed68F4206Db4E2dF9A0FA',
           Shib: '0x63589B3be51D403e265fE69dB2b93Ea33ac7D614',
          },
          vesting: {
           PPePe: '0xA486CB5f61F89155eC05847153B5A679A1Ab9197',
           PePe: '0x85228679D462fD70eba48f80C9079C0E00ACc796',
           Shib: '0xAF1A16a595309aE9e666D6Eb509347e0Afa0A3CF',
          },
          tokens: {
           ppepe: '0x98830a6cc6f8964cec4ffd65f19edebba6fef865',
           pepe: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
           shib: '0xfD1450a131599ff34f3Be1775D8c8Bf79E353D8c',
          },
          lptokens: {
           PrimordialPePeLP: '0xE763297d736b73d7e37809513B7399D1F66443Ed',
           PePeLP: '0xB08eAC861c0FD07e74c3Bc6FBABe309e1F82afE5',
           ShibaLP: '0x5e29a016b9d79ef38Cc66B3E58A08af80b26FB91',
          }
        },
        sepolia: {
          staking: {
           PPePe: '0x39904563A3F0414aDfF5F608BE6ecA6Ea6Da023A',
           PePe: '0x39904563A3F0414aDfF5F608BE6ecA6Ea6Da023A',
           Shib: '0xAc2C320697B338a168556bd6b909584416AaaEc4',
          },
          vesting: {
           PPePe: '0xC8A0173CC9Ef2481760d44Fbfc76Fb93F47D329F',
           PePe: '0x28Cf2e97673Ebf87981ed872c2b844A7B2a03FDb',
           Shib: '0xCdEE06A091EB25A8B178d57e21f1E36c90F5F9B4',
          },
          tokens: {
           ppepe: '0xB6Ad6AD0364Eb5E8B109a55F01F4F68971B40E2B',
           pepe: '0xf73BBA852bb30553326fA837f091aB7Ce740D0a9',
           shib: '0x46cB0AfFA874719c7b273Df80954CC98199e2d69',
          },
          lptokens: {
           PrimordialPePeLP: '0xE763297d736b73d7e37809513B7399D1F66443Ed',
           PePeLP: '0xB08eAC861c0FD07e74c3Bc6FBABe309e1F82afE5',
           ShibaLP: '0x5e29a016b9d79ef38Cc66B3E58A08af80b26FB91',
          }
        },
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
     subscribeToNewBlocks() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      provider.on('block', () => {
        this.fetchLPTokenBalances();
        this.fetchTokenBalances();
      });
     },
     abbreviateNumber(value) {
       let newValue = parseFloat(value);
       if (newValue >= 1e12) {
         return (newValue / 1e12).toFixed(2) + "T";
       } else if (newValue >= 1e9) {
         return (newValue / 1e9).toFixed(2) + "B";
       } else if (newValue >= 1e6) {
         return (newValue / 1e6).toFixed(2) + "M";
       } else if (newValue >= 1e3) {
         return (newValue / 1e3).toFixed(2) + "K";
       } else {
         return newValue.toString();
       }
     },
     async fetchTokenBalances() {
       if (!this.accountAddress) {
         console.log("No account address provided.");
         return;
       }
 
       const provider = new ethers.BrowserProvider(window.ethereum);
       for (const [tokenName, tokenAddress] of Object.entries(this.contractAddresses[this.currentNetwork].tokens)) {
         const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
         const balanceInWei = await tokenContract.balanceOf(this.accountAddress);
         const balanceInEther = ethers.formatEther(balanceInWei);
         this.tokenBalances[tokenName] = balanceInEther;
         console.log(`${tokenName} (${tokenAddress}) balance:`, this.tokenBalances[tokenName]);
       }
     },
     async fetchLPTokenBalances() {
       if (!this.accountAddress) {
         console.log("No account address provided.");
         return;
       }
 
       const provider = new ethers.BrowserProvider(window.ethereum);
       for (const [tokenName, tokenAddress] of Object.entries(this.contractAddresses[this.currentNetwork].lptokens)) {
         const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
         const balanceInWei = await tokenContract.balanceOf(this.accountAddress);
         const balanceInEther = ethers.formatEther(balanceInWei);
         this.lpTokenBalances[tokenName] = balanceInEther;
         console.log(`${tokenName} (${tokenAddress}) balance:`, this.lpTokenBalances[tokenName]);
         
       }
     },
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
     async detectNetwork() {
       const provider = new ethers.BrowserProvider(window.ethereum);
       const network = await provider.getNetwork();
       this.currentNetwork = network.chainId === 1 ? 'mainnet' : 'sepolia';
       console.log(`Detected and set current network to: ${this.currentNetwork}`);
     },
     async handleStakeClick() {
       try {
         if (!this.currentNetwork) {
           console.error('Network not detected or unsupported');
           return;
         }
         const provider = new ethers.BrowserProvider(window.ethereum);
         const signer = await provider.getSigner();
 
         let contractAddress, contractMethod, timeIndex;
         if (this.selectedOption === 'Staking') {
           contractAddress = this.stakingcontractAddresses[this.selectedToken];
           contractMethod = 'stakeLPToken';
         } else if (this.selectedOption === 'Vesting') {
           contractAddress = this.vestingContractAddresses[this.selectedToken];
           contractMethod = 'vestTokens';
           timeIndex = this.vestingPeriod / 30 - 1;
 
         } else {
           console.error('Invalid option selected');
           return;
         }
         if (!contractAddress) {
           console.error(`No contract address found for option: ${this.selectedOption} and token: ${this.selectedToken}`);
           return;
         }
         console.log(`Using contract address: ${contractAddress} for ${this.selectedOption}`);
         const amountInWei = ethers.parseUnits(this.enteredAmountData, 18);
         const tokenContract = new ethers.Contract(this.currentTokenContractAddress, TokenABI, signer);
         const approveTx = await tokenContract.approve(contractAddress, amountInWei);
         await approveTx.wait();
         console.log("Tokens approved");
         const actionContract = new ethers.Contract(contractAddress, this.selectedOption === 'Staking' ? LPStakingABI : VestingABI, signer);
         let actionTx;
         if (this.selectedOption === 'Staking') {
         actionTx = await actionContract[contractMethod](amountInWei);
         } else if (this.selectedOption === 'Vesting') {
         actionTx = await actionContract[contractMethod](amountInWei, timeIndex);
         }
         await actionTx.wait();
         console.log(`${this.selectedOption} action completed successfully`);
       } catch (error) {
         console.error("Error during action:", error);
       }
     },
     updateWalletBalance() {
       this.walletBalanceData = this.selectedTokenBalance;
     }
   },
   computed: {
     selectedVestingContractAddress() {
       console.log("Vesting Contract Address: ", this.contractAddresses[this.currentNetwork].vesting[this.selectedToken]);
       return this.contractAddresses[this.currentNetwork].vesting[this.selectedToken];
     },
     selectedStakingContractAddress() {
       console.log("Staking Contract Address: ", this.contractAddresses[this.currentNetwork].staking[this.selectedToken]);
       return this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
     },
     selectedTokenContractAddress() {
       console.log("Token Contract Address: ", this.contractAddresses[this.selectedToken]);
       return this.contractAddresses[toHandlers.selectedToken];
     },
     currentTokenContractAddress() {
       return this.contractAddresses[this.currentNetwork][this.selectedToken.toLowerCase()];
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
       let balance = '0';
       if (this.selectedOption === 'Staking') {
         switch (this.selectedToken) {
           case 'PPePe':
             console.log("PrimordialPePeLP Balance: ", this.lpTokenBalances.PrimordialPePeLP);
             balance = this.lpTokenBalances.PrimordialPePeLP;
             break;
           case 'PePe':
             console.log("PePeLP Balance: ", this.lpTokenBalances.PePeLP);
             balance = this.lpTokenBalances.PePeLP;
             break;
           case 'Shib':
             console.log("ShibaLP Balance: ", this.lpTokenBalances.ShibaLP);
             balance = this.lpTokenBalances.ShibaLP;
             break;
         }
       } else {
         switch (this.selectedToken) {
           case 'PPePe':
             console.log("PPePe Balance: ", this.ppepeBalance);
             balance = this.ppepeBalance;
             break;
           case 'PePe':
             console.log("PePe Balance: ", this.pepeBalance);
             balance = this.pepeBalance;
             break;
         case 'Shib':
           console.log("Shib Balance: ", this.shibBalance);
           balance = this.shibBalance;
           break;
         }
       }
       console.log(`${this.selectedToken} Balance: `, balance);
 
       return this.abbreviateNumber(balance);
     },
     toggleStyle() {
       let index = this.currencies.indexOf(this.selectedToken);
       let percentage = 33.33 * index;
       return { left: `${percentage}%` };
     },
   },
   async mounted() {
     this.detectNetwork();
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
          this.$emit('update:accountAddress', accounts[0]);
          this.fetchLPTokenBalances();
          this.fetchTokenBalances();
        });
        this.subscribeToNewBlocks();
        this.fetchLPTokenBalances();
        this.fetchTokenBalances();
      }
   },
   watch: {
     accountAddress(newVal, oldVal) {
       if (newVal !== oldVal) {
         this.fetchLPTokenBalances();
         this.fetchTokenBalances();
       }
     },
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
    console.log("ClaimCard raw balances:", this.rawPpepeBalance, this.rawPepeBalance, this.rawShibBalance);
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
 
 