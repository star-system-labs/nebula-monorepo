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
         <img :src="currencyLogos[index]" alt="Currency Logo" class="w-6 h-6 rounded-full mr-2">{{ currency }}
       </div>
      </div>
     </div>
    </div>

    <div v-if="selectedOption === 'Staking'" class="staking-rewards-container flex flex-col justify-center items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-55 p-5 rounded-xl w-full mx-auto mb-4">
      <div v-if="stakes.length > 0" class="w-full max-w-sm mx-auto md:max-w-md lg:max-w-lg">
        <p class="font-origin text-yellow-300">{{ $t('message.lpstakingslot') }}</p>
        <div :class="{ 'grid grid-cols-1 md:grid-cols-2 gap-4 justify-start': stakes.length > 1 }">
          <div v-for="(stake, index) in stakes" :key="index"
              class="mb-4 last:mb-4 w-full max-w-full mx-auto cursor-pointer items-center relative" 
              @click="selectStakingSlot(index)"
              :class="{
               'md:col-span-2 md:flex md:flex-col md:justify-center md:items-center md:text-center': [1, 3].includes(stakes.length) && index === stakes.length - 1,
               'flex justify-center items-center p-4 rounded-lg bg-card-blue bg-opacity-85 hover:bg-blue-900 focus:border-green-500 transition-colors duration-300': true,
               'border-2 border-custom-blue': selectedStakeIndex !== index,
               'border-2 border-green-500': selectedStakeIndex === index,
               'last:mr-0': index % 2 === 0,
              }">
            <div>
              <div class="md:text-left md:justify-center sm:justify-center sm:text-center sm:w-full" :class="{'md:text-center': [1, 3].includes(stakes.length) && index === stakes.length - 1}">
                <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.primordialemis') }}&nbsp;{{ primordialEmission }}</p>
                <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.amount') }}: {{ ethers.formatEther(stake.amount) }}</p>
                <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.starttime') }}: {{ formattedDate }}</p>
                <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.rewardsowed') }}: {{ stake.rewardsOwed }}</p>
              </div>
              <div v-if="selectedStakeIndex === index" class="absolute top-0 right-0 p-1">
                <img src="@/assets/check.png" alt="Selected" class="w-4 h-4">
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-if="showError" class="text-red-500 font-origin mt-4">{{ $t('message.pleaseselect') }}</p> 
      <div v-else class="font-origin text-yellow-300">
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
        <p class="font-origin text-yellow-300">{{ $t('message.vestingslots') }}</p>          
          <div :class="{ 'grid grid-cols-1 md:grid-cols-2 gap-4 justify-start': vests.length > 1 }">
          <div v-for="(vest, index) in vests" :key="index" 
            class="mb-4 last:mb-4 w-full max-w-full mx-auto cursor-pointer relative" 
            @click="selectVestSlot(index)"
            :class="{
              'md:col-span-2 md:flex md:flex-col md:justify-center md:items-center md:text-center': [1, 3, 5, 7, 9, 11].includes(vests.length) && index === vests.length - 1,
              'flex justify-center items-center text-center p-4 rounded-lg bg-card-blue bg-opacity-85 hover:bg-blue-9000 focus:border-green-500 transition-colors duration-300': true,
              'border-2 border-custom-blue': selectedVestIndex !== index,
              'border-2 border-green-500': selectedVestIndex === index,
              'last:mr-0': index % 2 === 0,
            }">
          <div>
            <div class="md:text-left md:justify-center sm:justify-center sm:text-center sm:w-full" :class="{'text-center md:text-center': [1, 3, 5, 7, 9, 11].includes(vests.length) && index === vests.length - 1}">
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.amount') }}: {{ abbreviateNumber(ethers.formatEther(vest.amount)) || $t('message.calculating') }}</p>
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.locked') }}: {{ lockedTimes[index] || $t('message.calculating') }}</p>
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.remaining') }}: {{ calculateTimeLeft(vest.endTime) || $t('message.calculating') }}</p>
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.apr') }}: {{ (vest.apr)+'%' || $t('message.calculating') }}</p>
              <p class="font-origin text-yellow-300 text-xs md:text-sm lg:text-md">{{ $t('message.estimatedrewards') }}: {{ abbreviateNumber(calculateEstimatedRewards(vest)) || $t('message.calculating') }}</p>
            </div>
            <div v-if="selectedVestIndex === index" class="absolute top-0 right-0 p-1">
              <img src="@/assets/check.png" alt="Selected" class="w-4 h-4">
            </div>
          </div>
          </div>
        </div>
      </div>
      <p v-if="showError" class="text-red-500 font-origin mt-4">{{ $t('message.pleaseselect') }}</p>
      <div v-else class="font-origin text-yellow-300">
        <div v-if="vests.length === 0">
          {{ $t('message.novestingslots') }}
        </div>
      </div>
    </div>

     <div class="mb-6">
     <ConnectWalletButton v-if="!accountAddress" @connect="$emit('handleConnect')" class="w-full mb-6"/>
     <div v-if="accountAddress && selectedOption === 'Staking'">
       <div v-if="selectedToken === 'PPePe'">
         <button @click="sdivComingSoon" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 mr-5 text-xs md:text-sm lg:text-lg">
           {{ $t('message.sdivcomingsoon') }}
         </button>
       </div>
       <div v-else>
         <button @click="handleUnstakeClick" :disabled="loadingUnstake" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 mr-5 text-xs md:text-sm lg:text-lg">
          <orbit-spinner v-if="loadingUnstake" :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
          <span v-else>{{ $t('message.unstakelp') }}</span>
        </button>
        <button @click="handleClaimClick" :disabled="loadingClaim" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 text-xs md:text-sm lg:text-lg">
          <orbit-spinner v-if="loadingClaim" :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
          <span v-else>{{ $t('message.claim') }}</span>
        </button>
       </div>
      </div>
      <div v-if="accountAddress && selectedOption === 'Vesting'" class="flex justify-between w-full">
        <button @click="handleEmergencyWithdrawClick" :disabled="loadingEmergencyWithdraw" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 mr-5 text-xs md:text-sm lg:text-lg">
          <orbit-spinner v-if="loadingEmergencyWithdraw" :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
          <span v-else>{{ $t('message.emergencywithdraw') }}</span>
        </button>
        <button @click="handleVestingClaimClick" :disabled="loadingVestingClaim" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 text-xs md:text-sm lg:text-lg">
          <orbit-spinner v-if="loadingVestingClaim" :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
          <span v-else>{{ $t('message.claim') }}</span>
        </button>
      </div>
    </div>
  </div>
 </template>
 
 <script>
 import ConnectWalletButton from './ConnectWalletButton.vue';
 import { OrbitSpinner } from 'epic-spinners';
 import LPStakingABI from '../ABI/LPStakingABI.json';
 import VestingABI from '../ABI/VestingABI.json';
 import { ethers } from 'ethers';
 import { toHandlers } from 'vue';
 import { formatDistanceToNow } from 'date-fns';
 
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
   },
   data() {
     return {
       isPPEPESelected: false,
       selectedVestIndex: null,
       selectedStakeIndex: null,
       lockedTimes: {},
       vests: [],
       stakes: [],
       primordialEmission:'0',
       stakedAmountWei: '0',
       stakedAmount: '0',
       rewardsOwed: '0',
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
           shib: '0xfD1450a131599ff34f3Be1775D8c8Bf79E353D8c',
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
           PPePe: '0x9D1CE06759B6eC0e89Bf61F32cF7E0c00d0655DA',
           PePe: '0x44B09a5aDBAC9E58d023Ccce06F397483093ab67',
           Shib: '0xA5bbb0628FbB9cb520D26Ebe63dA59402A58d78b',
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
         require('@/assets/ppepe.png'),
         require('@/assets/pepe.png'),
         require('@/assets/shib.png')
       ],
       enteredAmountData: '0.00',
       walletBalanceData: '0.00',
       selectedOption: 'Staking',
       selectedSlot: 0, 
       showError: false,
     };
   },
   methods: {
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
        if (this.selectedStakeIndex === index) {
          this.selectedStakeIndex = null;
          this.showError = false;
        } else {
          this.selectedStakeIndex = index;
          this.showError = false;
        }
     },
     selectVestSlot(index) {
      if (this.selectedVestIndex === index) {
        this.selectedVestIndex = null;
        this.showError = false;
      } else {
        this.selectedVestIndex = index; 
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
      if (timeDiff <= 30 * 24 * 60 * 60 * 1000) {
        return Math.ceil(timeDiff / (24 * 60 * 60 * 1000)) + ' days';
      } else {
        return Math.ceil(timeDiff / (30 * 24 * 60 * 60 * 1000)) + ' mos.';
      }
     },
     async fetchAllVests() {
      if (!this.accountAddress || !this.selectedToken) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const vestingContractAddress = this.contractAddresses[this.currentNetwork].vesting[this.selectedToken];
      const vestingContract = new ethers.Contract(vestingContractAddress, VestingABI, provider);

      try {
        const [slotsAvailability, vests] = await vestingContract.getAllSlots(this.accountAddress);
        this.vests = vests.filter((vest, index) => slotsAvailability[index]).map((vest, index) => ({
          index: index,
          amount: vest.amount.toString(),
          startTime: vest.startTime.toString(),
          endTime: vest.endTime.toString(),
          apr: vest.apr.toString(),
          active: slotsAvailability[index],
        }));
        console.log(`Fetched active vesting slots.`);
      } catch (error) {
        console.error("Failed to fetch vesting slots:", error);
        this.vests = [];
      }
     },
     async fetchStakingSlots() {
      if (!this.accountAddress || !this.selectedToken) return; 
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      console.log(`Current network: ${network.name}`);
      const stakingContractAddress = this.contractAddresses[network.name].staking[this.selectedToken];
      if (!this.isValidAddress(stakingContractAddress)) {
        console.log("Staking contract address is invalid or not deployed yet:", stakingContractAddress);
        return;
      }
      console.log(`Using staking contract address: ${stakingContractAddress}`);
      const stakingContract = new ethers.Contract(stakingContractAddress, LPStakingABI, provider);

    //   try {
    //     const [slotsAvailability, stakes] = await stakingContract.getAllSlots(this.accountAddress);
    //     const stakesWithRewards = await Promise.all(stakes.map(async (stake, index) => {
    //       if (slotsAvailability[index] === false) {
    //         const rewardsOwedWei = await stakingContract.getBasePrimordialOwed(stake.amount, this.accountAddress, index);
    //         const rewardsOwed = parseFloat(ethers.formatEther(rewardsOwedWei)).toFixed(4);
    //         return {
    //           amount: stake.amount.toString(),
    //           startTime: stake.startTime.toString(),
    //           lastClaimTime: stake.lastClaimTime.toString(),
    //           rewardsOwed
    //         };
    //       }
    //       return null;
    //     }));

    //     this.stakes = stakesWithRewards.filter(stake => stake !== null);
    //     console.log(`Fetched ${this.stakes.length} staking slots with rewards.`);
    //   } catch (error) {
    //     console.error("Failed to fetch staking slots:", error);
    //     this.stakes = [];
    //   }
    //  },
        try {
        const [slotsAvailability, stakes] = await stakingContract.getAllSlots(this.accountAddress);
        const stakesWithRewards = stakes.map((stake, index) => ({
          amount: stake.amount.toString(),
          startTime: stake.startTime.toString(),
          lastClaimTime: stake.lastClaimTime.toString(),
          rewardsOwed: parseFloat(ethers.formatEther(stake.amount)).toFixed(4),
          isEmpty: slotsAvailability[index]  
      })).filter(stake => !stake.isEmpty);

      this.stakes = stakesWithRewards;
        console.log(`Fetched ${this.stakes.length} staking slots with rewards.`);
      } catch (error) {
        console.error("Failed to fetch staking slots:", error);
        this.stakes = [];
      }
     },
     async fetchVestingSlots() {
      if (!this.accountAddress || !this.selectedToken) return; 
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      console.log(`Current network: ${network.name}`);
      const vestingContractAddress = this.contractAddresses[network.name].vesting[this.selectedToken];
      console.log(`Using vesting contract address: ${vestingContractAddress}`);
      const vestingContract = new ethers.Contract(vestingContractAddress, VestingABI, provider);

      try {
        const vests = await vestingContract.getAllVests(this.accountAddress);
        this.vests = vests.map(vest => ({
          amount: vest.amount.toString(),
          startTime: vest.startTime.toString(),
          endTime: vest.endTime.toString(),
          apr: vest.apr.toString(),
        }));
        for (const [index, vest] of this.vests.entries()) {
          await this.calculateLockedTimeUsingContract(vest.startTime, vest.endTime, index);
        }
          console.log(`Fetched ${vests.length} vesting slots.`);
        } catch (error) {
          console.error("Failed to fetch vesting slots:", error);
          this.vests = [];
        }
     },
     async calculateLockedTimeUsingContract(startTime, endTime, index) {
      if (!this.accountAddress || !this.selectedToken) return; 
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const network = await provider.getNetwork();
      console.log(`Current network: ${network.name}`);
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
     async fetchPrimordialEmission() {
      try {
        if (!this.accountAddress || this.selectedSlot === null) {
          console.error('Account address or slot not specified');
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
        if (!this.isValidAddress(contractAddress)) {
          console.log("Primordial Emission contract address is invalid or not deployed yet:", contractAddress);
          return;
        }
        const contract = new ethers.Contract(contractAddress, LPStakingABI, provider);
        const emission = await contract.getPrimordialEmission(this.accountAddress, this.selectedSlot);
        console.log("Primordial Emission:", emission);
        this.primordialEmission = emission;
      } catch (error) {
        console.error("Error fetching Primordial Emission:", error);
        if (error.code === -32000) {
          console.error("Execution reverted by the EVM. Check contract conditions and inputs.");
        }
      }
     },
     async fetchStakingInfo() {
      try {
        if (!this.accountAddress || this.selectedSlot === null) {
          console.error('Account address or slot not specified');
          return;
        }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
      if (!this.isValidAddress(contractAddress)) {
        console.log("Staking contract address is invalid or not deployed yet:", contractAddress);
        return;
      }
      const contract = new ethers.Contract(contractAddress, LPStakingABI, provider);
      const slot = Number(this.selectedSlot);
      const stakerInfo = await contract.getStakerInfo(this.accountAddress, slot);
      console.log(`Fetching staking info for address: ${this.accountAddress} and slot: ${slot}`);
      contract.getStakerInfo(this.accountAddress, slot)
      .then((response) => {
        console.log('Raw response:', response);
        this.stakedAmountWei = ethers.formatUnits(stakerInfo.stakedAmount, 18);
        this.stakedAmount = this.abbreviateNumber(parseFloat(ethers.formatEther(stakerInfo.stakedAmount)).toFixed(2));
        this.lpStakeTime = stakerInfo.startTime.toString();
        const lpClaimTimeInEther = ethers.formatUnits(stakerInfo.lpClaimTime, 'ether');
        this.lpClaimTime = parseFloat(lpClaimTimeInEther).toFixed(2);
      })
      .catch((error) => {
        console.error('Error fetching staking info:', error);
      });

      console.log(`Staked Amount: ${ethers.formatEther(stakerInfo[0])}`);
      console.log(`LP Stake Time: ${stakerInfo[1].toString()}`);
      console.log(`LP Claim Time: ${stakerInfo[2].toString()}`);

      const basePrimordialOwed = await contract.getBasePrimordialOwed(stakerInfo.stakedAmount, this.accountAddress, slot);
      this.rewardsOwed = parseFloat(ethers.formatEther(basePrimordialOwed)).toFixed(4);
      } catch (error) {
        console.error("Error fetching staking info:", error);
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
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.ready;
        const addresses = this.contractAddresses[this.currentNetwork].tokens;
        for (const [tokenName, tokenAddress] of Object.entries(addresses)) {
          const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
          try {
            const balanceInWei = await tokenContract.balanceOf(this.accountAddress);
            if (!balanceInWei || balanceInWei === '0x') {
              console.log(`${tokenName} at ${tokenAddress} has no balance data or is not correctly set.`);
              continue;
            }
            const balanceInEther = ethers.formatEther(balanceInWei);
            this.tokenBalances[tokenName] = balanceInEther;
            console.log(`${tokenName} (${tokenAddress}) balance:`, this.tokenBalances[tokenName]);
          } catch (innerError) {
            console.error(`Error fetching balance for ${tokenName} at ${tokenAddress}:`, innerError);
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
       console.log("Current Network: ", this.currentNetwork);
       for (const [tokenName, tokenAddress] of Object.entries(this.contractAddresses[this.currentNetwork].lptokens)) {
         try {
           const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
           console.log("Token Contract Address:", tokenContract);
           const balanceInWei = await tokenContract.balanceOf(this.accountAddress);
           if (!balanceInWei || balanceInWei === '0x') {
             console.log(`${tokenName} at ${tokenAddress} has no balance data or is not correctly deployed.`);
             continue;
           }
           const balanceInEther = ethers.formatEther(balanceInWei);
           this.lpTokenBalances[tokenName] = balanceInEther;
           console.log(`${tokenName} (${tokenAddress}) balance:`, this.lpTokenBalances[tokenName]);
         } catch (error) {
           console.error(`Error fetching balance for ${tokenName} at ${tokenAddress}:`, error);
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
         console.log("Selected Contract Address: ", this.selectedStakingContractAddress);
       } else {
         this.stakeButtonText = 'Vest Tokens';
         console.log("Selected Contract Address: ", this.selectedVestingContractAddress);
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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      this.currentNetwork = network.chainId === 1 ? 'mainnet' : 'sepolia';
      console.log("Current Network: ", this.currentNetwork);
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

        const stakedAmount = ethers.parseUnits(this.stakedAmountWei, 18);
        const slot = this.selectedStakeIndex;
        console.log("Claim Click slot", slot);
        const tx = await contract.unstakeLPToken(stakedAmount, slot);
        await tx.wait();

        this.loadingUnstake = false;
        this.fetchLPTokenBalances();
        this.fetchStakingSlots();
        //this.fetchTokenBalances();
        this.$root.$refs.notificationCard.showNotification("success", "Unstake successful!");
      } catch (error) {
        this.loadingUnstake = false;
        console.error("Error during unstake:", error);
        this.$root.$refs.notificationCard.showNotification("error", `Unstake failed: ${error.message}`);
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

        const stakedAmount = ethers.parseUnits(this.stakedAmountWei, 18);
        console.log("Claim Click stakedAmount", stakedAmount);
        const slot = this.selectedStakeIndex;
        console.log("Claim Click slot", slot);
        const tx = await contract.claimReward(stakedAmount, slot);
        await tx.wait();

        this.loadingClaim = false;
        this.fetchLPTokenBalances();
        this.fetchStakingSlots();
        this.$root.$refs.notificationCard.showNotification("success", "Claim successful!");
      } catch (error) {
        this.loadingClaim = false;
        console.error("Error during claim:", error);
        this.$root.$refs.notificationCard.showNotification("error", `Claim failed: ${error.message}`);

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
      } catch (error) {
        this.loadingEmergencyWithdraw = false;
        console.error("Error during emergency withdraw:", error);
        this.$root.$refs.notificationCard.showNotification("error", `Emergency Withdraw failed: ${error.message}`);
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
        this.$root.$refs.notificationCard.showNotification("success", "Vesting Claim successful!");
      } catch (error) {
        this.loadingVestingClaim = false;
        console.error("Error during vesting claim:", error);
        this.$root.$refs.notificationCard.showNotification("error", `Vesting Claim failed: ${error.message}`);
      }
     },
     updateWalletBalance() {
       this.walletBalanceData = this.selectedTokenBalance;
     }
   },
   computed: {
     formattedStartTime() {
       return formatDistanceToNow(new Date(this.stake.startTime * 1000), { addSuffix: true });
     },
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
             console.log("PrimordialPePeLP Balance: ", this.lpTokenBalances.PrimordialPePeLP);
             balance = this.lpTokenBalances.PrimordialPePeLP;
             break;
           case 'PePe':
             console.log("PePeLP Balance: ", this.lpTokenBalances.PePeLP);
             balance = this.lpTokenBalances.PePeLP;
             break;
           case 'Shib':
             console.log("ShibLP Balance: ", this.lpTokenBalances.ShibLP);
             balance = this.lpTokenBalances.ShibLP;
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
   mounted() {
      this.detectNetwork();
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
          this.$emit('update:accountAddress', accounts[0]);
          this.fetchLPTokenBalances();
          this.fetchTokenBalances();
          this.fetchPrimordialEmission();
          this.fetchVestingSlots();
          this.fetchStakingSlots();
          //this.fetchAllSlots();
        });
        window.ethereum.on('chainChanged', (_chainId) => {
        window.location.reload(_chainId);
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
         this.fetchStakingInfo();
         this.fetchPrimordialEmission();
       }
     },
     selectedToken(newVal, oldVal, newToken, oldToken) {
      if (newToken !== oldToken) {
        this.stakes = [];
        this.fetchStakingSlots();
        this.fetchVestingSlots();
      }
      if (newVal !== oldVal) {
        this.isPPEPESelected = newVal === 'PPEPE';
        this.fetchStakingInfo();
        this.fetchPrimordialEmission();
        this.fetchVestingSlots();
        this.fetchStakingSlots();
        //this.fetchAllSlots();
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
 </style>

