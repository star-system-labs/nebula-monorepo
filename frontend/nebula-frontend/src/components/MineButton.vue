<template>
  <div class="flex justify-center items-center">
    <button 
      :disabled="insufficientFunds || enterAmount || limitExceeded || !isCountdownComplete" 
      @click="mine" 
      class="mt-5 bg-gradient-to-r from-sky-600 to sky-900 hover:bg-button font-origin focus:outline-none focus:ring-2 focus:ring-blue-700 text-yellow-300 px-6 py-2 rounded-xl cursor-pointer text-sm md:text-md lg:text-lg font-semibold transition-colors focus:outline-none"
    >
      <orbit-spinner v-if="loading" :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
      <span v-if="limitExceeded">{{ $t('message.limitexceeded') }}</span>
      <span v-else-if="insufficientFunds">{{ $t('message.insufficientfunds') }}</span>
      <span v-else-if="enterAmount">{{ $t('message.enteramount') }}</span>
      <span v-else-if="!isCountdownComplete && !loading">STARTS IN {{ formattedTime }}</span>
      <span v-else-if="!loading">{{ $t('message.mine') }}</span>
    </button>
  </div>
</template>

<script>
import MiningRigABI from '../ABI/MiningRigABI.json'
import { OrbitSpinner } from 'epic-spinners';
import { ethers } from "ethers";
import widgetAnalytics from '@/utils/widgetAnalytics';
let provider;
// eslint-disable-next-line no-unused-vars
let contract;

export default {
  components: {
    OrbitSpinner
  },
  data() {
    return {
      loading: false,
      web3: null,
      timeRemaining: null,
      timer: null,
      endTime: new Date('2025-04-30T12:00:00').getTime(),
      isCountdownComplete: false
    };
  },
  props: {
    enteredAmount: {
      type: String,
      default: '0'
    },
    walletBalance: {
      type: String,
      default: '0'
    },
    contractAddress: {
      type: String,
      required: true,
    },
  },
  async created() {
    if (window.ethereum) {
      try {
        provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        contract = new ethers.Contract(
          this.contractAddress,
          MiningRigABI,
          signer
        );
      } catch (error) {
        console.error("Failed to enable ethereum or create contract:", error);
      }
    } else {
      console.log(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
    this.updateTimer();
    this.timer = setInterval(this.updateTimer, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
  },
  computed: {
    insufficientFunds() {
      return parseFloat(this.enteredAmount) > parseFloat(this.walletBalance);
    },
    enterAmount() {
      return !parseFloat(this.enteredAmount);
    },
    limitExceeded() {
      return parseFloat(this.enteredAmount) > 5;
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
    }
  },
  methods: {
    updateTimer() {
      const now = new Date().getTime();
      this.timeRemaining = Math.max(0, this.endTime - now);
      
      if (this.timeRemaining <= 0) {
        clearInterval(this.timer);
        this.isCountdownComplete = true;
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
    async mine() {
      const startTime = performance.now();
      try {
        this.loading = true;
        let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }).catch(() => null);
        
        if (!accounts || accounts.length === 0) {
          console.error('No accounts found.');
          console.log('No accounts found.');
          widgetAnalytics.trackInteraction('mine', false, { error: 'No accounts found' });
          return;
        }
        
        const account = accounts[0];
        const amountOutMinUniswap = 2000;
        
        console.log('Sending Transaction with:', {
          from: account,
          value: this.enteredAmount,
          amountOutMinUniswap: amountOutMinUniswap,
        });
        
        this.$root.$refs.notificationCard.showNotification("pending", "Transaction pending...");
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(
          this.contractAddress,
          MiningRigABI,
          signer
        );
        
        const tx = await contract.mineLiquidity(amountOutMinUniswap, {
          value: ethers.parseEther(this.enteredAmount.toString()),
          from: account,
        }).catch(e => {
          if (e.code === 4001) {
            this.$root.$refs.notificationCard.showNotification("error", "Transaction cancelled");
            widgetAnalytics.trackInteraction('mine', false, { error: 'User rejected', code: 4001 });
            return null;
          }
          throw e;
        });

        if (!tx) return;
        
        const receipt = await tx.wait();
        const duration = performance.now() - startTime;
        
        if (receipt.status === 0) {
          this.$root.$refs.notificationCard.showNotification("error", "Mining failed.");
          widgetAnalytics.trackInteraction('mine', false, { 
            error: 'Transaction failed', 
            duration,
            txHash: receipt.transactionHash 
          });
        } else if (receipt.status === 1) {
          this.$emit('mined');
          this.$root.$refs.notificationCard.showNotification("success", "PPePe Mined!");
          
          widgetAnalytics.trackInteraction('mine', true, { 
            amount: this.enteredAmount,
            duration,
            txHash: receipt.transactionHash,
            gasUsed: receipt.gasUsed?.toString(),
            blockNumber: receipt.blockNumber,
            effectiveGasPrice: receipt.effectiveGasPrice?.toString()
          });
          
          widgetAnalytics.trackTransaction('mine', receipt.transactionHash, 'success', receipt.gasUsed?.toString());
          
          try {
            await this.$emit('updateBalances');
          } catch (error) {
            console.log('Balance update notification sent');
          }
        }
      } catch (error) {
        const duration = performance.now() - startTime;
        //console.error('Mining failed: ', error.message || error);
        if (error.code === 4001 || error.code === 'ACTION_REJECTED' || error.message?.includes("user rejected")) {
          console.log('Transaction rejected by user');
          this.$root.$refs.notificationCard.showNotification("error", "Transaction cancelled");
          widgetAnalytics.trackInteraction('mine', false, { 
            error: 'User rejected', 
            code: 4001,
            duration 
          });
          return;
        }
        
        if (error.code === -32000 || (error.message && error.message.includes("insufficient funds for gas"))) {
          console.log('Insufficient ETH for gas:', error.message);
          this.$root.$refs.notificationCard.showNotification("error", "Transaction failed - Not enough ETH for gas");
          widgetAnalytics.trackInteraction('mine', false, { 
            error: 'Insufficient funds for gas', 
            code: -32000,
            duration 
          });
          return;
        }
        
        console.log('Transaction failed:', error.message || 'Unknown error');
        this.$root.$refs.notificationCard.showNotification("error", "Transaction failed");
        widgetAnalytics.trackInteraction('mine', false, { 
          error: error.message || 'Unknown error',
          code: error.code,
          duration 
        });
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.countdown-ending {
  animation: pulse 1s infinite;
}
</style>