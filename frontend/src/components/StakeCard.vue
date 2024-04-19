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
 
     <ConnectWalletButton v-if="!accountAddress" @connect="$emit('connect')" class="mb-6"/>
      <div v-else>
        <div v-if="selectedOption === 'Staking'">
          <div class="mb-2 font-origin font-bold text-red-500" v-if="showWarning">PLEASE SELECT A SLOT</div>
          <div class="currency-toggle cursor-pointer flex mb-4 rounded-xl overflow-hidden border-2"
               :class="{'border-red-500': showWarning, 'border-custom-blue': !showWarning}">
            <div v-for="slot in [1, 2, 3]" :key="`slot-${slot}`"
                 :class="selectedSlot === slot-1 ? 'bg-button-active text-yellow-300' : 'bg-transparent text-custom-blue-inactive'"
                 class="flex-1 flex items-center justify-center text-center py-1 px-4 sm:px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-lg cursor-pointer"
                 @click="selectSlot(slot-1)">
                 <span class="block w-full text-center">Slot&nbsp;{{ slot }}</span>
            </div>
          </div>
        </div>
        <div v-else>
          <input type="range" min="30" max="360" step="30" v-model="vestingPeriod" class="range range-primary w-full max-w-xs" @input="adjustVestingPeriod">
          <div class="text-teal font-origin mt-2">Vesting Period: {{ formattedVestingPeriod }}</div>
        </div>
        <button 
          @click="handleStakeClick" 
          :disabled="loading" 
          class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 mb-6">
          <orbit-spinner v-if="loading" :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
          <span v-else>{{ stakeButtonText }}</span>
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
           ShibLP: '0x5e29a016b9d79ef38Cc66B3E58A08af80b26FB91',
          }
        },
        sepolia: {
          staking: {
           PPePe: '0x00',
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
       loading: false,
       stakeButtonText: 'Stake LP',
       currencies: ['PPePe', 'PePe', 'Shib'],
       currencyLogos: [
         require('@/assets/ppepe.png'),
         require('@/assets/pepe.png'),
         require('@/assets/shib.png')
       ],
       enteredAmountData: '0.00',
       walletBalanceData: '0.00',
       selectedOption: 'Staking',
       selectedSlot: null,
       showWarning: false,
     };
   },
   methods: {
     selectSlot(slot) {
      this.selectedSlot = slot;
      this.showWarning = false;
     },
     async fetchAndUpdateBalances() {
      const newBalances = {
        ppepe: await this.fetchTokenBalance('ppepe'),
        pepe: await this.fetchTokenBalance('pepe'),
        shib: await this.fetchTokenBalance('shib'),
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
         console.error("No account address provided.");
         return;
       }
       
       const provider = new ethers.BrowserProvider(window.ethereum);
       console.log(`Current network: ${this.currentNetwork}`);
       try {
         for (const [tokenName, tokenAddress] of Object.entries(this.contractAddresses[this.currentNetwork].tokens)) {
           console.log(`Fetching balance for ${tokenName} at address ${tokenAddress}`);
           const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
           const balanceInWei = await tokenContract.balanceOf(this.accountAddress).catch(err => {
             console.error(`Error fetching balance for ${tokenName} at address ${tokenAddress}:`, err.message);
             return null;
           });
           if (balanceInWei === null) continue;
           const balanceInEther = ethers.formatEther(balanceInWei);
           this.tokenBalances[tokenName] = balanceInEther;
           console.log(`${tokenName} balance: ${balanceInEther}`);
           console.log("TOKENBALANCE", this.tokenBalances);
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
         this.stakeButtonText = 'Stake LP';
         console.log("Selected Contract Address: ", this.selectedStakingContractAddress);
       } else {
         this.stakeButtonText = 'Vest Tokens';
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
      if (this.currentNetwork !== newNetwork) {
        this.currentNetwork = newNetwork;
        console.log(`Detected and set current network to: ${this.currentNetwork}`);
        this.$emit('networkChanged', this.currentNetwork);
      }
     },
     async handleStakeClick() {
      try {
        this.loading = true;
        if (!this.currentNetwork) {
          console.error('Network not detected or unsupported');
          return;
        }
        if (this.selectedOption === 'Staking' && this.selectedSlot === null) {
          this.showWarning = true;
          return;
        } else {
          this.showWarning = false;
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        let contractAddress, contractABI, contractMethod, timeIndex, tokenContractAddress;
        if (this.selectedOption === 'Staking') {
          contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
          contractABI = LPStakingABI;
          contractMethod = 'stakeLPToken';
          tokenContractAddress = this.contractAddresses[this.currentNetwork].lptokens[this.selectedToken + 'LP'];
        } else if (this.selectedOption === 'Vesting') {
          contractAddress = this.contractAddresses[this.currentNetwork].vesting[this.selectedToken];
          contractABI = VestingABI;
          contractMethod = 'vestTokens';
          if (this.vestingPeriod === 365) {
            timeIndex = 11;
          } else {
            timeIndex = Math.round(this.vestingPeriod / 30) - 1;
          }
          tokenContractAddress = this.contractAddresses[this.currentNetwork].tokens[this.selectedToken.toLowerCase()];
        } else {
          console.error('Invalid option selected');
          return;
        }

        if (!contractAddress || !tokenContractAddress) {
          console.error(`No contract address found for option: ${this.selectedOption} and token: ${this.selectedToken}`);
          return;
        }

        console.log(`Using contract address: ${contractAddress} for ${this.selectedOption}`);
        const amountInWei = ethers.parseUnits(this.enteredAmountData, 18);

        const tokenContract = new ethers.Contract(tokenContractAddress, TokenABI, signer);
        const approveTx = await tokenContract.approve(contractAddress, (amountInWei + 1000000000000000000n));
        await approveTx.wait();
        console.log("Tokens approved");

        const actionContract = new ethers.Contract(contractAddress, contractABI, signer);
        let actionTx;
        if (this.selectedOption === 'Staking') {
        const slot = Number(this.selectedSlot);
          actionTx = await actionContract[contractMethod](amountInWei, slot);
        } else if (this.selectedOption === 'Vesting') {
          actionTx = await actionContract[contractMethod](amountInWei, timeIndex);
        }
        await actionTx.wait();
        console.log(`${this.selectedOption} action completed successfully`);
        this.loading = false;
      } catch (error) {
        console.error("Error during action:", error);
        this.loading = false;
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
        });
        window.ethereum.on('chainChanged', (_chainId) => {
        window.location.reload(_chainId);
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
     tokenBalances: {
      deep: true,
      handler(newBalances) {
        this.$emit('updateBalances', { ppepe: newBalances.ppepe, pepe: newBalances.pepe, shib: newBalances.shib });
      }
     }
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
