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
         LP Staking
       </div>
       <div 
         class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-lg"
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
            class="flex items-center justify-center text-center py-1 px-4 sm:px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10 text-xs md:text-sm lg:text-lg"
            @click.stop="setSelectedCurrency(currency)">
         <img :src="currencyLogos[index]" alt="Currency Logo" class="w-6 h-6 rounded-full mr-2">{{ currency }}
       </div>
      </div>
     </div>
    </div>

    <div v-if="selectedOption === 'Staking'" class="staking-rewards-container">
      <div class="flex flex-col items-center justify-between border-custom-blue bg-card-blue bg-opacity-100 p-4 rounded-xl w-full mb-4">
        <div class="text-yellow-300 font-origin text-center mb-4">Primordial Emission: {{ primordialEmission }}</div>
        <div class="flex items-center justify-between w-full">
          <div>
            <div class="text-teal font-origin mb-2 mr-2">LP Staked</div>
            <div class="text-yellow-300 font-origin">{{ stakedAmount }}</div>
          </div>
          <div>
            <div class="text-teal font-origin mb-2 ml-2">{{ selectedToken === 'PPePe' ? 'SDIV Rewards' : 'PPePe Rewards' }}</div>
            <div class="text-yellow-300 font-origin">{{ rewardsOwed }}</div>
          </div>
        </div>
      </div>
    </div>

     <div class="mb-6">
     <ConnectWalletButton v-if="!accountAddress" @connect="$emit('connect')" class="mb-6"/>
      <button v-else-if="selectedToken === 'PPePe'" disabled class="bg-gradient-to-r font-origin font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-not-allowed text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 w-full text-xs md:text-sm lg:text-lg">
        SDIV REWARDS COMING SOON
      </button>
        <div v-else class="flex justify-between w-full">
          <button @click="handleUnstakeClick" :disabled="loadingUnstake" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 mr-5">
            <SpinnerSVG v-if="loadingUnstake" />
            <span v-else>Unstake</span>
          </button>
          <button @click="handleClaimClick" :disabled="loadingClaim" class="bg-gradient-to-r font-origin from-sky-600 to sky-900 hover:bg-button text-yellow-300 px-4 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700">
            <SpinnerSVG v-if="loadingClaim" />
            <span v-else>Claim</span>
          </button>
        </div>
      </div>
    </div>
 </template>
 
 <script>
 import ConnectWalletButton from './ConnectWalletButton.vue';
 import SpinnerSVG from './SpinnerSVG.vue';
 import LPStakingABI from '../ABI/LPStakingABI.json';
 import TokenABI from '../ABI/IERC20.json';
 import VestingABI from '../ABI/VestingABI.json';
 import { ethers } from 'ethers';
 import { toHandlers } from 'vue';
 
 export default {
   name: 'ClaimCard',
   components: {
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
           ShibLP: '0x5e29a016b9d79ef38Cc66B3E58A08af80b26FB91',
          }
        },
       },
       vestingPeriod: 30,
       selectedToken: 'PPePe',
       loadingClaim: false,
       loadingUnstake: false,
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
     };
   },
   methods: {
     async fetchPrimordialEmission() {
      try {
        if (!this.accountAddress) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
        const contract = new ethers.Contract(contractAddress, LPStakingABI, provider);
        const emission = await contract.getPrimordialEmission(this.accountAddress);
        this.primordialEmission = emission;
      } catch (error) {
        console.error("Error fetching Primordial Emission:", error);
      }
     },
     async fetchStakingInfo() {
      try {
      if (!this.accountAddress || this.selectedOption !== 'Staking') return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
      const contract = new ethers.Contract(contractAddress, LPStakingABI, provider);
      const stakerInfo = await contract.getStakerInfo(this.accountAddress);
      console.log(`Fetching staking info for address: ${this.accountAddress}`);
      contract.getStakerInfo(this.accountAddress)
      .then((response) => {
        console.log('Raw response:', response);
        this.stakedAmountWei = ethers.formatUnits(stakerInfo.stakedAmount, 18);
        this.stakedAmount = this.abbreviateNumber(parseFloat(ethers.formatEther(stakerInfo.stakedAmount)).toFixed(2));
        this.lpStakeTime = stakerInfo.lpStakeTime.toString();
        const lpClaimTimeInEther = ethers.formatUnits(stakerInfo.lpClaimTime, 'ether');
        this.lpClaimTime = parseFloat(lpClaimTimeInEther).toFixed(2);
      })
      .catch((error) => {
        console.error('Error fetching staking info:', error);
      });

      console.log(`Staked Amount: ${ethers.formatEther(stakerInfo[0])}`);
      console.log(`LP Stake Time: ${stakerInfo[1].toString()}`);
      console.log(`LP Claim Time: ${stakerInfo[2].toString()}`);

      const basePrimordialOwed = await contract.getBasePrimordialOwed(stakerInfo.stakedAmount, this.accountAddress);
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
       try{
       const provider = new ethers.BrowserProvider(window.ethereum);
       for (const [tokenName, tokenAddress] of Object.entries(this.contractAddresses[this.currentNetwork].tokens)) {
         const tokenContract = new ethers.Contract(tokenAddress, this.erc20ABI, provider);
         const balanceInWei = await tokenContract.balanceOf(this.accountAddress);
         const balanceInEther = ethers.formatEther(balanceInWei);
         const balance = await tokenContract.balanceOf(this.accountAddress);
         console.log("Token Balance:", balance.toString());
         this.tokenBalances[tokenName] = balanceInEther;
         console.log(`${tokenName} (${tokenAddress}) balance:`, this.tokenBalances[tokenName]);
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
     async handleUnstakeClick() {
      try {
        this.loadingUnstake = true;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
        const contract = new ethers.Contract(contractAddress, LPStakingABI, signer);

        const stakedAmount = ethers.parseUnits(this.stakedAmountWei, 18);
        const tx = await contract.unstakeLPToken(stakedAmount);
        await tx.wait();

        this.loadingUnstake = false;
        // Refresh the balance
      } catch (error) {
        this.loadingUnstake = false;
        console.error("Error during unstake:", error);
      }
     },
     async handleClaimClick() {
      try {
        this.loadingClaim = true;
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const contractAddress = this.contractAddresses[this.currentNetwork].staking[this.selectedToken];
        if (!contractAddress) {
          console.error('Contract address is undefined');
          this.loadingClaim = false;
          return;
        }

        const contract = new ethers.Contract(contractAddress, LPStakingABI, signer);

        const stakedAmount = ethers.parseUnits(this.stakedAmountWei, 18);

        console.log("CalimClick stakedAmount", stakedAmount);

        const tx = await contract.claimReward(stakedAmount);
        await tx.wait();

        this.loadingClaim = false;
        // Refresh balances
      } catch (error) {
        this.loadingClaim = false;
        console.error("Error during claim:", error);
      }
     },
     async handleStakeClick() {
      try {
        if (!this.currentNetwork) {
          console.error('Network not detected or unsupported');
          return;
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
          timeIndex = this.vestingPeriod / 30 - 1;
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
        const approveTx = await tokenContract.approve(contractAddress, amountInWei);
        await approveTx.wait();
        console.log("Tokens approved");

        const actionContract = new ethers.Contract(contractAddress, contractABI, signer);
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
     selectedToken(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.fetchStakingInfo();
        this.fetchPrimordialEmission();
      } 
     },
     accountAddress(newVal, oldVal) {
       if (newVal !== oldVal) {
         this.fetchLPTokenBalances();
         this.fetchTokenBalances();
         this.fetchStakingInfo();
         this.fetchPrimordialEmission();
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
 
 
 