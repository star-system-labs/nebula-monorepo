<template>
  <div class="relative flex flex-col items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-50 p-5 rounded-xl w-full mx-auto">
    <div class="rig-toggle flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative" @click="toggleMiningRig">
      <div class="absolute left-0 top-0 h-full w-1/2 bg-button-active rounded-xl transition-all duration-300" 
        :class="selectedMiningRig === 'PePe' ? 'left-0' : 'left-1/2'"></div>
      <div 
        :class="selectedMiningRig === 'PePe' ? 'text-yellow-300' : 'text-custom-blue-inactive'" 
        class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10"
        @click="setSelectedToken('PePe')"
      ><img :src="require('@/assets/pepe.webp')" alt="Currency Logo" class="w-6 h-6 rounded-full mr-2">PePe</div>
      <div 
        :class="selectedMiningRig === 'Shiba' ? 'text-yellow-300' : 'text-custom-blue-inactive'" 
        class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10"
        @click="setSelectedToken('Shiba')"
      >Shiba <img :src="require('@/assets/shiba.webp')" alt="Currency Logo" class="w-6 h-6 object-contain ml-2"></div>
    </div>
    <TokenInputCard 
      class="w-[350px] mb-1 text-teal font-origin"
      currency="ETH"
      :label="$t('message.yousupply')"
      :currencyLogo="require('@/assets/eth.webp')"
      :balance="ethBalance"
      :isEditable="true"
      @amountChanged="handleAmountChanged"
      @inputChanged="calculateQuote"
      :accountAddress="accountAddress"
    />

    <div 
      ref="copeSequence"
      class="cope-sequence cursor-pointer relative mx-auto rounded-xl h-10 flex items-center justify-center bg-card-blue bg-opacity-88 text-custom-blue font-bold border-2 border-custom-blue shadow-md z-2 overflow-hidden whitespace-nowrap sm:p-2"
      :class="{'timer-visible': !accountAddress || (accountAddress && (!isInputValidForMining || !isMiningPhaseActive)), 'timer-hidden': accountAddress && isInputValidForMining && isMiningPhaseActive}"
      @click="toggleCopeSequence"
      style="width: 160px;"
    >
      <span v-show="!showCopeSequence" class="cope-text w-full text-center text-xs my-xs-1 mx-1 text-yellow-300 sm:px-2.5 font-origin font-light">
        {{ $t('message.mineppepe') }}
      </span>
      <div v-show="showCopeSequence" class="cope-images flex gap-2.5 w-full justify-center items-center px-2.5">
        <img class="max-h-6 md:max-h-6 lg:max-h-8 w-auto" :src="require('@/assets/eth.webp')" alt="ETH">
        <div class="arrow"></div>
        <img class="max-h-9 md:max-h-9 lg:max-h-10 w-auto" :src="supplyImageSrc" alt="Supply">
        <div class="arrow"></div>
        <img class="max-h-6 md:max-h-6 lg:max-h-8 w-auto" :src="require('@/assets/ppepe.webp')" alt="PPePe">
      </div>
    </div>

    <TokenInputCard 
      class="w-[350px] mb-4 text-teal font-origin"
      :currency="selectedToken"
      :label="$t('message.youmine')"
      :currencyLogo="getTokenLogo(selectedToken)"
      :balance="abbreviatedPpepeBalance"
      :isEditable="false"
      :estimatedReward="estimatedReward.toString()"
      :accountAddress="accountAddress"
      :quote="localQuote"
      :isMaxSelectable="false"
    />
    
    <div v-if="!accountAddress || (accountAddress && (!isInputValidForMining || !isMiningPhaseActive))" 
         class="mining-timer-container text-yellow-300 font-origin text-center w-full mb-2">
      <div class="mining-timer-text">MINING PHASE: {{ formattedTime }}</div>
    </div>
    
    <ConnectWalletButton v-if="!accountAddress" @connect="$emit('connect')" :isConnecting="isConnecting" class="mt-5"/>    
    <MineButton v-else
      :contractAddress="selectedContractAddress"
      :enteredAmount="enteredAmountData"
      :walletBalance="walletBalanceData"
      ref="mineButton"
      @mine="handleMine"
      @updateBalances="$emit('updateBalances')"
      @quoteObtained="handleQuoteObtained"
    />
  </div>
</template>
  
<script>
import ConnectWalletButton from './ConnectWalletButton.vue';
import TokenInputCard from './TokenInputCard.vue';
import MineButton from './MineButton.vue';
import { gsap } from 'gsap';
const { Token, CurrencyAmount } = require('@uniswap/sdk-core');
import { Pair } from '@uniswap/v2-sdk';
import { ethers } from 'ethers';
import supplyPepe from '@/assets/supply-pepe.webp';
import supplyShiba from '@/assets/supply-shiba.webp';

const chainId = 1;
const PEPE_ADDRESS = '0x6982508145454ce325ddbe47a25d4ec3d2311933';
const PEPE = new Token(1, PEPE_ADDRESS, 18, 'PEPE', 'Pepe Token');
console.log("!!!! MR. PEPE: ", PEPE.address);
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WETH = new Token(1, WETH_ADDRESS, 18, 'WETH', 'Wrapped Ether');
console.log("!!!!WETH: ", WETH.address);

export default {
  components: {
    ConnectWalletButton,
    TokenInputCard,
    MineButton
  },
  props: {
    ethBalance: {
      type: String,
      default: "0.00"
    },
    abbreviatedPpepeBalance: {
      type: String,
      default: "0.00"
    },
    ppepeBalance: {
      type: String,
      default: "0.00"
    },
    accountAddress: {
      type: String,
      default: null
    },
    isConnecting: Boolean,
  },
  data() {
    return {
      ethAmount: 0,
      estimatedReward: 0,
      liquidityEstimate: 0,
      selectedToken: "PePe",
      showCopeSequence: false,
      enteredAmountData: '0.00',
      walletBalanceData: '0.00',
      selectedMiningRig: 'PePe', // Default
      PEPE_ADDRESS: '0xe9C5A35BefC36E8B35B93470C034caf0a8E94308', // pepe miner
      SHIB_ADDRESS: '0x11541e990036ec13D521d584F098a83bD0F4BFC3', // shib miner
      supplyPepe,
      supplyShiba,
      localQuote: null,
      quote: null,
      localPpepeBalance: this.ppepeBalance,
      timeRemaining: null,
      timer: null,
      launchDate: '2025-08-17T12:00:00',
      endTime: new Date('2025-08-17T12:00:00').getTime(),
    };
  },
  methods: {
    async fetchPairData() {
      //const rpcUrl = process.env.VUE_APP_ALCHEMY_RPC;
      const rpcUrl = process.env.VUE_APP_INFURA_RPC;
      console.log("RPC URL:", rpcUrl, process.env.VUE_APP_INFURA_RPC, process.env.VUE_APP_ALCHEMY_RPC);
      const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
        staticNetwork: true
      });
      const pairAddress = '0xA43fe16908251ee70EF74718545e4FE6C5cCEc9f';
      const pairAbi = [
        'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
        'function token0() external view returns (address)',
        'function token1() external view returns (address)'
      ];
      const pairContract = new ethers.Contract(pairAddress, pairAbi, provider);

      try {
        const [reserve0, reserve1] = await pairContract.getReserves();
        const token0Address = await pairContract.token0();
        const token1Address = await pairContract.token1();
        console.log("RESERVE0: ", reserve0, "RESERVE1: ", reserve1, "TOKEN0: ", token0Address, "TOKEN1: ", token1Address);
        return { reserve0, reserve1, token0Address, token1Address };
      } catch (error) {
        console.error('Failed to fetch pair data:', error);
        return null;
      }
    },
    createPairFromData(pairData) {
      const { reserve0, reserve1, token0Address, token1Address } = pairData;
      const token0 = new Token(chainId, token0Address, 18);
      const token1 = new Token(chainId, token1Address, 18);
      const tokenAmount0 = new CurrencyAmount(token0, BigInt(reserve0.toString())); // eslint-disable-line no-undef
      const tokenAmount1 = new CurrencyAmount(token1, BigInt(reserve1.toString())); // eslint-disable-line no-undef
      const pair = new Pair(tokenAmount0, tokenAmount1);

      return pair;
    },
    async swapQuote(ethAmount) {
      //const rpcUrl = process.env.VUE_APP_ALCHEMY_RPC;
      const rpcUrl = process.env.VUE_APP_INFURA_RPC;
      const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
        staticNetwork: true
      });
      const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
      console.log("Router Address: ", routerAddress.toLowerCase());
      const checksummedRouterAddress = ethers.getAddress(routerAddress.toLowerCase());
      console.log("Checksummed Router Address:", checksummedRouterAddress, "Vs", routerAddress);

      const routerAbi = [
        "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
      ];
      const router = new ethers.Contract(checksummedRouterAddress, routerAbi, provider);

      try {
        const pairData = await this.fetchPairData();
        if (!pairData) {
          console.error('Failed to fetch pair data');
          return;
        }

      const path = [pairData.token1Address, pairData.token0Address];
      const amountsIn = ethers.parseUnits(ethAmount.toString(), 'ether');
      console.log("Amounts In: ", amountsIn);
      
      const amountsOut = await router.getAmountsOut(amountsIn, path);
      const estimatedTokens = ethers.formatUnits(amountsOut[1], 'ether');
      console.log("Estimated output tokens:", estimatedTokens, "For Token: ", pairData.token1Address, "For Pair: ", pairData);
      return estimatedTokens/2;
      } catch (error) {
        console.error("Error getting swap estimate:", error);
        return (Number(ethAmount) * 50000).toString();
      }
    },
    async estimateAddLiquidity(swappedAmtOut, ethAmount) {
      const ethers = require('ethers');

      try {
        const pairData = await this.fetchPairData();
        if (!pairData) {
          console.error('Failed to fetch pair data');
          return;
        }

        const { reserve0, reserve1, token0Address, token1Address } = pairData;
        const token0 = new Token(1, token0Address, 18);
        const token1 = new Token(1, token1Address, 18);
        const token0Decimals = 18;
        const swappedAmtOutBigInt = ethers.parseUnits(swappedAmtOut.toString(), token0Decimals);

        const pepeAmount = CurrencyAmount.fromRawAmount(token0, swappedAmtOutBigInt.toString());
        const ethAmountWei = ethers.parseUnits((ethAmount / 2).toString(), 'ether');
        const wethAmount = CurrencyAmount.fromRawAmount(token1, ethAmountWei.toString());

        const pair = new Pair(new CurrencyAmount(token0, reserve0.toString()), new CurrencyAmount(token1, reserve1.toString()));

        const liquidityMinted = pair.getLiquidityMinted(
          new CurrencyAmount(pair.liquidityToken, '0'),
          pepeAmount,
          wethAmount
        );

        console.log(`Estimated liquidity tokens to be minted: ${liquidityMinted.toSignificant(6)}`);
        return liquidityMinted.toSignificant(6);
      } catch (error) {
        console.error("Error estimating add liquidity:", error);
      }
    },
    async calculateQuote(ethAmount) {
      if (!ethAmount || parseFloat(ethAmount) === 0) {
        this.estimatedReward = '0';
        console.log('ethAmount is zero, setting estimatedReward to 0');
        return;
      }
      const swappedAmtOut = await this.swapQuote(ethAmount);
      if (typeof swappedAmtOut === 'undefined') {
        console.error('Failed to get swappedAmtOut');
        return;
      }
      console.log('swappedAmtOut: ', swappedAmtOut, ethAmount);
      const _totalLiquidity = await this.estimateAddLiquidity(swappedAmtOut, ethAmount);
      const quote = (_totalLiquidity * 4) + (swappedAmtOut * 8);
      console.log("Quote: ", quote);
      this.estimatedReward = quote;
      console.log('estimatedReward set:', this.estimatedReward);
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
    handleQuoteObtained(quote) {
      this.localQuote = quote;
      this.quote = quote;
    },
    handleMining() {
        this.$emit('mine');
    },
    handleMine() {
      this.$emit('mine');
    },
    handleAmountChanged(value) {
      console.log("Amount Changed: ", value)
      this.enteredAmountData = value;
      this.calculateQuote(value);
      this.walletBalanceData = this.ethBalance;
    },
    getTokenLogo(token) {
      if (token === "PePe") return require('@/assets/ppepe.webp');
      if (token === "Shiba") return require('@/assets/ppepe.webp');
      return '';
    },
    getCopeWidths() {
      if (window.innerWidth <= 640) {
        return { collapsed: 120, expanded: 200 };
      } else {
        return { collapsed: 125, expanded: 230 };
      }
    },
    toggleCopeSequence() {
      const tl = gsap.timeline();
      const copeEl = this.$refs.copeSequence;
      const { collapsed, expanded } = this.getCopeWidths();
      
      if (!this.showCopeSequence) {
        // Expanding: text → images
        tl.to(copeEl, { 
          width: `${expanded}px`, 
          duration: 0.4, 
          ease: "power2.out" 
        })
        .call(() => {
          this.showCopeSequence = true;
        }, [], 0.2)
        .fromTo('.cope-images', {
          opacity: 0,
          scale: 0.8,
        }, {
          opacity: 1,
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.7)"
        }, 0.2);
      } else {
        // Collapsing: images → text  
        tl.to('.cope-images', {
          opacity: 0,
          scale: 0.8,
          duration: 0.2,
          ease: "power2.in"
        })
        .call(() => {
          this.showCopeSequence = false;
          gsap.set('.cope-images', { clearProps: "all" });
        }, [], 0.2)
        .to(copeEl, {
          width: `${collapsed}px`,
          duration: 0.4,
          ease: "power2.out"
        }, 0.1)
        .fromTo('.cope-text', {
          opacity: 0
        }, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out"
        }, 0.3);
      }
    },
    toggleMiningRig() {
      this.selectedMiningRig = this.nextMiningRig;
    },
    setSelectedToken(token) {
      this.selectedToken = token;
    },
    updateTimer() {
      const now = new Date().getTime();
      this.timeRemaining = Math.max(0, this.endTime - now);
      
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
    async handleUpdateBalances() {
      try {
        await this.$emit('updateBalances');
      } catch (error) {
        console.log('Balance update propagated');
      }
    },
  },
  mounted() {
    this.walletBalanceData = this.ethBalance;
    this.updateTimer();
    this.timer = setInterval(this.updateTimer, 1000);
    this.$nextTick(() => {
      if (this.$refs.copeSequence) {
        const { collapsed } = this.getCopeWidths();
        this.$refs.copeSequence.style.width = `${collapsed}px`;
      }
      if (this.accountAddress && this.$refs.mineButton) {
        this.$refs.mineButton.setLaunchDate(this.launchDate);
      }
    });
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  watch: {
    ethAmount(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.calculateQuote(newVal);
        console.log("calculateQuote called: ", this.calculateQuote);
      }
    },
    enteredAmountData(newVal) {
      console.log("enteredAmountData updated: ", newVal);
    },
    ppepeBalance(newVal) {
      this.localPpepeBalance = newVal;
    },
    accountAddress(newVal) {
      if (newVal && this.$refs.mineButton) {
        this.$refs.mineButton.setLaunchDate(this.launchDate);
      }
    }
  },
  computed: {
    supplyImageSrc() {
      return this.selectedToken === "PePe" ? this.supplyPepe : this.supplyShiba;
    },
    selectedContractAddress() {
      return this.selectedMiningRig === 'PePe' ? this.PEPE_ADDRESS : this.SHIB_ADDRESS;
    },
    nextMiningRig() {
      return this.selectedMiningRig === 'PePe' ? 'Shiba' : 'PePe';
    },
    formattedTime() {
      if (this.timeRemaining <= 0) {
        return '00D 00H 00M 00S';
      }
      
      const days = Math.floor(this.timeRemaining / (24 * 60 * 60 * 1000));
      const hours = Math.floor((this.timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((this.timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((this.timeRemaining % (60 * 1000)) / 1000);
      
      return `${days.toString().padStart(2, '0')}D ${hours.toString().padStart(2, '0')}HR ${minutes.toString().padStart(2, '0')}MIN ${seconds.toString().padStart(2, '0')}SEC`;
    },
    isMiningPhaseActive() {
      return this.timeRemaining > 0;
    },
    isInputValidForMining() {
      const amount = parseFloat(this.enteredAmountData);
      const limit = 5; 
      return !isNaN(amount) && amount > 0 && amount <= limit;
    }
  }
}
</script>
  
<style scoped>
@media (max-width: 640px) {
  .cope-harder-text {
    font-size: 0.5rem;
  }
  .cope-harder-button {
    height: 2rem;
    padding: 0.25rem;
  }
}
@media (min-width: 641px) and (max-width: 768px) {
  .cope-harder-text {
    font-size: 0.75rem;
  }
  .cope-harder-button {
    height: 2.5rem;
    padding: 0.5rem;
  }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .cope-harder-text {
    font-size: 1rem;
  }
  .cope-harder-button {
    height: 3rem; 
    padding: 0.75rem;
  }
}
@media (min-width: 1025px) {
  .cope-harder-text {
    font-size: 1.25rem;
  }
  .cope-harder-button {
    height: 3.5rem;
    padding: 1rem;
  }
}

.arrow {
  position: relative;
  display: inline-block;
  width: 9px;
  height: 1px;
  background-color: #fde047;
  margin: 0 4px;
}

.arrow::before, .arrow::after {
  content: '';
  position: absolute;
  right: 0;
  width: 3px;
  height: 1px;
  background-color: #fde047;
}

.arrow::before {
  top: -1.5px;
  transform: rotate(45deg);
}

.arrow::after {
  bottom: -1.5px;
  transform: rotate(-45deg);
}

.cope-sequence {
  --overlap-offset: -1.25rem;
  
  --mobile-fine-tune: 0px;
  --tablet-fine-tune: 0px; 
  --desktop-fine-tune: 0px;
  --large-fine-tune: 0px;
  
  margin-top: var(--overlap-offset);
  margin-bottom: var(--overlap-offset);
  top: var(--mobile-fine-tune);
  
  transition: none;
}

@media (min-width: 640px) {
  .cope-sequence {
    top: var(--tablet-fine-tune);
  }
}

@media (min-width: 1024px) {
  .cope-sequence {
    top: var(--desktop-fine-tune);
  }
}

@media (min-width: 1280px) {
  .cope-sequence {
    top: var(--large-fine-tune);
  }
}

.cope-sequence.timer-visible {
  transform: translateY(-1px);
}

.cope-sequence.timer-hidden {
  transform: translateY(1px);
}

.mining-timer-container {
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
