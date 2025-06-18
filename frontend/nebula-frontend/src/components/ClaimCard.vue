<template>
  <div class="flex flex-col items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-50 p-5 rounded-xl w-full mx-auto">
   <div class="flex flex-col items-center font-origin w-full text-center">
     <div class="flex flex-col items-center font-origin w-full text-center">
     <div class="toggle-switch flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative">
       <div class="absolute left-0 top-0 h-full w-1/2 bg-button-active rounded-xl transition-all duration-300"
            :class="selectedOption === 'Staking' ? 'left-0' : 'left-1/2'"></div>
       <div 
         class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-lg"
         :class="selectedOption === 'Staking' ? 'text-yellow-300' : 'text-custom-blue-inactive'"
         @click="setSelectedOption('Staking')">
         {{ $t('message.lpstaking') }}
       </div>
       <div 
         class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-lg"
         :class="selectedOption === 'Vesting' ? 'text-yellow-300' : 'text-custom-blue-inactive'"
         @click="setSelectedOption('Vesting')">
         {{ $t('message.vesting') }}
       </div>
     </div>
     <div class="currency-toggle flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative">
       <div class="absolute left-0 top-0 h-full w-1/3 bg-button-active rounded-xl transition-all duration-300"
            :style="toggleStyle"></div>
       <div v-for="(currency, index) in currencies"
            :key="currency"
            :class="selectedToken === currency ? 'text-yellow-300' : 'text-custom-blue-inactive'"
            class="flex items-center justify-center text-center py-1 px-4 sm:px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-lg"
            @click.stop="setSelectedCurrency(currency)">
         <img :src="currencyLogos[index]" alt="Currency Logo" :class="currency === 'Shib' ? 'w-6 h-6 object-contain mr-2' : 'w-6 h-6 rounded-full mr-2'">{{ currency }}
       </div>
      </div>
     </div>
    </div>

    <div v-if="selectedOption === 'Staking'" class="staking-rewards-container flex flex-col justify-center items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-55 p-5 rounded-xl w-full mx-auto mb-4">
      <div v-if="selectedToken !== 'PPePe' && stakes.length > 0" class="w-full max-w-sm mx-auto md:max-w-md lg:max-w-lg">
        <p class="font-origin text-yellow-300 mb-4">{{ $t('message.lpstakingslot') }}</p>
        <div :class="{ 'grid grid-cols-1 md:grid-cols-2 gap-4 justify-start': stakes.length > 1 }">
          <div v-for="(stake, index) in stakes" :key="index"
              class="w-full max-w-full mx-auto cursor-pointer items-center relative" 
              @click="selectStakingSlot(index)"
              :class="{
               'md:col-span-2 md:flex md:flex-col md:justify-center md:items-center md:text-center': [1, 3].includes(stakes.length) && index === stakes.length - 1,
               'flex justify-center items-center p-4 rounded-lg bg-card-blue bg-opacity-85 hover:bg-blue-900 focus:border-green-500 transition-colors duration-300': true,
               'border-2 border-custom-blue': selectedStakeIndex !== stake.originalIndex,
               'border-2 border-green-500': selectedStakeIndex === stake.originalIndex,
               'opacity-50': stake.isEmpty,
               'cursor-not-allowed': stake.isEmpty,
               'last:mr-0': index % 2 === 0,
              }">
            <div>
              <div class="md:text-left md:justify-center sm:justify-center sm:text-center sm:w-full" :class="{'md:text-center': [1, 3].includes(stakes.length) && index === stakes.length - 1}">
                <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md text-center">{{ $t('message.primordialemis') }}</p>
                <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md text-center">{{ primordialEmissions[index] }}%</p>
                <hr class="my-2 border-t-2 border-yellow-300 w-full">
                <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md text-center">{{ $t('message.amount') }}: {{ ethers.formatEther(stake.amount) }}</p>
                <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md text-center">{{ $t('message.starttime') }}: {{ calculateDaysAgo(stake.startTime) }}</p>
                <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md text-center">{{ $t('message.rewardsowed') }}: {{ stake.rewardsOwed }}</p>
              </div>
              <div v-if="selectedStakeIndex === stake.originalIndex" class="absolute top-0 right-0 p-1">
                <img src="@/assets/check.webp" alt="Selected" class="w-4 h-4">
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-if="showError" class="text-red-500 font-origin mt-4">{{ $t('message.pleaseselect') }}</p> 
      <div class="font-origin text-yellow-300 text-sm md:text-md lg:text-lg">
        <div v-if="selectedToken === 'PPePe'">
            {{ $t('message.sdivrewardscomingsoon') }}
          </div>
          <div v-else>
            <div v-if="stakes.length === 0">
              {{ $t('message.nostakingslots') }}
            </div>
          </div>
      </div>
    </div>

    <div v-if="selectedOption === 'Vesting'" class="flex flex-col justify-center items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-55 p-5 rounded-xl w-full mx-auto mb-4">
      <div v-if="vests && vests.length" class="w-full max-w-sm mx-auto md:max-w-md lg:max-w-lg">
        <p class="font-origin text-yellow-300 mb-4">{{ $t('message.vestingslots') }}</p>          
          <div :class="{ 'grid grid-cols-1 md:grid-cols-2 gap-4 justify-start': vests.length > 1 }">
          <div v-for="(vest, index) in vests" :key="index" 
            :ref="'vestSlot' + index"
            class="mb-0 last:mb-0 w-full max-w-full mx-auto cursor-pointer relative" 
            @click="selectVestSlot(index)"
            :class="{
              'md:col-span-2 md:flex md:flex-col md:justify-center md:items-center md:text-center': [1, 3, 5, 7, 9, 11].includes(vests.length) && index === vests.length - 1,
              'flex justify-center items-center text-center p-4 rounded-lg bg-card-blue bg-opacity-85 hover:bg-blue-900 focus:border-green-500 transition-colors duration-300': !vest.isEmpty,
              'opacity-50 cursor-not-allowed': vest.isEmpty,
              'border-2 border-custom-blue': selectedVestIndex !== vest.originalIndex,
              'border-2 border-green-500': selectedVestIndex === vest.originalIndex,
              'opacity-50': vest.isEmpty,
              'cursor-not-allowed': vest.isEmpty,
              'last:mr-0': index % 2 === 0,
            }">
          <div>
            <div class="md:text-left md:justify-center sm:justify-center sm:text-center sm:w-full" :class="{'text-center md:text-center': [1, 3, 5, 7, 9, 11].includes(vests.length) && index === vests.length - 1}">
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.amount') }}: {{ abbreviateNumber(ethers.formatEther(vest.amount)) || $t('message.calculating') }}</p>
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.locked') }}: {{ lockedTimes[index] || $t('message.calculating') }}</p>
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.remaining') }}: {{ calculateTimeLeft(vest.endTime) !== "0 mins" ? calculateTimeLeft(vest.endTime) : $t('message.calculating') }}</p>
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.apr') }}: {{ (vest.apr)+'%' || $t('message.calculating') }}</p>
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.estimatedrewards') }}: {{ abbreviateNumber(calculateEstimatedRewards(vest)) || $t('message.calculating') }}</p>
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">
                <!-- {{ $t('message.value') }}:  -->
                ${{ calculateVestValue(vest).usd }} / Ξ{{ calculateVestValue(vest).eth }} 
                <!-- ETH -->
              </p>
            </div>
            <div v-if="selectedVestIndex === vest.originalIndex" class="absolute top-0 right-0 p-1">
              <img src="@/assets/check.webp" alt="Selected" class="w-4 h-4">
            </div>
          </div>
          </div>
        </div>
      </div>
      <p v-if="showError" class="text-red-500 font-origin mt-4">{{ $t('message.pleaseselect') }}</p>
      <div v-else class="font-origin text-yellow-300 text-sm md:text-md lg:text-lg">
        <div v-if="vests.length === 0">
          {{ $t('message.novestingslots') }}
        </div>
      </div>
    </div>

     <div class="mb-6">
     <ConnectWalletButton v-if="!accountAddress" @connect="$emit('connect')" :isConnecting="isConnecting" class="w-full mb-6"/>
     <div v-if="accountAddress && selectedOption === 'Staking'">
       <div v-if="selectedToken === 'PPePe'">
         <button @click="sdivComingSoon" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 mr-5 text-sm md:text-md lg:text-lg">
           {{ $t('message.sdivcomingsoon') }}
         </button>
       </div>
       <div v-else>
         <div class="flex justify-center w-full">
           <div v-if="loadingUnstake || loadingClaim" class="flex justify-center w-full">
             <button class="bg-gradient-to-r font-origin from-sky-600 to sky-900 text-yellow-300 px-4 py-2 rounded-xl cursor-pointer font-semibold">
               <orbit-spinner :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
             </button>
           </div>
           <div v-else class="flex justify-between w-full">
             <button @click="handleUnstakeClick" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer font-semibold">
               {{ $t('message.unstakelp') }}
             </button>
             <button @click="handleClaimClick" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer font-semibold">
               {{ $t('message.claim') }}
             </button>
           </div>
         </div>
       </div>
      </div>
      <div v-if="accountAddress && selectedOption === 'Vesting'" class="flex justify-center w-full">
        <div v-if="loadingEmergencyWithdraw || loadingVestingClaim" class="flex justify-center w-full">
          <button class="bg-gradient-to-r font-origin from-sky-600 to sky-900 text-yellow-300 px-4 py-2 rounded-xl cursor-pointer font-semibold">
            <orbit-spinner :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
          </button>
        </div>
        <div v-else class="flex justify-between w-full">
          <button @click="handleEmergencyWithdrawClick" 
                  :disabled="loadingEmergencyWithdraw" 
                  class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer font-semibold">
            {{ $t('message.emergencywithdraw') }}
          </button>
          <button @click="handleVestingClaimClick" 
                  :disabled="loadingVestingClaim" 
                  class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer font-semibold">
            {{ $t('message.claim') }}
          </button>
        </div>
      </div>
    </div>
  </div>
 </template>
 
 <script>
 import ConnectWalletButton from './ConnectWalletButton.vue';
 import { OrbitSpinner } from 'epic-spinners';
import widgetAnalytics from '@/utils/widgetAnalytics';
 import LPStakingABI from '../ABI/LPStakingABI.json';
 import VestingABI from '../ABI/VestingABI.json';
 import { ethers } from 'ethers';
 import { toHandlers } from 'vue';
 import { formatDistanceToNow } from 'date-fns';
 import { gsap } from 'gsap';
 
 const pricingCache = {
   data: null,
   lastUpdated: null,
 };

  // eslint-disable-next-line no-unused-vars
  async function fetchPricingData(selectedToken) {
   console.log('Starting fetchPricingData for token:', selectedToken); 
   try {
     const tokenIds = {
       PPePe: 'primordial-pepe',
       PePe: 'pepe', 
       Shib: 'shiba-inu'
     };
     
     const tokenId = tokenIds[selectedToken];
     console.log('Mapped token ID:', tokenId); 
     
     const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd,eth`);
     const data = await response.json();
     console.log('API Response:', data); 

     if (!data || !data[tokenId]) {
       throw new Error(`Invalid response for token ${tokenId}`);
     }

     if (!pricingCache.data) {
       pricingCache.data = {};
     }

     pricingCache.data[selectedToken] = {
       usd: data[tokenId].usd || 0,
       eth: data[tokenId].eth || 0
     };
     pricingCache.lastUpdated = Date.now();
     console.log('Updated cache:', pricingCache.data); 
   } catch (error) {
     console.error('Error fetching pricing data:', error);
     if (!pricingCache.data) {
       pricingCache.data = {};
     }
     pricingCache.data[selectedToken.toLowerCase()] = {
       usd: 0,
       eth: 0
     };
   }
  }

 export default {
   name: 'ClaimCard',
   components: {
     ConnectWalletButton,
     OrbitSpinner
   },
   props: {
     accountAddress: {
       type: String,
       default: null
     },
     rawPpepeBalance: String,
     rawPepeBalance: String,
     rawShibBalance: String,
     ppepeBalance: String,
     pepeBalance: String,
     shibBalance: String,
     ppepelpBalance: String,
     pepelpBalance: String,
     shiblpBalance: String,
     isConnecting: Boolean,
   },
   data() {
     return {
       isPPEPESelected: false,
       selectedVestIndex: null,
       selectedStakeIndex: null,
       lockedTimes: {},
       vests: [],
       stakes: [],
       primordialEmissions: [],
       stakedAmountWei: '0',
       stakedAmount: '0',
       rewardsOwed: [],
       currentNetwork: 'mainnet',
       tokenBalances: {
         ppepe: '0',
         pepe: '0',
         shib: '0',
       },
       lpTokenBalances: {
         PrimordialPePeLP: '0',
         PePeLP: '0',
         ShibLP: '0',
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
             PrimordialPePeLP: '0x45a8d3a8bfa5b1ec496508d738f5b9e3bd2cb86d',
             PePeLP: '0xa43fe16908251ee70ef74718545e4fe6c5ccec9f',
             ShibLP: '0xbef860db27fc2f9668d13d624563d859c65a2b25',
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
             PrimordialPePeLP: '0xE763297d736b73d7e37809513B7399D1F66443Ed',
             PePeLP: '0xB08eAC861c0FD07e74c3Bc6FBABe309e1F82afE5',
             ShibLP: '0x5e29a016b9d79ef38Cc66B3E58A08af80b26FB91',
           }
         },
         base : {
           staking: {

           },
           vesting: {

           },
           tokens: {

           },
           lptokens: {

           }
         },
         base_sepolia: {
           staking: {

           },
           vesting: {

           },
           token: {

           },
           lptokens: {

           }
         },
       },
       vestingPeriod: 30,
       selectedToken: 'PPePe',
       loadingClaim: false,
       loadingUnstake: false,
       loadingEmergencyWithdraw: false,
       loadingVestingClaim: false,
       loading: false,
       claimButtonText: 'Claim',
       currencies: ['PPePe', 'PePe', 'Shib'],
       currencyLogos: [
         require('@/assets/ppepe.webp'),
         require('@/assets/pepe.webp'),
         require('@/assets/shiba.webp')
       ],
       enteredAmountData: '0.00',
       walletBalanceData: '0.00',
       selectedOption: 'Staking',
       selectedSlot: 0, 
       showError: false,
       tokenPrices: {
         PPEPE: 0,
         PEPE: 0,
         SHIB: 0
       },
       priceLoadingError: false,
       pricingData: null,
     };
   },
   methods: {
     convertEmissionToDailyRate(primordialEmission) {
       // eslint-disable-next-line no-undef
       const basisPoints = Number(primordialEmission);
       console.log("Basis points:", basisPoints);
       // eslint-disable-next-line no-undef
       const dailyRate = basisPoints / 1000;
       console.log("Daily rate:", dailyRate);
       return dailyRate.toFixed(3);
     },
     isValidAddress(address) {
       return address && address !== '0x0000000000000000000000000000000000000000';
     },
     handleConnect() {
       this.$emit('connect');
     },
     updateVests(newVests) {
       this.vests = [...newVests];
     },
     selectStakingSlot(index) {
       const originalIndex = this.stakes[index].originalIndex;
       if (this.selectedStakeIndex === originalIndex) {
         this.selectedStakeIndex = null;
         this.showError = false;
         console.log('index selected staking slot:', this.selectedStakeIndex)
       } else {
         this.selectedStakeIndex = originalIndex;
         console.log(`Selected stake slot: ${originalIndex}`);
         this.showError = false;
       }
       console.log("OriginalIndex:", originalIndex)
     },
     selectVestSlot(index) {
       const originalIndex = this.vests[index].originalIndex;
       if (this.selectedVestIndex === originalIndex) {
         this.selectedVestIndex = null;
         this.showError = false;
       } else {
         this.selectedVestIndex = originalIndex; 
         console.log(`Selected vest slot: ${originalIndex}`);
         this.showError = false;
       }
     },
     sdivComingSoon() {
       this.$root.$refs.notificationCard.showNotification("SDIVComingSoon");
     },
     calculateEstimatedRewards(vest) {
       const ethers = require('ethers');
       const amountInEther = ethers.formatUnits(vest.amount, 'ether');
       const annualReward = (parseFloat(amountInEther) * vest.apr) / 100;
       const vestingPeriodInMonths = (vest.endTime - vest.startTime) / (30 * 24 * 60 * 60);
       const monthlyReward = annualReward / 12;
       const estimatedRewards = monthlyReward * vestingPeriodInMonths;
       return Number(estimatedRewards.toFixed(2));
     },
     calculateTimeLeft(endTime) {
       const now = Date.now();
       const endTimeDate = new Date(endTime * 1000);
       const timeDiff = endTimeDate - now;
       if (timeDiff <= 0) {
         return '0 mins';
       } else if (timeDiff < 60 * 60 * 1000) { // Less than 1 hour
         const minutes = Math.ceil(timeDiff / (60 * 1000));
         return `${minutes} mins`;
       } else if (timeDiff < 24 * 60 * 60 * 1000) { // Less than 1 day
         const hours = Math.ceil(timeDiff / (60 * 60 * 1000));
         return `${hours} hrs`;
       } else if (timeDiff <= 30 * 24 * 60 * 60 * 1000) { // Less than 1 month
         const days = Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
         return `${days} days`;
       } else {
         const months = Math.floor(timeDiff / (30 * 24 * 60 * 60 * 1000));
         return `${months} mos.`;
       }
     },
     playShineAnimation(element) {
       gsap.to(element, {
         duration: 1,
         boxShadow: "0 0 20px yellow, 0 0 30px yellow, 0 0 40px yellow, 0 0 50px yellow",
         repeat: -1,
         yoyo: true,
         ease: "power1.inOut"
       });
     },
     async fetchAllVests() {
       if (!this.accountAddress || !this.selectedToken) return;
       const provider = new ethers.BrowserProvider(window.ethereum);
       const vestingContractAddress = this.contractAddresses[this.currentNetwork].vesting[this.selectedToken];
       const vestingContract = new ethers.Contract(vestingContractAddress, VestingABI, provider);

       try {
         const [slotsAvailability, vests] = await vestingContract.getAllSlots(this.accountAddress);
         this.vests = vests.map((vest, index) => ({
           index: index,
           originalIndex: index,
           amount: vest.amount.toString(),
           startTime: vest.startTime.toString(),
           endTime: vest.endTime.toString(),
           apr: vest.apr.toString(),
           active: slotsAvailability[index],
         })).filter(vest => vest.active);
         console.log(`Fetched active vesting slots.`);
       } catch (error) {
         console.error("Failed to fetch vesting slots:", error);
         this.vests = [];
       }
     },
     async fetchStakingSlots() {
       try {
         if (!this.accountAddress || !this.selectedToken) return; 
         const provider = new ethers.BrowserProvider(window.ethereum);
         await provider.send("eth_requestAccounts", []);
         const network = await provider.getNetwork();
         //console.log(`Current network: ${network.name}`);
         const stakingContractAddress = this.contractAddresses[network.name].staking[this.selectedToken];
         if (!this.isValidAddress(stakingContractAddress)) {
           //console.log("Staking contract address is invalid:", stakingContractAddress);
           return;
         }
         console.log(`Using staking contract address: ${stakingContractAddress}`);
         const stakingContract = new ethers.Contract(stakingContractAddress, LPStakingABI, provider);

         try {
           const [slotsAvailability, stakes] = await stakingContract.getAllSlots(this.accountAddress);
           console.log("Slots:", stakingContract.getAllSlots(this.accountAddress));
           this.rewardsOwed = [];
           if (!stakes || !stakes.length) {
             console.error("No stakes returned or stakes are empty");
             this.stakes = [];
             return;
           }
           this.stakes = stakes.map((stake, index) => ({
             amount: stake.amount.toString(),
             startTime: stake.startTime.toString(),
             lastClaimTime: stake.lastClaimTime.toString(),
             rewardsOwed: "0.0000",
             isEmpty: slotsAvailability[index],
             originalIndex: index
           })).filter(stake => !stake.isEmpty);

           console.log(`Fetched ${this.stakes.length} staking slots with rewards.`);
           await this.fetchPrimordialEmissions();
         } catch (error) {
           console.error("Failed to fetch staking slots:", error);
           this.stakes = [];
         }
       } catch (error) {
         if (error.code === -32002) {
           console.error('Connection request already pending:', error.message);
         } else {
           console.error('Error fetching staking slots:', error);
         }
       }
     },
     async fetchVestingSlots() {
       if (!this.accountAddress || !this.selectedToken) return; 
       const provider = new ethers.BrowserProvider(window.ethereum);
       await provider.send("eth_requestAccounts", []);
       const network = await provider.getNetwork();
       //console.log(`Current network: ${network.name}`);
       const vestingContractAddress = this.contractAddresses[network.name].vesting[this.selectedToken];
       console.log(`Using vesting contract address: ${vestingContractAddress}`);
       const vestingContract = new ethers.Contract(vestingContractAddress, VestingABI, provider);

       try {
         const [slotsAvailability, vests] = await vestingContract.getAllSlots(this.accountAddress);
         if (!vests || !vests.length) {
             console.error("No vests returned or vests are empty");
             this.vests = [];
             return;
         }
         this.vests = vests.map((vest, index) => ({
           amount: vest.amount.toString(),
           startTime: vest.startTime.toString(),
           endTime: vest.endTime.toString(),
           apr: vest.apr.toString(),
           originalIndex: index,
           isEmpty: slotsAvailability[index]
         })).filter(vest => !vest.isEmpty);

         for (const [index, vest] of this.vests.entries()) {
           await this.calculateLockedTimeUsingContract(vest.startTime, vest.endTime, index);
         }
         console.log(`Fetched ${this.vests.length} active vesting slots.`);
       } catch (error) {
         console.error("Failed to fetch vesting slots:", error);
         this.vests = [];
       }
     },
     formattedStartTime(stakes) {
       if (!stakes || !stakes.startTime || stakes.startTime === 0) {
         return 'Invalid date';
       }
       console.log("Stake:", stakes);
       const date = new Date(stakes.startTime * 1000);
       return formatDistanceToNow(date, { addSuffix: true });
     },
     calculateDaysAgo(startTime) {
       const startDate = new Date(startTime * 1000);
       const currentDate = new Date();
       const timeDifference = currentDate - startDate;

       const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
       if (daysDifference >= 1) {
         return `${daysDifference} days ago`;
       }

       const hoursDifference = Math.floor(timeDifference / (1000 * 60 * 60));
       if (hoursDifference >= 1) {
         return `${hoursDifference} hrs ago`;
       }

       const minutesDifference = Math.floor(timeDifference / (1000 * 60));
       return `${minutesDifference} mins ago`;
     },
     async calculateLockedTimeUsingContract(startTime, endTime, index) {
       if (!this.accountAddress || !this.selectedToken) return; 
       const provider = new ethers.BrowserProvider(window.ethereum);
       await provider.send("eth_requestAccounts", []);
       const network = await provider.getNetwork();
       //console.log(`Current network: ${network.name}`);
       const vestingContractAddress = this.contractAddresses[network.name].vesting[this.selectedToken];
       const contract = new ethers.Contract(vestingContractAddress, VestingABI, provider);
       const duration = endTime - startTime;
       try {
         const months = await contract.findTimeBracketIndex(duration);
         const adjustedMonths = Math.max(Number(months) + 1, 1);
         const monthWord = adjustedMonths === 1 ? 'mo.' : 'mos.';
         this.lockedTimes[index] = `${adjustedMonths} ${monthWord}`;
         console.log(this.lockedTimes[index]);
       } catch (error) {
         console.error("Error calculating locked time:", error);
         this.lockedTimes[index] = 'Error';
       }
     },
     async fetchPrimordialEmissions() {
       this.primordialEmissions = new Array(this.stakes.length).fill("0.0000");
       await Promise.all(this.stakes.map(async (stake, index) => {
         try {
           const provider = new ethers.BrowserProvider(window.ethereum);
           const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
           if (!this.isValidAddress(contractAddress)) {
             console.log("Primordial Emission contract address is invalid:", contractAddress);
             return;
           }
           const contract = new ethers.Contract(contractAddress, LPStakingABI, provider);
           const emissionPreConversion = await contract.getPrimordialEmission(this.accountAddress, index);
           console.log("Emission:", emissionPreConversion);
           const emission = this.convertEmissionToDailyRate(emissionPreConversion);
           console.log("Emission:", emission);
           if (!emission || emission === '0.000') {
             console.error(`Emission result is zero or undefined for slot ${index}`, emission);
             this.primordialEmissions[index] = "0.000";
           } else {
             this.primordialEmissions[index] = emission;
           }
           console.log("Primordial Emission for slot", index, ":", this.primordialEmissions[index]);
         } catch (error) {
           console.error("Error fetching Primordial Emission for slot", index, ":", error);
           if (error.code === -32000) {
             console.error("Execution reverted by the EVM.");
           }
         }
       }));
     },
     async fetchAllPrimordialEmissions() {
       this.primordialEmissions = new Array(this.stakes.length).fill("0.0000");
       await Promise.all(this.stakes.map(async (stake, index) => {
         await this.fetchPrimordialEmissions(index);
       }));
     },
     async fetchBasePrimordialOwed() {
       if (!this.accountAddress) {
         console.error('Account address not specified');
         return;
       }

       await this.fetchStakingSlots();
       console.log("Stakes:", this.stakes);

       const provider = new ethers.BrowserProvider(window.ethereum);
       const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
       if (!this.isValidAddress(contractAddress)) {
         //console.error("Staking contract address is invalid:", contractAddress);
         return;
       }
       const contract = new ethers.Contract(contractAddress, LPStakingABI, provider);

       this.rewardsOwed = new Array(this.stakes.length).fill("0.0000");
       console.log("Rewards Owed:", this.rewardsOwed);

       try {
         await Promise.all(this.stakes.map(async (stake, index) => {
           if (!stake.isEmpty) {
             const basePrimordialOwed = await contract.getBasePrimordialOwed(stake.amount, this.accountAddress, index);
             this.stakes[index].rewardsOwed = parseFloat(ethers.formatEther(basePrimordialOwed)).toFixed(4);
             console.log("Rewards Owed:", this.stakes[index].rewardsOwed);
           }
         }));
         //console.log("Rewards Owed:", this.rewardsOwed);
       } catch (error) {
         console.error("Error fetching base primordial owed for all slots:", error);
       }
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
       if (!this.accountAddress) {
         console.log("No account address provided.");
         return;
       }
       try {
         const provider = new ethers.BrowserProvider(window.ethereum);
         await provider.ready;
         const addresses = this.contractAddresses[this.currentNetwork].tokens;
         for (const [tokenName, tokenAddress] of Object.entries(addresses)) {
           const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
           try {
             const balanceInWei = await tokenContract.balanceOf(this.accountAddress);
             if (!balanceInWei || balanceInWei === '0x') {
               console.log(`${tokenName} at ${tokenAddress} has no balance data.`);
               continue;
             }
             const balanceInEther = ethers.formatEther(balanceInWei);
             this.tokenBalances[tokenName] = balanceInEther;
             //console.log(`${tokenName} (${tokenAddress}) balance:`, this.tokenBalances[tokenName]);
           } catch (innerError) {
             //console.error(`Error fetching balance for ${tokenName} at ${tokenAddress}:`, innerError);
           }
         }
       } catch (error) {
         console.error("Error fetching token balances:", error);
       }
     },
     async fetchLPTokenBalances() {
       if (!this.accountAddress) {
         console.log("No account address provided.");
         return;
       }
       const provider = new ethers.BrowserProvider(window.ethereum);
       //console.log("Current Network: ", this.currentNetwork);
       for (const [tokenName, tokenAddress] of Object.entries(this.contractAddresses[this.currentNetwork].lptokens)) {
         try {
           const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
           //console.log("Token Contract Address:", tokenContract);
           const balanceInWei = await tokenContract.balanceOf(this.accountAddress);
           if (!balanceInWei || balanceInWei === '0x') {
             //console.log(`${tokenName} at ${tokenAddress} has no balance data.`);
             continue;
           }
           const balanceInEther = ethers.formatEther(balanceInWei);
           this.lpTokenBalances[tokenName] = balanceInEther;
           console.log(`${tokenName} (${tokenAddress}) balance:`, this.lpTokenBalances[tokenName]);
         } catch (error) {
           //console.error(`Error fetching balance for ${tokenName} at ${tokenAddress}:`, error);
         }
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
         this.stakeButtonText = 'Stake LP';
         this.fetchStakingSlots();
         console.log("Synced w/ Selected Staking Contract Address: ", this.selectedStakingContractAddress);
       } else {
         this.stakeButtonText = 'Vest Tokens';
         this.fetchVestingSlots();
         console.log("Synced w/ Selected Vesting Contract Address: ", this.selectedVestingContractAddress);
       }
     },
     setSelectedCurrency(currency) {
       this.selectedToken = currency;
       this.selectedStakeIndex = null;
       this.selectedVestIndex = null;
       this.showError = false;
       this.selectedTokenBalance;
     },
     handleAmountChanged(value) {
       console.log(`Amount Changed in StakeCard:`, value);
       this.enteredAmountData = value;
       this.walletBalanceData = this.selectedTokenBalance;
     },
     async detectNetwork() {
      try {
       const provider = new ethers.BrowserProvider(window.ethereum);
       const network = await provider.getNetwork();
       const newNetwork = network.chainId === 1 ? 'mainnet' : 'sepolia';
       if (this.currentNetwork !== newNetwork) {
         this.currentNetwork = newNetwork;
         console.log(`Detected and set current network to: ${this.currentNetwork}`);
         this.$emit('networkChanged', this.currentNetwork);
       }
      } catch (error)  {
      console.error('Network detection failed:', error);
      }
     },
     async handleUnstakeClick() {
       try {
         if (this.selectedStakeIndex === null) {
           this.showError = true;
           this.$root.$refs.notificationCard.showNotification("error", "Please select a slot to unstake.");
           return;
         }
         this.showError = false;
         this.loadingUnstake = true;
         this.$root.$refs.notificationCard.showNotification("pending", "Unstake LP token pending...");
         const provider = new ethers.BrowserProvider(window.ethereum);
         const signer = await provider.getSigner();
         const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
         console.log("Unstake Contract Address: ", contractAddress);
         const contract = new ethers.Contract(contractAddress, LPStakingABI, signer);
         const userAddress = await signer.getAddress();
         if (!userAddress) {
           throw new Error('Account address is not set');
         }

         const selectedStake = this.stakes.find(stake => stake.originalIndex === this.selectedStakeIndex);
         if (!selectedStake) {
           this.$root.$refs.notificationCard.showNotification("error", "Stake data not found.");
           return;
         }

         const stakeData = await contract.getStake(userAddress, this.selectedStakeIndex);
         const stakedAmount = stakeData.amount;
         console.log("Staked Amount:", stakedAmount);

         const tx = await contract.unstakeLPToken(stakedAmount, this.selectedStakeIndex);
         const receipt = await tx.wait();

         widgetAnalytics.trackInteraction('unstake', true, {
           amount: ethers.formatEther(stakedAmount),
           slotIndex: this.selectedStakeIndex,
           token: this.selectedToken,
           txHash: receipt.transactionHash,
           gasUsed: receipt.gasUsed?.toString()
         });

         this.loadingUnstake = false;
         this.fetchLPTokenBalances();
         this.fetchStakingSlots();
         //this.fetchTokenBalances();
         this.$root.$refs.notificationCard.showNotification("success", "Unstake successful!");
       } catch (error) {
         this.loadingUnstake = false;
         console.error("Error during unstake:", error);
         
         widgetAnalytics.trackInteraction('unstake', false, {
           error: error.message || error,
           slotIndex: this.selectedStakeIndex,
           token: this.selectedToken,
           errorCode: error.code
         });
         
         const errorCode = error.code || (error.info && error.info.error && error.info.error.code);
         if (errorCode === 4001 || errorCode === 'ACTION_REJECTED') {
           this.$root.$refs.notificationCard.showNotification("error", "Unstake Transaction Rejected");
         } else {
           this.$root.$refs.notificationCard.showNotification("error", `Unstake failed: ${error.message}`);
         }
       }
     },
     async handleClaimClick() {
       try {
         if (this.selectedStakeIndex === null) {
           this.showError = true;
           this.$root.$refs.notificationCard.showNotification("error", "Please select a slot to claim.");
           return;
         }
         this.showError = false;
         this.loadingClaim = true;
         this.$root.$refs.notificationCard.showNotification("pending", "Claim Rewards pending...");
         const provider = new ethers.BrowserProvider(window.ethereum);
         const signer = await provider.getSigner();
         const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
         console.log("Claim Contract Address: ", contractAddress);
         const contract = new ethers.Contract(contractAddress, LPStakingABI, signer);
         console.log("Loaded ABI: ", LPStakingABI);
         const userAddress = await signer.getAddress();
         if (!userAddress) {
           throw new Error('Account address is not set');
         }        

         const selectedStake = this.stakes.find(stake => stake.originalIndex === this.selectedStakeIndex);
         if (!selectedStake) {
           this.$root.$refs.notificationCard.showNotification("error", "Stake data not found.");
           return;
         }

         const stakeData = await contract.getStake(userAddress, this.selectedStakeIndex);
         const stakedAmount = stakeData.amount;
         console.log("Staked Amount:", stakedAmount);

         const tx = await contract.claimReward(stakedAmount, this.selectedStakeIndex);
         const receipt = await tx.wait();

         widgetAnalytics.trackInteraction('claim', true, {
           amount: ethers.formatEther(stakedAmount),
           slotIndex: this.selectedStakeIndex,
           token: this.selectedToken,
           txHash: receipt.transactionHash,
           gasUsed: receipt.gasUsed?.toString()
         });

         this.loadingClaim = false;
         this.fetchLPTokenBalances();
         this.fetchStakingSlots();
         this.$root.$refs.notificationCard.showNotification("success", "Claim successful!");
       } catch (error) {
         this.loadingClaim = false;
         console.error("Error during claim:", error);
         
         widgetAnalytics.trackInteraction('claim', false, {
           error: error.message || error,
           slotIndex: this.selectedStakeIndex,
           token: this.selectedToken,
           errorCode: error.code
         });
         
         const errorCode = error.code || (error.info && error.info.error && error.info.error.code);
         if (errorCode === 4001 || errorCode === 'ACTION_REJECTED') {
           this.$root.$refs.notificationCard.showNotification("error", "Claim Transaction Rejected");
         } else {
           this.$root.$refs.notificationCard.showNotification("error", `Claim failed: ${error.message}`);
         }
       }
     },
     async handleEmergencyWithdrawClick() {
       try {
         if (this.selectedVestIndex === null) {
           this.showError = true;
           this.$root.$refs.notificationCard.showNotification("error", "Please select a slot to claim.");
           return;
         }
         this.showError = false;
         this.loadingEmergencyWithdraw = true;
         this.$root.$refs.notificationCard.showNotification("pending", "Emergency Withdraw pending...");
         const provider = new ethers.BrowserProvider(window.ethereum);
         const signer = await provider.getSigner();
         const contractAddress = this.contractAddresses[this.currentNetwork].vesting[this.selectedToken];
         const contract = new ethers.Contract(contractAddress, VestingABI, signer);

         const tx = await contract.emergencyWithdraw(this.selectedVestIndex);
         await tx.wait();

         this.loadingEmergencyWithdraw = false;
         this.fetchTokenBalances();
         this.fetchVestingSlots();
         this.$root.$refs.notificationCard.showNotification("success", "Emergency Withdraw successful!");
         await this.fetchVestingSlots();
       } catch (error) {
         this.loadingEmergencyWithdraw = false;
         console.error("Error during emergency withdraw:", error);
         const errorCode = error.code || (error.info && error.info.error && error.info.error.code);
         if (errorCode === 4001 || errorCode === 'ACTION_REJECTED') {
           this.$root.$refs.notificationCard.showNotification("error", "Emergency Withdraw Transaction Rejected");
         } else {
           this.$root.$refs.notificationCard.showNotification("error", `Emergency Withdraw failed: ${error.message}`);
         }
       }
     },
     async handleVestingClaimClick() {
       try {
         if (this.selectedVestIndex === null) {
           this.showError = true;
           this.$root.$refs.notificationCard.showNotification("error", "Please select a slot to claim.");
           return;
         }
         this.showError = false;
         this.loadingVestingClaim = true;
         this.$root.$refs.notificationCard.showNotification("pending", "Vesting Claim pending...");
         const provider = new ethers.BrowserProvider(window.ethereum);
         const signer = await provider.getSigner();
         const contractAddress = this.contractAddresses[this.currentNetwork].vesting[this.selectedToken];
         const contract = new ethers.Contract(contractAddress, VestingABI, signer);

         const tx = await contract.claimRewards(this.selectedVestIndex);
         await tx.wait();

         this.loadingVestingClaim = false;
         this.fetchTokenBalances();
         this.fetchVestingSlots();
         this.$root.$refs.notificationCard.showNotification("success", "Vesting Claim successful!");
       } catch (error) {
         this.loadingVestingClaim = false;
         console.error("Error during vesting claim:", error);
         const errorCode = error.code || (error.info && error.info.error && error.info.error.code);
         if (errorCode === 4001 || errorCode === 'ACTION_REJECTED') {
           this.$root.$refs.notificationCard.showNotification("error", "Claim Transaction Rejected");
         } else {
           this.$root.$refs.notificationCard.showNotification("error", `Vesting Claim failed: ${error.message}`);
         }
       }
     },
     async updatePricingData() {
       console.log('Starting updatePricingData for token:', this.selectedToken); 
       
       if (!this.selectedToken) {
         console.warn('Selected token is undefined. Skipping pricing data update.');
         return;
       }

       try {
         if (this.selectedToken === 'PPePe') {
           await this.fetchPPePePrice();
         } else {
           await fetchPricingData(this.selectedToken);
         }
         this.pricingData = pricingCache.data;
         console.log('Updated pricing data:', this.pricingData); 
       } catch (error) {
         console.error('Error in updatePricingData:', error);
         this.priceLoadingError = true;
       }
     },
     calculateVestValue(vest) {
       const amountInEther = ethers.formatUnits(vest.amount, 'ether');
       const tokenName = this.selectedToken;
       
       if (!this.pricingData || !this.pricingData[tokenName]) {
         console.log('Missing pricing data for:', tokenName);
         return { usd: 'Loading...', eth: 'Loading...' };
       }

       const price = this.pricingData[tokenName];
       console.log('Price data:', price);
       
       return {
         usd: (amountInEther * price.usd).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}),
         eth: (amountInEther * price.eth).toLocaleString(undefined, {minimumFractionDigits: 4, maximumFractionDigits: 4})
       };
     },
     async fetchPPePePrice() {
       try {
         const provider = new ethers.BrowserProvider(window.ethereum);
         const network = await provider.getNetwork();
         const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
         const uniswapRouterABI = [
           'function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts)',
         ];
         const uniswapRouterContract = new ethers.Contract(uniswapRouterAddress, uniswapRouterABI, provider);

         const wethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'; 
         const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; 
         const ppepeAddress = this.contractAddresses[network.name].tokens.ppepe;

         const [ppepeAmountOut, ethAmountOut] = await Promise.all([
           uniswapRouterContract.getAmountsOut(ethers.parseUnits('1', 18), [wethAddress, ppepeAddress]),
           uniswapRouterContract.getAmountsOut(ethers.parseUnits('1', 18), [wethAddress, usdcAddress]),
         ]);

         const ppepePriceInEth = ethers.formatUnits(ppepeAmountOut[1], 18);
         const ethPriceInUsd = ethers.formatUnits(ethAmountOut[1], 6);

         const ppepePriceInUsd = (ethPriceInUsd / ppepePriceInEth).toFixed(15);
         this.tokenPrices.PPEPE = {
           usd: parseFloat(ppepePriceInUsd),
           eth: parseFloat(ppepePriceInEth),
         };
       } catch (error) {
         //console.error('Error fetching PPePe price:', error);
         console.log('Unable to fetch price for PPePe');
         this.tokenPrices.PPEPE = {
           usd: 0,
           eth: 0,
         };
       }
     },
   },
   computed: {
     ethers() {
       return ethers;
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
       //console.log("Token Contract Address: ", this.contractAddresses[this.selectedToken]);
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
       const days = this.vestingPeriod;// % 30;
       let monthString = months === 1 ? "month" : "months";
       let dayString = days === 1 ? "day" : "days";
       let formattedString = `${months} ${monthString} / ${days} ${dayString}`;
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
             balance = this.lpTokenBalances.PrimordialPePeLP || '0';
             break;
           case 'PePe':
             console.log("PePeLP Balance: ", this.lpTokenBalances.PePeLP);
             balance = this.lpTokenBalances.PePeLP || '0';
             break;
           case 'Shib':
             console.log("ShibLP Balance: ", this.lpTokenBalances.ShibLP);
             balance = this.lpTokenBalances.ShibLP || '0';
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
       console.log(`${this.selectedToken} Balance: `, balance);
       return this.abbreviateNumber(balance);
     },
     toggleStyle() {
       let index = this.currencies.indexOf(this.selectedToken);
       let percentage = 33.33 * index;
       return { left: `${percentage}%` };
     },
   },
   mounted() {
     this.detectNetwork();
     if (window.ethereum) {
       window.ethereum.on('accountsChanged', (accounts) => {
         this.$emit('update:accountAddress', accounts[0]);
         this.fetchLPTokenBalances();
         this.fetchTokenBalances();
         this.fetchBasePrimordialOwed();
         this.fetchPrimordialEmissions();
         this.fetchVestingSlots();
         this.fetchStakingSlots();
         //this.fetchAllSlots();
       });
       window.ethereum.on('chainChanged', async (_chainId) => {
         //window.location.reload(_chainId);
         console.log("Chain changed to:", _chainId);
         await this.detectNetwork();
         this.fetchLPTokenBalances();
         this.fetchTokenBalances();
       });
       this.subscribeToNewBlocks();
       this.fetchLPTokenBalances();
       this.fetchTokenBalances();
       this.fetchVestingSlots();
       this.fetchStakingSlots();
       //this.fetchAllSlots();
     }
   },
   watch: {
     accountAddress(newVal, oldVal) {
       if (newVal !== oldVal) {
         this.fetchLPTokenBalances();
         this.fetchTokenBalances();
         this.fetchBasePrimordialOwed();
         this.fetchPrimordialEmissions();
         this.fetchVestingSlots();
         this.fetchStakingSlots();
       }
     },
     selectedToken(newVal, oldVal) {
       if (newVal !== oldVal) {
         this.stake = [];
         this.isPPEPESelected = newVal === 'PPEPE';
         this.fetchBasePrimordialOwed();
         this.fetchPrimordialEmissions();
         this.fetchVestingSlots();
         this.fetchStakingSlots();
         if (this.selectedOption === 'Vesting') {
           this.updatePricingData();
         }
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
     vests: {
       handler(newVests) {
         newVests.forEach((vest, index) => {
           const timeLeft = this.calculateTimeLeft(vest.endTime);
           if (timeLeft === '0 mins') {
             this.$nextTick(() => {
               const element = this.$refs[`vestSlot${index}`];
               if (element) {
                 this.playShineAnimation(element);
               }
             });
           }
         });
       },
       deep: true
     },
     selectedOption(newValue) {
       if (newValue === 'Vesting') {
         this.updatePricingData();
       }
     },
   },
   created() {
     console.log("ClaimCard raw balances:", this.rawPpepeBalance, this.rawPepeBalance, this.rawShibBalance);
   },
 };
</script>

<style scoped>
.staking-info {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-top: 10px;
}
.info {
  display: flex;
  flex-direction: column;
}
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
 .vest-slot-wrapper {
  position: relative;
  overflow: hidden;
}

</style>