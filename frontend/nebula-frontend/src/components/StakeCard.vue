<template>
  <div class="flex flex-col items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-50 p-5 rounded-xl w-full mx-auto">
   <div class="flex flex-col items-center font-origin w-full text-center">
     <div class="flex flex-col items-center font-origin w-full text-center">
     <div class="toggle-switch flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative">
       <div class="absolute left-0 top-0 h-full w-1/2 bg-button-active rounded-xl transition-all duration-300"
            :class="selectedOption === 'Staking' ? 'left-0' : 'left-1/2'"></div>
       <div 
         class="flex py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs sm:text-sm md:text-md lg:text-lg"
         :class="selectedOption === 'Staking' ? 'text-yellow-300' : 'text-custom-blue-inactive'"
         @click="setSelectedOption('Staking')">
         {{ $t('message.lpstaking') }}
       </div>
       <div 
         class="flex py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs sm:text-sm md:text-md lg:text-lg"
         :class="selectedOption === 'Vesting' ? 'text-yellow-300' : 'text-custom-blue-inactive'"
         @click="setSelectedOption('Vesting')">
         {{ $t('message.vesting') }}
       </div>
     </div>
     <div class="currency-toggle cursor-pointer flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative">
       <div class="absolute left-0 top-0 h-full w-1/3 bg-button-active rounded-xl transition-all duration-300"
            :style="toggleStyle('token')"></div>
       <div v-for="(currency, index) in currencies"
            :key="currency"
            :class="selectedToken === currency ? 'text-yellow-300' : 'text-custom-blue-inactive'"
            class="flex items-center justify-center text-center py-1 px-4 sm:px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs sm:text-sm md:text-md lg:text-lg"
            @click.stop="setSelectedCurrency(currency)">
         <img :src="currencyLogos[index]" alt="Currency Logo" :class="currency === 'Shib' ? 'w-6 h-6 object-contain mr-2' : 'w-6 h-6 rounded-full mr-2'">{{ currency }}
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
       :label="stakeLabel"
       :labelClass="'text-xs md:text-sm lg:text-md'"
       :currencyLogo="selectedCurrencyLogo"
       :tokenName="setSelectedCurrency"
       :isEditable="true"
       :isMaxSelectable="true"
       @amountChanged="handleAmountChanged"
       :accountAddress="accountAddress"
       :showGasPrice="true"
     />

     <div v-if="(!isSDIVSelected && (!accountAddress || (accountAddress && (!isInputValidForStaking || !isStakingPhaseActive))))" 
          class="staking-timer-container text-yellow-300 font-origin text-center w-full mb-2">
       <div class="staking-timer-text">
         {{ selectedOption === 'Staking' ? 'STAKING STARTS IN: ' : 'VESTING STARTS IN: ' }}{{ formattedTime }}
       </div>
     </div>
     
     <div v-if="isSDIVSelected && !isInputValidForStaking" 
          class="staking-timer-container text-yellow-300 font-origin text-center w-full mb-2">
       <div class="staking-timer-text">
         SDIV PHASE 2: {{ formattedSdivTime }}
       </div>
     </div>
 
     <ConnectWalletButton v-if="!accountAddress" @connect="$emit('connect')" class="mb-6"/>
      <div v-else>
        <div v-if="selectedOption === 'Staking'">
          <div class="mb-2 font-origin font-bold text-red-500" v-if="showWarning">{{ $t('message.pleaseselect') }}</div>
          <div class="relative currency-toggle cursor-pointer flex mb-4 rounded-xl overflow-hidden border-2"
               :class="{'border-red-500': showWarning, 'border-custom-blue': !showWarning}">
               <div class="absolute left-0 top-0 h-full transition-colors duration-300 ease-in-out"
               :style="toggleStyle('slot')"></div>
            <div v-for="slot in [1, 2, 3]" :key="`slot-${slot}`"
                 :class="selectedSlot === slot - 1 ? 'bg-button-active text-yellow-300' : 'bg-transparent text-custom-blue-inactive'"
                 class="flex items-center justify-center space-x-2 text-center py-1 px-4 sm:px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-md cursor-pointer"
                 @click="selectSlot(slot)">
                 <span class="block w-full text-xs md:text-sm lg:text-md">{{ $t('message.slot') }}&nbsp;{{ slot }}</span>
            </div>
          </div>
        </div>
        <div v-else>
          <input type="range" min="30" max="360" step="30" v-model="vestingPeriod" class="range range-primary w-full max-w-xs" @input="adjustVestingPeriod">
          <div class="text-teal font-origin mt-2 mb-2 text-xs md:text-sm lg:text-md">{{ $t('message.vestingperiod') }} {{ formattedVestingPeriod }}</div>
        </div>
        <button 
          @click="handleStakeClick" 
          :disabled="loading || (selectedOption === 'Staking' && selectedToken === 'PPEPE') || (timeRemaining > 0 && isInputValidForStaking)"
          class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 mb-6 text-sm md:text-md lg:text-lg">
          <orbit-spinner v-if="loading" :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
          <span v-else>
            {{ stakeButtonText }}
          </span>
        </button>
      </div>
    </div>
 </template>
 
 <script>
 import ConnectWalletButton from './ConnectWalletButton.vue';
 import TokenInputCard from './TokenInputCard.vue';
 import { OrbitSpinner } from 'epic-spinners';
import LPStakingABI from '../ABI/LPStakingABI.json';
import TokenABI from '../ABI/IERC20.json';
import VestingABI from '../ABI/VestingABI.json';
import { ethers } from 'ethers';
import { toHandlers } from 'vue';
import widgetAnalytics from '@/utils/widgetAnalytics';
 
 export default {
   name: 'ClaimCard',
   components: {
     TokenInputCard,
     ConnectWalletButton,
     OrbitSpinner
   },
   props: {
     rawPpepeBalance: String,
     rawPepeBalance: String,
     rawShibBalance: String,
     ppepeBalance: String,
     pepeBalance: String,
     shibBalance: String,
     ppepelpBalance: String,
     pepelpBalance: String,
     shiblpBalance: String,
     accountAddress: {
       type: String,
       default: null
     },
   },
   data() {
     return {
       loadingStake: false,
       loadingVest: false,
       currentNetwork: 'mainnet',
       tokenBalances: {
         ppepe: '0',
         pepe: '0',
         shib: '0',
       },
       lpTokenBalances: {
         ppepelp: '0',
         pepelp: '0',
         shiblp: '0',
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
           PPePe: '0x0000000000000000000000000000000000000000',
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
           shib: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
          },
          lptokens: {
           ppepelp: '0x45a8d3a8bfa5b1ec496508d738f5b9e3bd2cb86d',
           pepelp: '0xa43fe16908251ee70ef74718545e4fe6c5ccec9f',
           shiblp: '0xbef860db27fc2f9668d13d624563d859c65a2b25',
          }
        },
        sepolia: {
          staking: {
           PPePe: '0x0000000000000000000000000000000000000000',
           PePe: '0x6F295069d4F66D53DCC5a5dD2354199Cf55F2B66',
           Shib: '0x533Bf6eA7868abC6C78D73E60EB795Cb5FCa14C1',
          },
          vesting: {
           PPePe: '0x25B4DB21496F4A4447E3c18e8Acc72351EcD4BEb',
           PePe: '0xA65069D7b04e9Ab701D4504B83cE0E86d2eB1df5',
           Shib: '0x2e0f0D476812beaE3782EeA3D957CDEb25A886b0',
          },
          tokens: {
           ppepe: '0xB6Ad6AD0364Eb5E8B109a55F01F4F68971B40E2B',
           pepe: '0xf73BBA852bb30553326fA837f091aB7Ce740D0a9',
           shib: '0x46cB0AfFA874719c7b273Df80954CC98199e2d69',
          },
          lptokens: {
           ppepelp: '0xE763297d736b73d7e37809513B7399D1F66443Ed',
           pepelp: '0xB08eAC861c0FD07e74c3Bc6FBABe309e1F82afE5',
           shiblp: '0x5e29a016b9d79ef38Cc66B3E58A08af80b26FB91',
          }
        },
       },
       vestingPeriod: 30,
       selectedToken: 'PPePe',
       loading: false,
       currencies: ['PPePe', 'PePe', 'Shib'],
       currencyLogos: [
         require('@/assets/ppepe.webp'),
         require('@/assets/pepe.webp'),
         require('@/assets/shiba.webp')
       ],
       enteredAmountData: '0.00',
       walletBalanceData: '0.00',
       selectedOption: 'Staking',
       selectedSlot: null,
       showWarning: false,
       timeRemaining: null,
       timer: null,
       launchDate: '2025-08-17T12:00:00',
       endTime: new Date('2025-08-17T12:00:00').getTime(),
       sdivPhase2Date: '2025-12-09T12:00:00',
       sdivPhase2EndTime: new Date('2025-12-09T12:00:00').getTime(),
       sdivTimeRemaining: null,
     };
   },
   computed: {
     isMaxButtonDisabled() {
      const balance = this.lpTokenBalances[this.selectedToken.toLowerCase()];
      return !balance || balance === '0.00';
     },
     isStakingPhaseActive() {
       return this.timeRemaining > 0;
     },
     isInputValidForStaking() {
       const amount = parseFloat(this.enteredAmountData);
       return !isNaN(amount) && amount > 0;
     },
     stakeLabel() {
       return this.selectedOption === 'Vesting' ? this.$t('message.youvest') : this.$t('message.youstake');
     },
     stakeButtonText() {
       if (this.isSDIVSelected && this.isInputValidForStaking) {
         return `SDIV PHASE 2: ${this.formattedSdivTime}`;
       }
       else if (this.isSDIVSelected) {
         return this.$t('message.sdivcomingsoon');
       }
       
       if (this.timeRemaining > 0 && this.isInputValidForStaking) {
         return `STARTS IN ${this.formattedTime}`;
       }

       if (this.selectedOption === 'Staking') {
         if (this.selectedToken === 'PPePe') {
           return this.$t('message.sdivcomingsoon');
         }
         return this.$t('message.stakelp');
       } else if (this.selectedOption === 'Vesting') {
         return this.$t('message.vesttokens');
       }
       return '';
     },
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
       let formattedString = `${months} ${monthString} / ${days} ${dayString}`;
       return formattedString;
     },
     formattedTime() {
       if (this.timeRemaining <= 0) {
         return '00D 00HR 00MIN 00SEC';
       }
       
       const days = Math.floor(this.timeRemaining / (24 * 60 * 60 * 1000));
       const hours = Math.floor((this.timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
       const minutes = Math.floor((this.timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
       const seconds = Math.floor((this.timeRemaining % (60 * 1000)) / 1000);
       
       return `${days.toString().padStart(2, '0')}D ${hours.toString().padStart(2, '0')}HR ${minutes.toString().padStart(2, '0')}MIN ${seconds.toString().padStart(2, '0')}SEC`;
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
             balance = this.ppepelpBalance || '0';
             console.log("PPEPELP Balance: ", balance);
             break;
           case 'PePe':
             balance = this.pepelpBalance || '0';
             console.log("PEPELP Balance: ", balance);
             break;
           case 'Shib':
             balance = this.shiblpBalance || '0';
             console.log("SHIBLP Balance: ", balance);
             break;
         }
       } else {
         switch (this.selectedToken) {
           case 'PPePe':
             console.log("PPePe Balance: ", this.ppepeBalance);
             balance = this.ppepeBalance || '0';
             break;
           case 'PePe':
             console.log("PePe Balance: ", this.pepeBalance);
             balance = this.pepeBalance || '0';
             break;
         case 'Shib':
           console.log("Shib Balance: ", this.shibBalance);
           balance = this.shibBalance || '0';
           break;
         }
       } 
       return this.abbreviateNumber(balance);
     },
     isSDIVSelected() {
       return this.selectedOption === 'Staking' && this.selectedToken === 'PPePe';
     },
     formattedSdivTime() {
       if (this.sdivTimeRemaining <= 0) {
         return '00D 00HR 00MIN 00SEC';
       }
       
       const days = Math.floor(this.sdivTimeRemaining / (24 * 60 * 60 * 1000));
       const hours = Math.floor((this.sdivTimeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
       const minutes = Math.floor((this.sdivTimeRemaining % (60 * 60 * 1000)) / (60 * 1000));
       const seconds = Math.floor((this.sdivTimeRemaining % (60 * 1000)) / 1000);
       
       return `${days.toString().padStart(2, '0')}D ${hours.toString().padStart(2, '0')}HR ${minutes.toString().padStart(2, '0')}MIN ${seconds.toString().padStart(2, '0')}SEC`;
     },
   },
   methods: {
     isValidAddress(address) {
       return address && address !== '0x0000000000000000000000000000000000000000';
     },
     selectSlot(slot) {
      const zeroBasedSlot = slot - 1;
      if (this.selectedSlot === zeroBasedSlot) {
        this.selectedSlot = null;
        this.showWarning = false;
      } else {
        this.selectedSlot = zeroBasedSlot;
        this.showWarning = false;
      }
     },
     updateTimer() {
       const now = new Date().getTime();
       this.timeRemaining = Math.max(0, this.endTime - now);
       this.sdivTimeRemaining = Math.max(0, this.sdivPhase2EndTime - now);
       
       if (this.timeRemaining <= 0) {
         clearInterval(this.timer);
         this.$emit('countdown-complete');
       }
     },
     setEndTime(newEndTime) {
       this.endTime = newEndTime;
       this.updateTimer();
     },
     setLaunchDate(dateString) {
       this.launchDate = dateString;
       this.endTime = new Date(dateString).getTime();
       this.updateTimer();
     },
     setSdivPhase2Date(dateString) {
       this.sdivPhase2Date = dateString;
       this.sdivPhase2EndTime = new Date(dateString).getTime();
       this.updateTimer();
     },
     async fetchAndUpdateBalances() {
      const newBalances = {
        ppepe: await this.fetchTokenBalances('ppepe'),
        pepe: await this.fetchTokenBalances('pepe'),
        shib: await this.fetchTokenBalances('shib'),
        ppepelp: await this.fetchLPTokenBalances('ppepelp'),
        pepelp: await this.fetchLPTokenBalances('pepelp'),
        shiblp: await this.fetchLPTokenBalances('shiblp'),
      };

      this.$emit('updateBalances', newBalances);
     },
     subscribeToNewBlocks() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      provider.on('block', () => {
        this.fetchLPTokenBalances();
        this.fetchTokenBalances();
      });
     },
     abbreviateNumber(value) {
       if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) {
         return '0.00';
       }
       
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
         return newValue.toFixed(2);
       }
     },
     async fetchTokenBalances() {
       try {
         if (!this.accountAddress) {
          //console.error("No account address provided.");
          return;
         }
         
         const provider = new ethers.BrowserProvider(window.ethereum);
          //console.log(`Current network: ${this.currentNetwork}`);
         
         for (const [tokenName, tokenAddress] of Object.entries(this.contractAddresses[this.currentNetwork].tokens)) {
           if (!this.isValidAddress(tokenAddress)) 
           continue;
           
           try {
             const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
             const balanceInWei = await tokenContract.balanceOf(this.accountAddress);
             const balanceInEther = ethers.formatEther(balanceInWei);
             this.tokenBalances[tokenName] = balanceInEther;
           } catch (error) {
             this.tokenBalances[tokenName] = '0.00';
           }
         }
       } catch (error) {
         console.error("Critical error in fetchTokenBalances:", error);
       }
     },
     async fetchLPTokenBalances() {
       try {
         if (!this.accountAddress) {
           return;
         }
         
         const provider = new ethers.BrowserProvider(window.ethereum);
         
         for (const [tokenName, tokenAddress] of Object.entries(this.contractAddresses[this.currentNetwork].lptokens)) {
           try {
             const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
             const balanceInWei = await tokenContract.balanceOf(this.accountAddress);
             const balanceInEther = ethers.formatEther(balanceInWei);
             this.lpTokenBalances[tokenName] = balanceInEther;
           } catch (error) {
             this.lpTokenBalances[tokenName] = '0.00';
           }
         }
       } catch (error) {
         console.error("Critical error in fetchLPTokenBalances:", error);
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
         console.log("Selected Contract Address: ", this.selectedStakingContractAddress);
       } else {
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
      const newNetwork = network.chainId === 1 ? 'mainnet' : 'sepolia';
      //const newNetwork = network.chainId === 11155111 ? 'sepolia' : 'mainnet';

      if (this.currentNetwork !== newNetwork) {
        this.currentNetwork = newNetwork;
        console.log(`Detected and set current network to: ${this.currentNetwork}`);
        this.$emit('networkChanged', this.currentNetwork);
      }
     },
     async handleStakeClick() {
      if (parseFloat(this.enteredAmountData) <= 0) {
        this.$root.$refs.notificationCard.showNotification("error", "Please enter a number greater than zero");
        return;
      }
      if (this.selectedOption === 'Staking' && this.selectedSlot === null) {
        this.$root.$refs.notificationCard.showNotification("error", "Please select a slot");
        return;
      }
      try {
        this.loading = true;
        this.$root.$refs.notificationCard.showNotification("pending", "Transaction pending...");
        if (!this.currentNetwork) {
          console.error('Network not detected or unsupported');
          this.$root.$refs.notificationCard.showNotification("error", "Network not detected or unsupported");
          this.loading = false;
          return;
        }
        if (this.selectedOption === 'Staking' && this.selectedToken === 'PPePe') {
          this.$root.$refs.notificationCard.showNotification("SDIVComingSoon", "SDIV is coming soon!");
          this.loading = false;
          return;
        }
        if (this.selectedOption === 'Staking' && this.selectedSlot === null) {
          this.showWarning = true;
          this.loading = false;
          return;
        } else {
          this.showWarning = false;
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        let contractAddress, contractABI, contractMethod, timeIndex, tokenContractAddress;
        if (this.selectedOption === 'Staking') {
          contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
          console.log("Using staking address:", contractAddress);

          if (!this.isValidAddress(contractAddress)) {
            console.error(`No contract address found for option: Staking and token: ${this.selectedToken}`);
            this.$root.$refs.notificationCard.showNotification("error", "Invalid contract address");
            this.loading = false;
            return;
          }

          console.log("Proceeding with staking logic using address:", contractAddress);
          contractABI = LPStakingABI;
          contractMethod = 'stakeLPToken';
          tokenContractAddress = this.contractAddresses[this.currentNetwork].lptokens[this.selectedToken.toLowerCase() + 'lp'];
          console.log("Token Contract Address:", tokenContractAddress);
        } else if (this.selectedOption === 'Vesting') {
          contractAddress = this.contractAddresses[this.currentNetwork].vesting[this.selectedToken];
          contractABI = VestingABI;
          contractMethod = 'vestTokens';
          // if (this.vestingPeriod === 365) {
          //   timeIndex = 11;
          // } else {
          //   timeIndex = Math.round(this.vestingPeriod / 30) - 1;
          // }
          timeIndex = this.vestingPeriod === 365 ? 11 : Math.round(this.vestingPeriod / 30) - 1;
          tokenContractAddress = this.contractAddresses[this.currentNetwork].tokens[this.selectedToken.toLowerCase()];
        } else {
          console.error('Invalid option selected');
          return;
        }

        if (!contractAddress || !tokenContractAddress) {
          console.error(`No contract address found for option: ${this.selectedOption} and token: ${this.selectedToken}`);
          this.loading = false;
          return;
        }

        console.log(`Using contract address: ${contractAddress} for ${this.selectedOption}`);
        const amountInWei = ethers.parseUnits(this.enteredAmountData, 18);
        const tokenContract = new ethers.Contract(tokenContractAddress, TokenABI, signer);
        const approveTx = await tokenContract.approve(contractAddress, amountInWei);
        await approveTx.wait();
        console.log("Tokens approved");

        const actionContract = new ethers.Contract(contractAddress, contractABI, signer);
        let actionTx;
        if (this.selectedOption === 'Staking') {
          const slot = this.selectedSlot;
          actionTx = await actionContract[contractMethod](amountInWei, slot);
        } else if (this.selectedOption === 'Vesting') {
          actionTx = await actionContract[contractMethod](amountInWei, timeIndex);
        }
        const receipt = await actionTx.wait();
        console.log(`${this.selectedOption} action completed successfully`);
        
        widgetAnalytics.trackInteraction(this.selectedOption.toLowerCase(), true, {
          amount: this.enteredAmountData,
          token: this.selectedToken,
          slotIndex: this.selectedOption === 'Staking' ? this.selectedSlot : null,
          vestingPeriod: this.selectedOption === 'Vesting' ? this.vestingPeriod : null,
          txHash: receipt.transactionHash,
          gasUsed: receipt.gasUsed?.toString(),
          blockNumber: receipt.blockNumber
        });
        
        this.$root.$refs.notificationCard.showNotification(this.selectedOption === 'Staking' ? "LPStakingSuccess" : "VestingSuccess", `${this.selectedOption} successfull`);
        this.loading = false;
      } catch (error) {
        //console.error("Error during action:", error);
        
        widgetAnalytics.trackInteraction(this.selectedOption.toLowerCase(), false, {
          error: error.message || error,
          token: this.selectedToken,
          amount: this.enteredAmountData,
          slotIndex: this.selectedOption === 'Staking' ? this.selectedSlot : null,
          vestingPeriod: this.selectedOption === 'Vesting' ? this.vestingPeriod : null,
          errorCode: error.code
        });
        
        const errorCode = error.code || (error.error && error.error.code);
        if (errorCode === 4001 || errorCode === 'ACTION_REJECTED') {
          this.$root.$refs.notificationCard.showNotification("error", `${this.selectedOption} Transaction Rejected`);
        } else {
          this.$root.$refs.notificationCard.showNotification("error", `${this.selectedOption} action failed: ${error.message}`);
        }
        this.loading = false;
      }
     },
     updateWalletBalance() {
       this.walletBalanceData = this.selectedTokenBalance;
     },
     toggleStyle(type) {
       let index = 0;
       let percentage = 0;
       if (type === 'token') {
         index = this.currencies.indexOf(this.selectedToken);
         percentage = 33.33 * index;
       } else if (type === 'slot' && this.selectedSlot !== null) {
         index = this.selectedSlot;
         percentage = 33.33 * index;
       }
       return { left: `${percentage}%`, width: '33.33%' };
     }
   },
   mounted() {
    try {
      this.detectNetwork();
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', async (accounts) => {
          this.$emit('update:accountAddress', accounts[0]);
          await Promise.all([
            this.fetchLPTokenBalances(),
            this.fetchTokenBalances()
          ]);
        });

        window.ethereum.on('chainChanged', async () => {
          await this.detectNetwork();
          await Promise.all([
            this.fetchLPTokenBalances(),
            this.fetchTokenBalances()
          ]);
        });

        this.subscribeToNewBlocks();
        
        if (this.accountAddress) {
          this.fetchLPTokenBalances();
          this.fetchTokenBalances();
        }
      }
      
      this.updateTimer();
      this.timer = setInterval(this.updateTimer, 1000);
    } catch (error) {
      console.error("Error in mounted:", error);
    }
   },
   beforeUnmount() {
     clearInterval(this.timer);
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
     tokenBalances: {
      deep: true,
      handler(newBalances) {
        this.$emit('updateBalances', { ppepe: newBalances.ppepe, pepe: newBalances.pepe, shib: newBalances.shib });
      }
     },
     lpTokenBalances: {
      deep: true,
      handler(newBalances) {
        this.$emit('updateLPBalances', { ppepelp: newBalances.ppepelp, pepelp: newBalances.pepelp, shiblp: newBalances.shiblp });
      }
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

.staking-timer-container {
  font-weight: bold;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.countdown-ending {
  animation: pulse 1s infinite;
}
 </style>