<template>
  <div class="flex flex-col items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-50 p-5 rounded-xl w-full mx-auto">
    <div class="rig-toggle flex cursor-pointer mb-4 rounded-xl overflow-hidden border-2 border-custom-blue shadow-md relative" @click="toggleMiningRig">
      <div class="absolute left-0 top-0 h-full w-1/2 bg-button-active rounded-xl transition-all duration-300" 
        :class="selectedMiningRig === 'PePe' ? 'left-0' : 'left-1/2'"></div>
      <div 
        :class="selectedMiningRig === 'PePe' ? 'text-yellow-300' : 'text-custom-blue-inactive'" 
        class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10"
        @click="setSelectedToken('PePe')"
      ><img :src="require('@/assets/pepe.png')" alt="Currency Logo" class="w-6 h-6 rounded-full mr-2">PePe</div>
      <div 
        :class="selectedMiningRig === 'Pond' ? 'text-yellow-300' : 'text-custom-blue-inactive'" 
        class="flex text-center py-2 px-8 font-bold font-origin transition-colors duration-300 ease-in-out z-10"
        @click="setSelectedToken('Pond')"
      >Pond <img :src="require('@/assets/pond.png')" alt="Currency Logo" class="w-6 h-6 rounded-full ml-2"></div>
    </div>
    <TokenInputCard 
      class="w-[350px] mb-1 text-teal font-origin"
      currency="ETH"
      label="You Supply:"
      :currencyLogo="require('@/assets/eth.png')"
      :balance="ethBalance"
      :isEditable="true"
      @amountChanged="handleAmountChanged"
      @inputChanged="calculateQuote"
      :accountAddress="accountAddress"
    />

    <transition name="expand">
      <div 
      class="cope-sequence cursor-pointer absolute transform 
        translate-x-[-50%] scale-x-[1] transition-transform 
        duration-500 ease-in-out rounded-xl h-10 max-w-[90vw] 
        sm:max-w-[70vw] md:max-w-[50vw] lg:max-w-[40vw] xl:max-w-[32vw] 
        flex items-center justify-center bg-card-blue bg-opacity-88 
        text-custom-blue font-bold border-2 border-custom-blue 
        shadow-md z-2 overflow-hidden whitespace-nowrap sm:p-2"
        @click="toggleCopeSequence"
      >
    <span v-show="!showCopeSequence" class="w-full text-center text-xs my-xs-1 mx-1 text-yellow-300 sm:px-2.5 font-origin">
      Mine PPePe
    </span>
    <div v-show="showCopeSequence" class="flex gap-2.5 w-full justify-center items-center px-2.5">
      <img class="max-h-6 md:max-h-6 lg:max-h-8 w-auto" :src="require('@/assets/eth.png')" alt="ETH">
      <div class="arrow"></div>
      <img class="max-h-9 md:max-h-9 lg:max-h-10 w-auto" :src="supplyImageSrc" alt="Supply">
      <div class="arrow"></div>
      <img class="max-h-6 md:max-h-6 lg:max-h-8 w-auto" :src="require('@/assets/ppepe.png')" alt="PPePe">
    </div>
  </div>
</transition>

    <TokenInputCard 
      class="w-[350px] mb-4 text-teal font-origin"
      :currency="selectedToken"
      label="You Mine:"
      :currencyLogo="getTokenLogo(selectedToken)"
      :balance="abbreviatedPpepeBalance"
      :isEditable="false"
      :displayValue="estimatedReward.toString()"
      :accountAddress="accountAddress"
      :quote="localQuote"
      :isMaxSelectable="false"
    />
    
    <ConnectWalletButton v-if="!accountAddress" @connect="$emit('connect')" class="mt-5"/>
    <MineButton v-else
      :contractAddress="selectedContractAddress"
      :enteredAmount="enteredAmountData"
      :walletBalance="walletBalanceData"
      @mine="handleMine"
      @quoteObtained="handleQuoteObtained"
    />
  </div>
</template>
  
<script>
import ConnectWalletButton from './ConnectWalletButton.vue';
import TokenInputCard from './TokenInputCard.vue';
import MineButton from './MineButton.vue';
import { Token, TokenAmount, Pair } from '@uniswap/sdk-core';
import { ethers } from 'ethers';
import supplyPepe from '@/assets/supply-pepe.png';
import supplyPond from '@/assets/supply-pond.png';

const chainId = 1;
const PEPE_ADDRESS = '0x6982508145454ce325ddbe47a25d4ec3d2311933';
const PEPE = new Token(1, PEPE_ADDRESS, 18);
console.log("!!!! MR. PEPE: ", PEPE.address);
const WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WETH = new Token(1, WETH_ADDRESS, 18);
console.log("!!!!WETH: ", WETH.address);
//const pair = '0xA43fe16908251ee70EF74718545e4FE6C5cCEc9f';

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
    }
  },
  data() {
    return {
      ethAmount: 0,
      estimatedReward: 0,
      liquidityEstimate: 0,
      selectedToken: "PePe",
      //accountAddress: null,
      showCopeSequence: false,
      enteredAmountData: '0.00',
      walletBalanceData: '0.00',
      selectedMiningRig: 'PePe', // Default
      PEPE_ADDRESS: '0xe9C5A35BefC36E8B35B93470C034caf0a8E94308',
      POND_ADDRESS: '0x11541e990036ec13D521d584F098a83bD0F4BFC3',
      supplyPepe,
      supplyPond,
      localQuote: null,
      quote: null,
      localPpepeBalance: this.ppepeBalance
    };
  },
  methods: {
    async fetchPairData() {
      const infuraUrl = process.env.VUE_APP_INFURA_LINK;
      const provider = new ethers.JsonRpcProvider(infuraUrl, undefined, {
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
      const tokenAmount0 = new TokenAmount(token0, BigInt(reserve0.toString())); // eslint-disable-line no-undef
      const tokenAmount1 = new TokenAmount(token1, BigInt(reserve1.toString())); // eslint-disable-line no-undef
      const pair = new Pair(tokenAmount0, tokenAmount1);

      return pair;
    },
    async Swapquote(ethAmount) {
      const infuraUrl = process.env.VUE_APP_INFURA_LINK;
      const provider = new ethers.JsonRpcProvider(infuraUrl, undefined, {
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
      return estimatedTokens;
      } catch (error) {
        console.error("Error getting swap estimate:", error);
      }
    },
    async calculateQuote(ethAmount) {
      const swappedAmtOut = await this.Swapquote(ethAmount);
      if (typeof swappedAmtOut === 'undefined') {
        console.error('Failed to get swappedAmtOut');
        return;
      }
      console.log('swappedAmtOut: ', swappedAmtOut, ethAmount);
      const _totalLiquidity = await this.estimateAddLiquidity(swappedAmtOut, ethAmount);
      console.log("swappedAmtOut: ", swappedAmtOut);
      // quote = (_totalLiquidity * 4) + (swappedAmtOut * 8);
      // The above is the logic from the miner to calculate the quote,
      // we use this below after grabbing the above items through the uniswap/sdk
      // then pass this back into AmountInput.vue through TokenInputCard.vue
      // to attempt to allow the user to view the estimated rewards for mining
      const quote = (_totalLiquidity * 4) + (swappedAmtOut * 8);
      this.estimatedReward = quote;
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
    handleQuoteObtained(quote) {
      this.localQuote = quote;
      this.quote = quote;
    },
    handleMining() {
        this.$emit('mine');
    },
    handleAmountChanged(value) {
      console.log("Amount Changed: ", value)
      this.enteredAmountData = value;
      this.calculateQuote(value);
      this.walletBalanceData = this.ethBalance;
    },
    getTokenLogo(token) {
      if (token === "PePe") return require('@/assets/ppepe.png');
      if (token === "Pond") return require('@/assets/ppepe.png');
      return '';
    },
    toggleCopeSequence() {
      this.showCopeSequence = !this.showCopeSequence;
    },
    toggleMiningRig() {
      this.selectedMiningRig = this.nextMiningRig;
    },
    setSelectedToken(token) {
      this.selectedToken = token;
    }
  },
  mounted() {
    this.walletBalanceData = this.ethBalance;
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
   }
  },
  computed: {
    supplyImageSrc() {
      return this.selectedToken === "PePe" ? this.supplyPepe : this.supplyPond;
    },
    selectedContractAddress() {
      return this.selectedMiningRig === 'PePe' ? this.PEPE_ADDRESS : this.POND_ADDRESS;
    },
    nextMiningRig() {
      return this.selectedMiningRig === 'PePe' ? 'Pond' : 'PePe';
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
  top: 51.55%; 
  left: 50%;
}

/* Adjustments for screens with width <= 1280px */
@media (max-width: 1280px) {
  .cope-sequence {
    top: 51.55%;
  }
}

/* Adjustments for screens with width <= 1024px */
@media (max-width: 1024px) {
  .cope-sequence {
    top: 51.55%;
  }
}

/* Adjustments for screens with width <= 768px */
@media (max-width: 768px) {
  .cope-sequence {
    top: 51.55%;
  }
}

/* Adjustments for screens with width <= 640px */
@media (max-width: 640px) {
  .cope-sequence {
    top: 50.75%;
  }
}

/* Adjustments for screens with width <= 300px */
@media (max-width: 300px) {
  .cope-sequence {
    top: 48.55%;
  }
}

/* Adjustments for screens with width <= 280px */
@media (max-width: 280px) {
  .cope-sequence {
    top: 46.75%;
  }
}
</style>
