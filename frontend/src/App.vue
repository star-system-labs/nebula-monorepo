<template>
  <div id="app" class="relative font-sans text-center max-w-full mx-auto overflow-hidden">
    <video autoplay muted loop playsinline id="backgroundVideo"
        class="absolute top-0 left-0 w-full h-full object-cover z-negative">
      <source src="@/assets/POC.mp4" type="video/mp4">
        Not Supported.
    </video>
    
    <div class="main-container relative flex flex-col items-center justify-center min-h-screen">
      <MainCard 
        :accountAddress="accountAddress" 
        :ethBalance="balance" 
        :ppepeBalance="ppepeBalance"
        :pepeBalance="pepeBalance"
        :shibBalance="shibBalance"
        :rawPpepeBalance="rawPpepeBalance"
        :rawPepeBalance="rawPepeBalance"
        :rawPndcBalance="rawPndcBalance"
        :rawShibBalance="rawShibBalance"
        @connect="connectWallet" 
      />
      <div>
        <p class="text-yellow-300 font-nixie sm:text-xs md:text-sm cursor-pointer" 
          v-if="shortenedContractAddress"
          @mouseover="contractHovering = true"
          @mouseleave="contractHovering = false">
            <a :href="'https://etherscan.io/address/' + currentContractAddresses.ppepe" 
              target="_blank" rel="noopener noreferrer">
                {{ contractHovering ? 'Jump to Etherscan' : 'Contract: ' + shortenedContractAddress }}
            </a>
        </p>
      </div>
      <div v-if="accountAddress" class="flex flex-col items-center mt-5 font-nixie sm:items-start">
        <p class="text-yellow-300 font-thin sm:text-xs md:text-sm cursor-pointer"
          @click="disconnectWallet"
          @mouseover="hovering = true"
          @mouseleave="hovering = false">
          <span v-if="hovering">Disconnect Wallet</span>
          <span v-else>Address: {{ shortenedAddress }}</span>
        </p>
        <NotificationCard ref="notificationCard" />
        <div class="flex items-center mt-2 text-yellow-300 font-nixie sm:text-xs md:text-sm md:absolute md:bottom-5 md:left-5">
          <button @click="addToMetamask" class="hover:underline font-bold py-2 px-4 rounded">
            Add to Metamask
          </button>
        </div>
        <div v-if="networkName" class="flex items-center mt-2 text-yellow-300 font-extrabold sm:text-xs md:text-sm md:absolute md:bottom-5 md:right-5">
          <p :class="{ 'text-purple-400': networkName === 'Sepolia' }" class="mr-2">
            {{ networkName }}
          </p>
          <img v-if="networkIcon" 
               :src="networkIcon" 
               alt="Network Icon" 
               class="w-6 h-6">
        </div>
      </div>
      <div class="w-full text-center font-nixie mt-2 mb-2 text-xs">
        <a href="https://docs.starsystemlabs.com/the-tesseract-of-knowledge/star-system-labs/terms-of-use" class="text-yellow-300 hover:underline" target="_blank" rel="noopener noreferrer">Terms</a>
          <span class="mx-2 text-yellow-300">|</span>
        <a href="https://docs.starsystemlabs.com/the-tesseract-of-knowledge/star-system-labs/privacy-policy" class="text-yellow-300 hover:underline" target="_blank" rel="noopener noreferrer">Privacy</a>
      </div>
    </div>
  </div>
</template>

<script>
import { formatEther, Contract, BrowserProvider } from "ethers";
import NotificationCard from '@/components/NotificationCard.vue';
import MainCard from '@/components/MainCard.vue';


const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{
      "name": "_owner",
      "type": "address"
    }],
    "name": "balanceOf",
    "outputs": [{
      "name": "balance",
      "type": "uint256"
    }],
    "type": "function"
  }
];

export default {
  name: 'App',
  components: {
    MainCard,
    NotificationCard,
  },
  data() {
    return {
      rawPpepeBalance: null,
      rawPepeBalance: null,
      rawPndcBalance: null,
      rawShibBalance: null,
      accountAddress: null,
      balance: null,
      ppepeBalance: null,
      pepeBalance: null,
      shibBalance: null,
      networkName: null,
      networkIcon: null,
      contractAddresses: {
        mainnet: {
          pepe: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
          pond: '0x423f4e6138E475D85CF7Ea071AC92097Ed631eea',
          shib: '0x11541e990036ec13D521d584F098a83bD0F4BFC3',
          ppepe: '0x98830a6cc6f8964cec4ffd65f19edebba6fef865'
        },
        sepolia: {
          pepe: '0x27dF660eE7D634401A37de335946472B8928A10E',
          shib: '0xA0DB56d00465c2665acD333A848C5BDEF9D8FD19',
          ppepe: '0x2cD6B2b4f4D9fA59f8E9638c00F5902fD1d9afbc'
        }
      },
      currentContractAddresses: {
        pepe: null,
        pond: null,
        shib: null,
        ppepe: null
      },
      hovering: false,
      contractHovering: false,
    };
  },
  methods: {
    async addToMetamask() {
    try {
        if (typeof window.ethereum !== 'undefined') {
            const wasAdded = await window.ethereum.request({
                method: 'wallet_watchAsset',
                params: {
                    type: 'ERC20', 
                    options: {
                        address: '0x98830a6CC6f8964CeC4FFD65F19EDeBba6fEf865',
                        symbol: 'PPEPE', 
                        decimals: 18, 
                        image: 'https://raw.githubusercontent.com/mo0nkn1ght/assets/main/ppepe256.png',
                    },
                },
            });

            if (wasAdded) {
                console.log('PPEPE token was added!');
            } else {
                console.log('PPEPE token was not added.');
            }
          } else {
            console.error('Ethereum provider not detected');
          }
        } catch (error) {
          console.error('Error adding token to Metamask:', error);
        }
    },
    disconnectWallet() {
      this.accountAddress = null;
      this.balance = null;
      this.ppepeBalance = null;
      this.pepeBalance = null;
      this.shibBalance = null;
    },
    formatBalance(balance) {
      return parseFloat(balance).toFixed(2);
    },
    abbreviateNumber(value) {
      let newValue = parseFloat(value);
      if (newValue >= 1e12) {
        newValue /= 1e12;
        return newValue.toFixed(2) + "T";
      } else if (newValue >= 1e9) {
        newValue /= 1e9;
        return newValue.toFixed(2) + "B";
      } else if (newValue >= 1e6) {
        newValue /= 1e6;
        return newValue.toFixed(2) + "M";
      } else {
        return this.formatBalance(value);
      }
    },
    async getNetworkVersion() {
      if (window.ethereum) {
        const networkId = await window.ethereum.request({ method: 'net_version' });
        this.setNetwork(networkId);
      }
    },
    async connectWallet() {
      if (window.ethereum) {
        console.log("Connecting to wallet...");

        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          this.accountAddress = accounts[0];
          await this.getNetworkVersion();
          const provider = new BrowserProvider(window.ethereum);
          const weiBalance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [this.accountAddress, 'latest']
          });
          this.balance = this.formatBalance(formatEther(weiBalance));

          const pepeContract = new Contract(this.currentContractAddresses.pepe, ERC20_ABI, provider);
          try {
            const pepeTokenBalance = await pepeContract.balanceOf(this.accountAddress);
            console.log("Raw PEPE balance:", pepeTokenBalance.toString());
            this.pepeBalance = this.abbreviateNumber(formatEther(pepeTokenBalance));
          } catch (error) {
            console.error("Error fetching PEPE balance:", error);
            this.pepeBalance = "0";
          }


          const shibContract = new Contract(this.currentContractAddresses.shib, ERC20_ABI, provider);
          try {
            const shibTokenBalance = await shibContract.balanceOf(this.accountAddress);
            console.log("Raw SHIB balance:", shibTokenBalance.toString());
            this.shibBalance = this.abbreviateNumber(formatEther(shibTokenBalance));
          } catch (error) {
            console.error("Error fetching SHIB balance:", error);
            this.shibBalance = "0";
          }
          
          const ppepeContract = new Contract(this.currentContractAddresses.ppepe, ERC20_ABI, provider);
          try {
            const ppepeTokenBalance = await ppepeContract.balanceOf(this.accountAddress);
            console.log("Raw PPEPE balance:", ppepeTokenBalance.toString());
            this.ppepeBalance = this.abbreviateNumber(formatEther(ppepeTokenBalance));
          } catch (error) {
            console.error("Error fetching PPEPE balance:", error);
            this.ppepeBalance = "0";
          }

          const networkId = window.ethereum.networkVersion;
          this.setNetwork(networkId);


        } catch (error) {
          console.error("Error connecting to wallet:", error);
        }
      } else {
        console.error("Ethereum provider not detected");
      }

      window.ethereum.on('chainChanged', async (chainId) => {
        this.setNetwork(Number(chainId));
        await this.updateBalance();
      });


      window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
          console.log('Please connect to MetaMask.');
        } else {
          this.accountAddress = accounts[0];
          this.updateBalance();
        }
      });
    },

    async updateBalance() {
      const provider = new BrowserProvider(window.ethereum);

      const weiBalance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [this.accountAddress, 'latest']
      });
      this.balance = this.formatBalance(formatEther(weiBalance));
      console.log(`Updated Raw Balances: PPEPE: ${this.rawPpepeBalance}, PEPE: ${this.rawPepeBalance}, SHIB: ${this.rawShibBalance}`);
      
      const pepeContract = new Contract(this.currentContractAddresses.pepe, ERC20_ABI, provider);
      try {
        const pepeTokenBalance = await pepeContract.balanceOf(this.accountAddress);
        this.rawPepeBalance = formatEther(pepeTokenBalance);
        this.pepeBalance = this.abbreviateNumber(this.rawPepeBalance);
        console.log("Raw PEPE balance:", pepeTokenBalance.toString());
        //this.pepeBalance = this.formatBalance(formatEther(pepeTokenBalance));
      } catch (error) {
        console.error("Error fetching PEPE balance:", error);
        this.pepeBalance = "0";
      }

      const pndcContract = new Contract(this.currentContractAddresses.pndc, ERC20_ABI, provider);
      try {
        const pndcTokenBalance = await pndcContract.balanceOf(this.accountAddress);
        this.rawPndcBalance = formatEther(pndcTokenBalance);
        this.pndcBalance = this.abbreviateNumber(this.rawPndcBalance);
        console.log("Raw PNDC balance:", pndcTokenBalance.toString());
        this.pndcBalance = this.formatBalance(formatEther(pndcTokenBalance));
      } catch (error) {
        console.error("Error fetching PNDC balance:", error);
        this.pndcBalance = "0";
      }

      const shibContract = new Contract(this.currentContractAddresses.shib, ERC20_ABI, provider);
      try {
        const shibTokenBalance = await shibContract.balanceOf(this.accountAddress);
        this.rawShibBalance = formatEther(shibTokenBalance);
        this.shibBalance = this.abbreviateNumber(this.rawShibBalance);
        console.log("Raw SHIB balance:", shibTokenBalance.toString());
        this.shibBalance = this.formatBalance(formatEther(shibTokenBalance));
      } catch (error) {
        console.error("Error fetching SHIB balance:", error);
        this.shibBalance = "0";
      }

      const ppepeContract = new Contract(this.currentContractAddresses.ppepe, ERC20_ABI, provider);
      try {
        const ppepeTokenBalance = await ppepeContract.balanceOf(this.accountAddress);
        this.rawPpepeBalance = formatEther(ppepeTokenBalance);
        this.ppepeBalance = this.abbreviateNumber(this.rawPpepeBalance);
        console.log("Raw PPEPE balance:", ppepeTokenBalance.toString());
        this.ppepeBalance = this.formatBalance(formatEther(ppepeTokenBalance));
      } catch (error) {
        console.error("Error fetching PPEPE balance:", error);
        this.ppepeBalance = "0";
      }

    },

    setNetwork(chainId) {
      const networkIdStr = String(chainId);
      switch (networkIdStr) {
        case "1":
          this.networkName = "Connected:";
          this.networkIcon = require('@/assets/eth.png');
          this.currentContractAddresses = this.contractAddresses.mainnet;
          break;
        case "11155111":
          this.networkName = "Sepolia";
          this.networkIcon = require('@/assets/eth.png');
          this.currentContractAddresses = this.contractAddresses.sepolia;
          break;
        default:
          this.networkName = "Unknown Network";
          this.currentContractAddresses.pepe = null;
          this.currentContractAddresses.shib = null;
      }
    }
  },
  mounted() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          console.log('Please connect to MetaMask.');
          this.accountAddress = null;
        } else {
          this.accountAddress = accounts[0];
          this.updateBalance();
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        this.setNetwork(Number(chainId));
      });

      window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        if (accounts && accounts[0]) {
          console.log("Selected address found:", accounts[0]);
          this.accountAddress = accounts[0];
          this.connectWallet();
        } else {
          console.log("No selected address found");
        }
      });


      this.getNetworkVersion();
    }
  },
  computed: {
    shortenedAddress() {
      if (this.accountAddress) {
        return `${this.accountAddress.slice(0, 6)}...${this.accountAddress.slice(-4)}`;
      }
      return null;
    },
    shortenedContractAddress() {
      const contractAddress = this.currentContractAddresses.ppepe;
      if (contractAddress) {
        return `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`;
      }
      return null;
    }
  }
}
</script>

<style>
.z-negative {
  z-index: -1;
}
</style>