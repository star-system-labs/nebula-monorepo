<template>
  <div class="nebula-app relative text-center max-w-full mx-auto overflow-hidden" style="min-height: 600px; background-color: transparent; font-size: 16px;">
    <video autoplay muted loop playsinline id="backgroundVideo"
        class="absolute top-0 left-0 w-full h-full object-cover z-negative"
        @error="handleVideoError">
      <source :src="videoSrc" type="video/mp4">
        Video Not Supported.
    </video>
    
    <div class="main-container relative flex flex-col items-center justify-center min-h-screen">
      <MainCard 
        ref="mainCard"
        :accountAddress="accountAddress" 
        :ethBalance="balance" 
        :ppepeBalance="ppepeBalance"
        :pepeBalance="pepeBalance"
        :shibBalance="shibBalance"
        :pepelpBalance="pepelpBalance"
        :shiblpBalance="shiblpBalance"
        :ppepelpBalance="ppepelpBalance"
        :rawPpepeBalance="rawPpepeBalance"
        :rawPepeBalance="rawPepeBalance"
        :rawShibBalance="rawShibBalance"
        :abbreviatedPpepeBalance="abbreviatedPpepeBalance"
        :current-contract-addresses="currentContractAddresses"
        @connect="connectWallet" 
        @updateBalances="handleUpdateBalances"
      />
      <div>
        <p class="text-yellow-300 font-nixie sm:text-xs md:text-sm cursor-pointer" 
          v-if="shortenedContractAddress"
          @mouseover="contractHovering = true"
          @mouseleave="contractHovering = false">
            <!-- <a :href="'https://etherscan.io/address/' + currentContractAddresses.ppepe" 
              target="_blank" rel="noopener noreferrer">
                {{ contractHovering ? $t('message.jump') : $t('message.contract') + shortenedContractAddress }}
            </a> -->
        </p>
      </div>
      <div v-if="accountAddress" class="flex flex-col items-center mt-5 font-nixie sm:items-start">
        <p class="text-yellow-300 font-thin sm:text-xs md:text-sm cursor-pointer"
          @click="disconnectWallet"
          @mouseover="hovering = true"
          @mouseleave="hovering = false">
          <span v-if="hovering">{{ $t('message.disconnect') }}</span>
          <span v-else>{{ $t('message.address') }} {{ shortenedAddress }}</span>
        </p>
        <NotificationCard ref="notificationCard" />
        <div class="flex items-center mt-2 text-yellow-300 font-nixie sm:text-xs md:text-sm md:absolute md:bottom-5 md:left-5">
          <button @click="addToMetamask" class="hover:underline font-bold py-2 px-4 rounded">
           {{ $t('message.addmetamask') }}
          </button>
        </div>
        <div v-if="networkName" class="flex items-center mt-2 mr-4 text-yellow-300 font-extrabold sm:text-xs md:text-sm md:absolute md:bottom-5 md:right-5">
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
        <a href="https://docs.starsystemlabs.com/the-tesseract-of-knowledge/star-system-labs/terms-of-use" class="text-yellow-300 hover:underline" target="_blank" rel="noopener noreferrer">{{ $t('message.terms') }}</a>
          <span class="mx-2 text-yellow-300">|</span>
        <a href="https://docs.starsystemlabs.com/the-tesseract-of-knowledge/star-system-labs/privacy-policy" class="text-yellow-300 hover:underline" target="_blank" rel="noopener noreferrer">{{ $t('message.privacy') }}</a>
      </div>
      <!-- <button @click="toggleLanguage" class="text-yellow-300 font-nixie sm:text-xs md:text-sm">
        {{ $i18n.locale === 'en' ? '中文' : 'English' }}
      </button> -->
    </div>
  </div>
</template>

<script>
import { formatEther, Contract, BrowserProvider } from "ethers";
import NotificationCard from '@/components/NotificationCard.vue';
import MainCard from '@/components/MainCard.vue';
import { ethers } from 'ethers';

import widgetAnalytics from '@/utils/widgetAnalytics';
import realDataValidator from '@/utils/realDataValidator';
import liveDataTest from '@/utils/liveDataTest';

const getWidgetAnalytics = () => {
  console.log('🔧 Using unified analytics system');
  console.log('📊 Analytics source:', widgetAnalytics.getAnalyticsSource());
  
  return widgetAnalytics;
};

const analytics = getWidgetAnalytics();

console.log('🔧 Unified analytics system initialized', {
  analyticsType: analytics.constructor.name,
  endpoint: analytics.collector?.options?.endpoint,
  sessionId: analytics.sessionId,
  source: analytics.getAnalyticsSource(),
  currentURL: window.location.href,
  circuitBreakerState: analytics.widgetCircuitBreaker?.isOpen || false
});

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
      isWebComponent: !!window.isNebulaWebComponent,
      assetsBaseUrl: process.env.VUE_APP_ASSETS_BASE_URL || '',
      accountAddress: null,
      balance: null,
      rawPpepeBalance: null,
      rawPepeBalance: null,
      rawShibBalance: null,
      rawPepelpBalance: null,
      rawShiblpBalance: null,
      rawPpepelpBalance: null,
      ppepeBalance: null,
      pepeBalance: null,
      shibBalance: null,
      pepelpBalance: null,
      shiblpBalance: null,
      ppepelpBalance: null,
      abbreviatedPpepeBalance: null,
      networkName: null,
      networkIcon: null,
      contractAddresses: {
        mainnet: {
          pepe: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
          shib: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE',
          ppepe: '0x98830a6cc6f8964cec4ffd65f19edebba6fef865',
          pepelp: '0x45a8d3a8bfa5b1ec496508d738f5b9e3bd2cb86d',
          shiblp: '0xa43fe16908251ee70ef74718545e4fe6c5ccec9f',
          ppepelp: '0xbef860db27fc2f9668d13d624563d859c65a2b25',
        },
        sepolia: {
          pepe: '0xf73BBA852bb30553326fA837f091aB7Ce740D0a9',
          shib: '0x46cB0AfFA874719c7b273Df80954CC98199e2d69',
          ppepe: '0xB6Ad6AD0364Eb5E8B109a55F01F4F68971B40E2B',
          pepelp: '0xB08eAC861c0FD07e74c3Bc6FBABe309e1F82afE5',
          shiblp: '0x5e29a016b9d79ef38Cc66B3E58A08af80b26FB91',
          ppepelp: '0xE763297d736b73d7e37809513B7399D1F66443Ed',
        },
        base_sepolia: {
          pepe: '0xf73BBA852bb30553326fA837f091aB7Ce740D0a9',
          shib: '0x46cB0AfFA874719c7b273Df80954CC98199e2d69',
          ppepe: '0xB6Ad6AD0364Eb5E8B109a55F01F4F68971B40E2B',
          pepelp: '0xB08eAC861c0FD07e74c3Bc6FBABe309e1F82afE5',
          shiblp: '0x5e29a016b9d79ef38Cc66B3E58A08af80b26FB91',
          ppepelp: '0xE763297d736b73d7e37809513B7399D1F66443Ed',
        }
      },
      currentContractAddresses: {
        pepe: null,
        shib: null,
        ppepe: null,
        pepelp: null,
        shiblp: null,
        ppepelp: null,
      },
      hovering: false,
      contractHovering: false,
    };
  },
  methods: {
    toggleLanguage() {
      this.$i18n.locale = this.$i18n.locale === 'en' ? 'cn' : 'en';
    },
    async fetchPpepeBalance() {
      if (this.accountAddress) {
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          provider.on('block', () => {
            this.updateBalance();
          });
        }
        const newBalance = await this.updateBalance();
        this.ppepeBalance = newBalance;
      } else {
        console.log('Please connect your wallet to fetch PPEPE balance.');
      }
    },
    subscribeToNewBlocks() {
      if (this.accountAddress) {
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          provider.on('block', async () => {
            await this.fetchPpepeBalance();
            await this.updateBalance();
          });
        } else {
          console.log('Please connect your wallet to subscribe to new blocks.');
        }
      } else {
        console.log('Please connect your wallet to subscribe to new blocks.');
      }
    },
    handleUpdateBalances(newBalances) {
      this.ppepeBalance = newBalances.ppepe || this.ppepeBalance;
      this.pepeBalance = newBalances.pepe || this.pepeBalance;
      this.shibBalance = newBalances.shib || this.shibBalance;
      this.pepelpBalance = newBalances.pepelp || this.pepelpBalance;
      //console.log("!!!!!!!!!!!!!!!", newBalances.pepelpBalance);
      this.shiblpBalance = newBalances.shiblp || this.shiblpBalance;
      //console.log("!!!!!!!!!!!!!!!", newBalances.shiblpBalance);
      this.ppepelpBalance = newBalances.ppepelp || this.ppepelpBalance;
      //console.log("!!!!!!!!!!!!!!!", newBalances.ppepelpBalance);
    },
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
                        image: 'https://raw.githubusercontent.com/mo0nkn1ght/assets/main/ppepe256.png', //TODO
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
      this.ppepelpBalance = null;
      this.pepelpBalance = null;
      this.shiblpBalance = null;
    },
    formatBalance(balance) {
      return parseFloat(balance).toFixed(2);
    },
    abbreviateNumber(value) {
      if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) {
        return '0.00';
      }
      
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
      } else if (newValue >= 1e3) {
        newValue /= 1e3;
        return newValue.toFixed(2) + "K";
      } else {
        return newValue.toFixed(2);
      }
    },
    async getNetworkVersion() {
      if (window.ethereum) {
        try {
          const networkId = await window.ethereum.request({ 
            method: 'net_version'
          });
          this.setNetwork(networkId);
        } catch (error) {
          console.error('Error getting network version:', error);
        }
      }
    },
    async connectWallet() {
      if (window.ethereum) {
        console.log("Connecting to wallet...");

        try {
          const startTime = performance.now();
          const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const connectTime = performance.now() - startTime;
          
          this.accountAddress = account;
          
          console.log('🔗 Tracking successful wallet connection', {
            analytics: analytics.constructor.name,
            endpoint: analytics.collector?.options?.endpoint,
            sessionId: analytics.sessionId
          });
          
          analytics.trackWalletConnect(true, 'metamask', null);
          analytics.trackCustom('wallet_connect_timing', {
            connectTime,
            walletType: 'metamask',
            accountAddress: this.accountAddress,
            sessionId: analytics.sessionId
          });
          
          console.log('✅ Wallet connection tracking completed');
          
          await this.getNetworkVersion();
          const provider = new BrowserProvider(window.ethereum);
          const weiBalance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [this.accountAddress, 'latest']
          });
          this.balance = this.formatBalance(formatEther(weiBalance));

          if (this.currentContractAddresses.pepe) {
          const pepeContract = new Contract(this.currentContractAddresses.pepe, ERC20_ABI, provider);
          try {
            //console.log("Contract address:", this.currentContractAddresses.pepe);
            const pepeTokenBalance = await pepeContract.balanceOf(this.accountAddress);
            this.rawPepeBalance = formatEther(pepeTokenBalance);
            this.pepeBalance = this.abbreviateNumber(this.rawPepeBalance);
            // console.log("PEPE Token balance:", pepeTokenBalance.toString());
            // console.log("Raw Balance:", this.rawPepeBalance.toString());
            // console.log("Pepe Balance:", this.pepeBalance.toString());
            this.pepeBalance = this.formatBalance(formatEther(pepeTokenBalance));
          } catch (error) {
            console.error("Error fetching PEPE balance:", error);
            this.pepeBalance = "0";
          }
          } else {
          console.error("PEPE contract address is null");
          this.pepeBalance = "0";
          }

          if (this.currentContractAddresses.pepelp) {
          const pepelpContract = new Contract(this.currentContractAddresses.pepelp, ERC20_ABI, provider);
          try {
            //console.log("Contract address:", this.currentContractAddresses.pepe);
            const pepelpTokenBalance = await pepelpContract.balanceOf(this.accountAddress);
            this.rawPepelpBalance = formatEther(pepelpTokenBalance);
            this.pepelpBalance = this.abbreviateNumber(this.rawPepelpBalance);
            // console.log("PEPE LP Token balance:", pepelpTokenBalance.toString());
            // console.log("Raw Balance:", this.rawPepelpBalance.toString());
            // console.log("Pepe LP Balance:", this.pepelpBalance.toString());
            this.pepelpBalance = this.formatBalance(formatEther(pepelpTokenBalance));
          } catch (error) {
            console.error("Error fetching PEPE LP balance:", error);
            this.pepelpBalance = "0";
          }
          } else {
          console.error("PEPE LP contract address is null");
          this.pepelpBalance = "0";
          }

          if (this.currentContractAddresses.shib) {
          const shibContract = new Contract(this.currentContractAddresses.shib, ERC20_ABI, provider);
          try {
            const shibTokenBalance = await shibContract.balanceOf(this.accountAddress);
            this.rawShibBalance = formatEther(shibTokenBalance);
            this.shibBalance = this.abbreviateNumber(this.rawShibBalance);
            // console.log("SHIB Token balance:", shibTokenBalance.toString());
            // console.log("Raw Balance:", this.rawShibBalance.toString());
            // console.log("Shib Balance:", this.shibBalance.toString());
            this.shibBalance = this.formatBalance(formatEther(shibTokenBalance));
          } catch (error) {
            console.error("Error fetching SHIB balance:", error);
            this.shibBalance = "0";
          }
          } else {
            console.error("SHIB contract address is null");
            this.shibBalance = "0";
          }

          if (this.currentContractAddresses.shiblp) {
          const shiblpContract = new Contract(this.currentContractAddresses.shiblp, ERC20_ABI, provider);
          try {
            const shiblpTokenBalance = await shiblpContract.balanceOf(this.accountAddress);
            this.rawShiblpBalance = formatEther(shiblpTokenBalance);
            this.shiblpBalance = this.abbreviateNumber(this.rawShiblpBalance);
            console.log("SHIB LP Token balance:", shiblpTokenBalance.toString(), shiblpContract.balanceOf(this.accountAddress));
            // console.log("Raw Balance:", this.rawShibBalance.toString());
            // console.log("Shib LP Balance:", this.shiblpBalance.toString());
            this.shiblpBalance = this.formatBalance(formatEther(shiblpTokenBalance));
          } catch (error) {
            console.error("Error fetching SHIB LP balance:", error);
            this.shiblpBalance = "0";
          }
          } else {
            console.error("SHIB LP contract address is null");
            this.shiblpBalance = "0";
          }


          if (this.currentContractAddresses.ppepe) {
          const ppepeContract = new Contract(this.currentContractAddresses.ppepe, ERC20_ABI, provider);
          try {
            const ppepeTokenBalance = await ppepeContract.balanceOf(this.accountAddress);
            this.rawPpepeBalance = formatEther(ppepeTokenBalance);
            this.ppepeBalance = this.abbreviateNumber(this.rawPpepeBalance);
            // console.log("PPEPE Token balance:", ppepeTokenBalance.toString());
            // console.log("Raw Balance:", this.rawPpepeBalance.toString());
            // console.log("Ppepe Balance:", this.ppepeBalance.toString());
            this.ppepeBalance = this.formatBalance(formatEther(ppepeTokenBalance));
            this.abbreviatedPpepeBalance = this.abbreviateNumber(this.rawPpepeBalance);
            //console.log('Abbreviated Balance:', this.abbreviatedPpepeBalance);
          } catch (error) {
            console.error("Error fetching PPEPE balance:", error);
            this.ppepeBalance = "0";
          }
          } else {
            console.error("PPEPE   contract address is null");
            this.ppepeBalance = "0";
          }

          if (this.currentContractAddresses.ppepelp) {
          const ppepelpContract = new Contract(this.currentContractAddresses.ppepelp, ERC20_ABI, provider);
          try {
            const ppepelpTokenBalance = await ppepelpContract.balanceOf(this.accountAddress);
            this.rawPpepelpBalance = formatEther(ppepelpTokenBalance);
            this.ppepelpBalance = this.abbreviateNumber(this.rawPpepelpBalance);
            // console.log("PPEPE LP Token balance:", ppepelpTokenBalance.toString());
            // console.log("Raw Balance:", this.rawPpepeBalance.toString());
            // console.log("Ppepe LP Balance:", this.ppepelpBalance.toString());
            this.ppepelpBalance = this.formatBalance(formatEther(ppepelpTokenBalance));
            this.abbreviatedPpepelpBalance = this.abbreviateNumber(this.rawPpepelpBalance);
            //console.log('Abbreviated Balance:', this.abbreviatedPpepeBalance);
          } catch (error) {
            console.error("Error fetching PPEPE LP balance:", error);
            this.ppepelpBalance = "0";
          }
          } else {
            console.error("PPEPE   contract address is null");
            this.ppepeBalance = "0";
          }

          const networkId = await window.ethereum.request({ method: 'net_version' });
          this.setNetwork(networkId);


        } catch (error) {
          console.error("Error connecting to wallet:", error);
          
          console.log('❌ Tracking failed wallet connection', {
            analytics: analytics.constructor.name,
            endpoint: analytics.collector?.options?.endpoint,
            error: error.message,
            sessionId: analytics.sessionId
          });
          
          analytics.trackWalletConnect(false, 'metamask', error);
          analytics.trackCustom('wallet_connect_error', {
            error: error.message,
            errorCode: error.code,
            walletType: 'metamask',
            sessionId: analytics.sessionId
          });
          
          console.log('✅ Failed wallet connection tracking completed');
        }
      } else {
        console.error("Ethereum provider not detected");
        
        analytics.trackCustom('wallet_not_available', {
          requestedWallet: 'metamask',
          userAgent: navigator.userAgent,
          sessionId: analytics.sessionId
        });
        analytics.trackWalletConnect(false, 'none', new Error('No Ethereum provider'));
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
      if (this.accountAddress) {
        const provider = new BrowserProvider(window.ethereum);

        const weiBalance = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [this.accountAddress, 'latest']
        });
        this.balance = this.formatBalance(formatEther(weiBalance));
        //console.log(`Updated Raw Balances: PPEPE: ${this.rawPpepeBalance}, PEPE: ${this.rawPepeBalance}, SHIB: ${this.rawShibBalance}`);
        
        if (this.currentContractAddresses.pepe) {
            const pepeContract = new Contract(this.currentContractAddresses.pepe, ERC20_ABI, provider);
            try {
              //console.log("Contract address:", this.currentContractAddresses.pepe);
              const pepeTokenBalance = await pepeContract.balanceOf(this.accountAddress);
              this.rawPepeBalance = formatEther(pepeTokenBalance);
              this.pepeBalance = this.abbreviateNumber(this.rawPepeBalance);
              // console.log("PEPE Token balance:", pepeTokenBalance.toString());
              // console.log("Raw Balance:", this.rawPepeBalance.toString());
              // console.log("Pepe Balance:", this.pepeBalance.toString());
              this.pepeBalance = this.formatBalance(formatEther(pepeTokenBalance));
            } catch (error) {
              console.error("Error fetching PEPE balance:", error);
              this.pepeBalance = "0";
            }
            } else {
            console.error("PEPE contract address is null");
            this.pepeBalance = "0";
            }

            if (this.currentContractAddresses.pepelp) {
            const pepelpContract = new Contract(this.currentContractAddresses.pepelp, ERC20_ABI, provider);
            try {
              //console.log("Contract address:", this.currentContractAddresses.pepe);
              const pepelpTokenBalance = await pepelpContract.balanceOf(this.accountAddress);
              this.rawPepelpBalance = formatEther(pepelpTokenBalance);
              this.pepelpBalance = this.abbreviateNumber(this.rawPepelpBalance);
              // console.log("PEPE LP Token balance:", pepelpTokenBalance.toString());
              // console.log("Raw Balance:", this.rawPepelpBalance.toString());
              // console.log("Pepe LP Balance:", this.pepelpBalance.toString());
              this.pepelpBalance = this.formatBalance(formatEther(pepelpTokenBalance));
            } catch (error) {
              console.error("Error fetching PEPE LP balance:", error);
              this.pepelpBalance = "0";
            }
            } else {
            console.error("PEPE LP contract address is null");
            this.pepelpBalance = "0";
            }

            if (this.currentContractAddresses.shib) {
            const shibContract = new Contract(this.currentContractAddresses.shib, ERC20_ABI, provider);
            try {
              const shibTokenBalance = await shibContract.balanceOf(this.accountAddress);
              this.rawShibBalance = formatEther(shibTokenBalance);
              this.shibBalance = this.abbreviateNumber(this.rawShibBalance);
              // console.log("SHIB Token balance:", shibTokenBalance.toString());
              // console.log("Raw Balance:", this.rawShibBalance.toString());
              // console.log("Shib Balance:", this.shibBalance.toString());
              this.shibBalance = this.formatBalance(formatEther(shibTokenBalance));
            } catch (error) {
              console.error("Error fetching SHIB balance:", error);
              this.shibBalance = "0";
            }
            } else {
              console.error("SHIB contract address is null");
              this.shibBalance = "0";
            }

            if (this.currentContractAddresses.shiblp) {
            const shiblpContract = new Contract(this.currentContractAddresses.shiblp, ERC20_ABI, provider);
            try {
              const shiblpTokenBalance = await shiblpContract.balanceOf(this.accountAddress);
              this.rawShiblpBalance = formatEther(shiblpTokenBalance);
              this.shiblpBalance = this.abbreviateNumber(this.rawShiblpBalance);
              // console.log("SHIB LP Token balance:", shiblpTokenBalance.toString());
              // console.log("Raw Balance:", this.rawShibBalance.toString());
              // console.log("Shib LP Balance:", this.shiblpBalance.toString());
              this.shiblpBalance = this.formatBalance(formatEther(shiblpTokenBalance));
            } catch (error) {
              console.error("Error fetching SHIB LP balance:", error);
              this.shiblpBalance = "0";
            }
            } else {
              console.error("SHIB LP contract address is null");
              this.shiblpBalance = "0";
            }


            if (this.currentContractAddresses.ppepe) {
            const ppepeContract = new Contract(this.currentContractAddresses.ppepe, ERC20_ABI, provider);
            try {
              const ppepeTokenBalance = await ppepeContract.balanceOf(this.accountAddress);
              this.rawPpepeBalance = formatEther(ppepeTokenBalance);
              this.ppepeBalance = this.abbreviateNumber(this.rawPpepeBalance);
              // console.log("PPEPE Token balance:", ppepeTokenBalance.toString());
              // console.log("Raw Balance:", this.rawPpepeBalance.toString());
              // console.log("Ppepe Balance:", this.ppepeBalance.toString());
              this.ppepeBalance = this.formatBalance(formatEther(ppepeTokenBalance));
              this.abbreviatedPpepeBalance = this.abbreviateNumber(this.rawPpepeBalance);
              //console.log('Abbreviated Balance:', this.abbreviatedPpepeBalance);
            } catch (error) {
              console.error("Error fetching PPEPE balance:", error);
              this.ppepeBalance = "0";
            }
            } else {
              console.error("PPEPE   contract address is null");
              this.ppepeBalance = "0";
            }

            if (this.currentContractAddresses.ppepelp) {
            const ppepelpContract = new Contract(this.currentContractAddresses.ppepelp, ERC20_ABI, provider);
            try {
              const ppepelpTokenBalance = await ppepelpContract.balanceOf(this.accountAddress);
              this.rawPpepelpBalance = formatEther(ppepelpTokenBalance);
              this.ppepelpBalance = this.abbreviateNumber(this.rawPpepelpBalance);
              // console.log("PPEPE LP Token balance:", ppepelpTokenBalance.toString());
              // console.log("Raw Balance:", this.rawPpepeBalance.toString());
              // console.log("Ppepe LP Balance:", this.ppepelpBalance.toString());
              this.ppepelpBalance = this.formatBalance(formatEther(ppepelpTokenBalance));
              this.abbreviatedPpepelpBalance = this.abbreviateNumber(this.rawPpepelpBalance);
              //console.log('Abbreviated Balance:', this.abbreviatedPpepeBalance);
            } catch (error) {
              console.error("Error fetching PPEPE LP balance:", error);
              this.ppepelpBalance = "0";
            }
            } else {
              console.error("PPEPE LP contract address is null");
              this.ppepelpBalance = "0";
            }
      } else {
        console.log('Please connect your wallet.');
      }
    },
    setNetwork(chainId) {
      const networkIdStr = String(chainId);
      switch (networkIdStr) {
        case "1":
          this.networkName = " ";
          this.networkIcon = require('@/assets/eth.webp');
          this.currentContractAddresses = this.contractAddresses.mainnet;
          break;
        case "11155111":
          this.networkName = " ";
          this.networkIcon = require('@/assets/sepolia.webp');
          this.currentContractAddresses = this.contractAddresses.sepolia;
          break;
        case "8453":
          this.networkName = " ";
          //this.networkIcon = require('@/assets/base.webp');
          this.currentContractAddresses = this.contractAddresses.base;
          break;
        case "84531":
          this.networkName = "";
          //this.networkIcon = require('@/assets/base_sepolia.webp');
          this.currentContractAddresses = this.contractAddresses.base_sepolia;
          break;
        default:
          this.networkName = "Unknown Network";
          this.currentContractAddresses.pepe = null;
          this.currentContractAddresses.shib = null;
      }
    },
    handleVideoError(event) {
      console.error('Video loading error:', event);
      console.warn('POC.mp4 failed to load from:', this.videoSrc);
      
      if (analytics && analytics.trackCustom) {
        analytics.trackCustom('video_load_error', {
          videoSrc: this.videoSrc,
          isWebComponent: this.isWebComponent,
          error: event.target?.error?.message || 'Unknown video error'
        });
      }
      
      const videoElement = event.target;
      if (videoElement) {
        videoElement.style.display = 'none';
      }
    }
  },
  mounted() {
    console.log("App mounted, loading complete");
    
    const mountStartTime = performance.now();
    
    analytics.trackRenderStage('start', mountStartTime - analytics.loadStartTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Initializing Real Data Validator...');
      window.realDataValidator = realDataValidator;
      window.liveDataTest = liveDataTest;
      
      setTimeout(() => {
        realDataValidator.runComprehensiveValidation();
      }, 3000);
      
      setTimeout(() => {
        liveDataTest.runComprehensiveTests();
      }, 8000);
    }
    
    analytics.trackLoadComplete();
    
    this.$nextTick(() => {
      const domReadyTime = performance.now();
      analytics.trackRenderStage('dom_ready', domReadyTime - analytics.loadStartTime);
      
      const componentStartTime = performance.now();
      
      const mainCardComponent = this.$refs.mainCard || this.$children.find(c => c.$options.name === 'MainCard');
      if (mainCardComponent) {
        const mainCardRenderTime = performance.now() - componentStartTime;
        analytics.trackComponentRender('MainCard', mainCardRenderTime, mainCardComponent.$props || {});
      }
      
      const notificationComponent = this.$refs.notificationCard;
      if (notificationComponent) {
        const notificationRenderTime = performance.now() - componentStartTime;
        analytics.trackComponentRender('NotificationCard', notificationRenderTime, notificationComponent.$props || {});
      }
      
      const finalRenderTime = performance.now();
      analytics.trackRenderStage('complete', finalRenderTime - analytics.loadStartTime);
      analytics.trackRenderComplete();
      
      if (performance.getEntriesByType) {
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          if (entry.name === 'first-paint') {
            analytics.trackRenderStage('first_paint', entry.startTime);
          } else if (entry.name === 'first-contentful-paint') {
            analytics.trackRenderStage('first_contentful_paint', entry.startTime);
          }
        });
      }
      
      console.log('✅ Enhanced widget analytics tracking completed', {
        loadTime: finalRenderTime - analytics.loadStartTime,
        renderStages: analytics.renderStages.size,
        componentCount: analytics.componentRenderTimes.size
      });
    });
    
    window.addEventListener('error', (event) => {
      analytics.trackCustom('widget_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack,
        loadAttemptId: analytics.loadAttemptId,
        sessionId: analytics.sessionId
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      analytics.trackCustom('unhandled_rejection', {
        reason: event.reason?.message || event.reason,
        promise: event.promise,
        loadAttemptId: analytics.loadAttemptId,
        sessionId: analytics.sessionId
      });
    });

    if (this.accountAddress) {
      this.subscribeToNewBlocks();
    } else {
      console.log('Please connect your wallet to enable real-time updates.');
    }
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
  created() {
    analytics.trackCustom('widget_init', {
      isWebComponent: this.isWebComponent,
      locale: this.$i18n.locale,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });
  },
  beforeUnmount() {
    analytics.flush();
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
    },
    videoSrc() {
      if (this.isWebComponent) {
        return `${window.location.origin}/media/POC.mp4`;
      } else {
        try {
          return require('@/assets/POC.mp4');
        } catch (error) {
          console.warn('POC.mp4 not found in assets, falling back to absolute media path');
          return `${window.location.origin}/media/POC.mp4`;
        }
      }
    }
  }
}
</script>

<style>
.z-negative {
  z-index: -1;
}

.nebula-app {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  color: #fff;
}

:root:not(.web-component-mode) .nebula-app {
  background-color: #000;
}

@import './tailwind.css';
@import './assets/main.css';
</style>