<template>
  <div class="flex justify-center items-center">
    <button :disabled="insufficientFunds || enterAmount || limitExceeded" @click="mine" class="mt-5 bg-gradient-to-r from-sky-600 to sky-900 hover:bg-button font-origin focus:outline-none focus:ring-2 focus:ring-blue-700 text-yellow-300 px-6 py-2 rounded-xl cursor-pointer text-lg font-semibold transition-colors focus:outline-none">
      <orbit-spinner v-if="loading" :animation-duration="1200" :size="25" color="#FDE047"></orbit-spinner>
      <span v-if="limitExceeded">{{ $t('message.limitexceeded') }}</span>
      <span v-else-if="insufficientFunds">{{ $t('message.insufficientfunds') }}</span>
      <span v-else-if="enterAmount">{{ $t('message.enteramount') }}</span>
      <span v-else>{{ $t('message.mine') }}</span>
    </button>
  </div>
</template>

<script>
import MiningRigABI from '../ABI/MiningRigABI.json'
import { OrbitSpinner } from 'epic-spinners';
import { ethers } from "ethers";
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
      web3: null
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
        contract = new ethers.Contract(
          this.contractAddress,
          MiningRigABI,
          await provider.getSigner()
        );
      } catch (error) {
        console.error("Failed to enable ethereum or create contract:", error);
      }
    } else {
      console.log(
        "Non-Ethereum browser detected. You should consider trying MetaMask!"
      );
    }
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
    }
  },
  methods: {
    async mine() {
  try {
    this.loading = true;
    let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      console.error('No accounts found.');
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
    const tx = await contract.mineLiquidity(amountOutMinUniswap, {
      value: ethers.parseEther(this.enteredAmount.toString()),
      from: account,
    });
    
    this.$root.$refs.notificationCard.showNotification("pending", "Transaction pending...");
    const receipt = await tx.wait();

    if (receipt.status === 0) {
      this.$root.$refs.notificationCard.showNotification("error", "Mining failed.");
    } else if (receipt.status === 1) {
      this.$emit('mined');
      this.$root.$refs.notificationCard.showNotification("success", "PPePe Mined Bruh!");
    }
  } catch (error) {
    console.error('Mining failed: ', error.message || error);
    this.$root.$refs.notificationCard.showNotification("error", "Mining failed: " + (error.message || error));
  } finally {
    this.loading = false;
  }
}
  }
};
</script>