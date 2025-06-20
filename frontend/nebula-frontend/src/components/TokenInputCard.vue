<template>
  <div class="flex flex-col items-start border-custom-blue bg-card-blue bg-opacity-100 p-4 rounded-xl w-full">
    <div class="flex justify-between items-center w-full">
      <p :class="labelClass">{{ label }}</p>
      <div v-if="(currency === 'ETH' || showGasPrice) && currentGasGwei !== null" class="text-xs text-teal">
        ⛽ {{ currentGasGwei }} Gwei
      </div>
    </div>
    <div class="flex items-center justify-between w-full">
      <AmountInput 
        :currency="currency" 
        :maxAmount="balance" 
        :isEditable="isEditable" 
        :displayValue="estimatedReward.toString()"
        @inputChanged="emitAmount" 
        ref="amountInput" 
        />
      <div class="flex flex-col items-center justify-center flex-shrink-0 ml-2">
        <img :src="currencyLogo" alt="Currency Logo" :class="logoClasses">
      </div>
    </div>
    <div class="flex items-center text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg justify-end w-full mt-1">
      <div class="flex items-center">
        <div class="text-yellow-300 flex-shrink-0">{{ $t('message.balance') }}:</div>
        <div class="text-yellow-300 ml-1 flex-shrink-0">{{ balance || '0.00' }}</div>
        <button
        v-if="isMaxSelectable"
        @click="handleMaxClicked"
        class="ml-1 sm:ml-2 md:ml-4 lg:ml-6 xl:ml-8 bg-transparent border-none cursor-pointer px-2 py-1 text-slate-300 hover:text-yellow-300 focus:outline-none transition-colors">
        {{ $t('message.max') }}
      </button>
      <button 
        v-else 
        class="ml-1 sm:ml-2 md:ml-4 lg:ml-6 xl:ml-8 bg-transparent border-none cursor-not-allowed px-2 py-1 text-slate-300 opacity-50"
        disabled>
          {{ $t('message.max') }}
      </button>
      </div>
    </div>
  </div>
</template>

<script>

import AmountInput from './AmountInput.vue';
import { ethers } from 'ethers';
import MiningRigABI from '../ABI/MiningRigABI.json';

export default {
  name: 'TokenInputCard',
  components: {
    AmountInput,
  },
  props: {
    estimatedReward: {
      type: String,
      default: '0.00'
    },
    isLPStaking: {
      type: Boolean,
      default: false
    },
    lpTokenBalances: Object,
    tokenBalances: Object,
    accountAddress: {
      type: String,
      default: null
    },
    isEditable: {
      type: Boolean,
      default: true
    },
    currency: {
      type: String,
      default: 'ETH'
    },
    label: {
      type: String,
      default: ''
    },
    labelClass: {
      type: String,
      default: ''
    },
    currencyLogo: {
      type: String,
      default: ''
    },
    balance: {
      type: String,
      default: '0.00'
    },
    quote: {
      type: String,
      default: null
    },
    isToken: {
      type: Boolean,
      default: false
    },
    rawBalance: {
      type: String,
      default: '0'
    },
    showGasPrice: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      currentGasGwei: null,
      gasPriceInterval: null,
    };
  },
  computed: {
    correctBalance() {
      console.log('LP Token Balances:', this.lpTokenBalances);
      if (this.isLPStaking) {
        const keyMapping = {
          'ppepe': 'ppepelp',
          'pepe': 'pepelp',
          'shib': 'shiblp',
        };
        const normalizedCurrency = this.currency.toLowerCase();
        const mappedKey = keyMapping[normalizedCurrency] || normalizedCurrency;
        const balance = this.lpTokenBalances[mappedKey] || '0';
        console.log(`LP Balance Mapped Key: ${mappedKey}, LP Balance: ${balance}`);
        return balance;
      }
      return this.isToken ? this.rawBalance : this.balance;
    },
    isMaxSelectable() {
      if (this.currency === 'ETH') {
        return parseFloat(this.correctBalance) > 0;
      } else {
        return parseFloat(this.rawBalance) > 0;
      }
    },
    logoClasses() {
      const base = 'w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0';
      return this.currency === 'Shib' || this.currency.toLowerCase() === 'shiba'
        ? `${base} object-contain mr-1`
        : `${base} rounded-full mr-1`;
    },
  },
  methods: {
    emitAmount(value) {
      console.log('Emitting amount:', value);
      this.$emit('amountChanged', value);
    },
    async handleMaxClicked() {
      if (this.currency !== 'ETH') {
        let maxAmount = parseFloat(this.correctBalance).toFixed(2);
        this.$refs.amountInput.setAmount(maxAmount);
        this.emitAmount(maxAmount);
        return;
      }
      
      try {
        const balance = parseFloat(this.correctBalance);
        if (!window.ethereum) {
          throw new Error("Ethereum provider not found");
        }
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const feeData = await provider.getFeeData();
        
        let contractAddress = null;
        try {
          this.$emit('requestContractAddress', (address) => {
            contractAddress = address;
          });
          
          if (!contractAddress) {
            contractAddress = this.$parent.selectedContractAddress || '0xe9C5A35BefC36E8B35B93470C034caf0a8E94308';
          }
        } catch (e) {
          console.log("Using fallback contract address");
          contractAddress = '0xe9C5A35BefC36E8B35B93470C034caf0a8E94308';
        }
        
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, MiningRigABI, signer);
        
        const amountOutMinUniswap = 2000;
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }).catch(() => null);
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found");
        }
        
        const testAmount = balance * 0.9;
        
        const gasEstimate = await contract.mineLiquidity.estimateGas(
          amountOutMinUniswap, 
          { 
            value: ethers.parseEther(testAmount.toString()),
            from: accounts[0]
          }
        );
        
        const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;
        if (!gasPrice) {
          throw new Error("Gas price unavailable");
        }
        
        const gasCostWei = gasEstimate * gasPrice;
        const gasCostEth = parseFloat(ethers.formatEther(gasCostWei.toString()));
        
        const network = await provider.getNetwork();
        const chainId = network.chainId;
        const gasPriceGwei = parseFloat(ethers.formatUnits(gasPrice, 'gwei'));
        

        let gasReservation = gasCostEth;
        gasReservation *= 2.0;
        const fixedMinimum = chainId.toString() === "1" ? 0.005 : 0.003;
        gasReservation = Math.max(gasReservation, fixedMinimum);
        gasReservation += balance * 0.03;
        if (chainId.toString() === "1") {
          gasReservation += 0.001;
        }
        
        const gasWithBuffer = gasReservation;
        
        console.log(`Uniswap-style gas reservation:
          - Base gas cost: ${gasCostEth.toFixed(6)} ETH
          - Gas price: ${gasPriceGwei.toFixed(1)} Gwei
          - Network: ${chainId.toString() === "1" ? "Ethereum Mainnet" : "Testnet"}
          - Total reserved: ${gasWithBuffer.toFixed(6)} ETH
        `);
        
        const maxAmount = Math.max(0, balance - gasWithBuffer);
        
        const gasPriceGweiFormatted = parseFloat(ethers.formatUnits(gasPrice, 'gwei')).toFixed(1);
        this.$root.$refs.notificationCard.showNotification("info", 
          `Gas reserved: ${gasWithBuffer.toFixed(6)} ETH (${gasPriceGweiFormatted} Gwei)`);
        
        const precision = maxAmount < 0.0001 ? 8 : maxAmount < 0.01 ? 6 : maxAmount < 1 ? 5 : 4;
        const formattedAmount = maxAmount.toFixed(precision);
        
        console.log(`Gas Estimate: ${gasEstimate} units at ${gasPriceGwei} Gwei. Reserved: ${gasWithBuffer.toFixed(6)} ETH. Max amount: ${formattedAmount}`);
        
        this.$refs.amountInput.setAmount(formattedAmount);
        this.emitAmount(formattedAmount);
        
      } catch (error) {
        console.warn('Gas estimation failed, falling back to static reserve:', error);
        
      }
    },
    async fetchGasPrice() {
        if (!window.ethereum) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice; 
            if (gasPrice) {
                this.currentGasGwei = parseFloat(ethers.formatUnits(gasPrice.toString(), 'gwei')).toFixed(1);
            } else {
                this.currentGasGwei = null;
            }
        } catch (error) {
            console.error("Error fetching gas price:", error);
            this.currentGasGwei = null;
        }
    }
  },
  watch: {
    estimatedReward(newVal, oldVal) {
      console.log(`estimatedReward changed in TokenInputCard from ${oldVal} to ${newVal}`);
    }
  },
  mounted() {
    console.log('TokenInputCard mounted with estimatedReward:', this.estimatedReward);
    this.fetchGasPrice();
    this.gasPriceInterval = setInterval(this.fetchGasPrice, 15000);
  },
  beforeUnmount() {
    clearInterval(this.gasPriceInterval);
  }
}
</script>