<script setup>
import { RouterLink, RouterView } from 'vue-router'
import '@/assets/tailwind.css';
import Title from './components/Title.vue'
import { ref, onMounted, onUnmounted, computed } from 'vue';
import MinerReport from './components/MinerReport.vue'
import Login from './components/Login.vue'

const quickLinks = [
    // { name: 'Website', url: 'https://starsystemlabs.com' },
    // { name: 'Documentation', url: 'https://docs.starsystemlabs.com' },
    // { name: 'Whitepaper', url: 'https://github.com/star-system-labs/whitepaper/blob/main/Star-System-Labs-Whitepaper.pdf' },
    { name: 'Nebula', url: 'https://nebula.starsystemlabs.com' },
    { name: 'GitHub', url: 'https://github.com/star-system-labs' },
    { name: 'X', url: 'https://x.com/StarSystem_Labs' },
    { name: 'Telegram', url: 'https://t.me/starsystemlabs' },
    { name: 'Discord', url: 'https://discord.com/invite/kH8B5SCSgy' },
    { name: 'LinkTree', url: 'https://linktr.ee/starsystemlabs' }
  ]

const showScrollToTop = ref(false);

const handleScroll = () => {
  const bottom = Math.ceil(window.innerHeight + window.pageYOffset) >= document.documentElement.scrollHeight;
  showScrollToTop.value = bottom;
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const minerReportData = ref({
  "Total ETH Received": 0,
  "Total ETH Sent": 0,
  "Total Gas Paid (ETH)": 0,
  "Total Transactions": 0,
  "Total ETH Received (USD)": 0,
  "Total ETH Sent (USD)": 0,
  "Total Gas Paid (USD)": 0,
});

// const chartOptions = ref({
//   chart: {
//     height: 220,
//     type: 'radialBar',
//     animations: {
//       enabled: true,
//       speed: 800,
//       animateGradually: {
//         enabled: true,
//         delay: 150
//       }
//     },
//     dropShadow: {
//       enabled: true,
//       blur: 3,
//       opacity: 0.2
//     }
//   },
//   plotOptions: {
//     radialBar: {
//       hollow: {
//         size: '55%',
//         background: 'transparent'
//       },
//       track: {
//         background: '#182233',
//         strokeWidth: '97%',
//         margin: 5
//       },
//       dataLabels: {
//         name: {
//           color: '#FFD700'
//         },
//         value: {
//           color: '#5d9fa5'
//         }
//       }
//     }
//   },
//   labels: ['Burn Rate'],
//   tooltip: {
//     enabled: true,
//     style: {
//       fontFamily: 'NixieOne, nixieone'
//     },
//     y: {
//       formatter: () => '100% LP Tokens forever burned'
//     }
//   },
//   colors: ['#0645a6'],
//   stroke: {
//     lineCap: 'round',
//     width: 2
//   },
//   label: {
//     colors: ['#007BFF'],
//     style: {
//       fontSize: '16px',
//       fontWeight: 'bold',
//       fontFamily: 'NixieOne, nixieone'
//     }
//   }
// });

// const chartSeries = ref([100]);

const isAuthenticated = ref(localStorage.getItem('authenticated') === 'true');
let logoutTimer = null;

const onLoginSuccess = () => {
  isAuthenticated.value = true;
  startLogoutTimer();
};

const logout = () => {
  isAuthenticated.value = false;
  localStorage.removeItem('authenticated');
  clearLogoutTimer();
};

const startLogoutTimer = () => {
  clearLogoutTimer();
  logoutTimer = setTimeout(() => {
    logout();
  }, 5 * 60 * 1000);
};

const clearLogoutTimer = () => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('beforeunload', logout);
  if (isAuthenticated.value) {
    startLogoutTimer();
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('beforeunload', logout);
  clearLogoutTimer();
});
</script>

<template>  
    <video autoplay loop muted playsinline id="backgroundVideo"
           class="fixed top-0 left-0 min-w-full min-h-full w-auto h-auto object-cover -z-10">
      <source src="./assets/POC.mp4" type="video/mp4">
      Video Not Supported.
    </video>

    <header class="relative z-10 flex items-start justify-center min-h-screen pt-5 mr-0 sm:mr-10">
      <div class="mx-auto">
        <div class="items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-80 p-5 rounded-xl">
          <div class="wrapper font-origin font-bold">
            <Title msg="Star System Labs" />
          </div>
        </div>
        
        <template v-if="isAuthenticated">
          <section class="mt-8 grid grid-cols-3 gap-4">
            <a v-for="link in quickLinks" :key="link.name" :href="link.url" 
               class="p-4 bg-card-blue bg-opacity-75 border-2 border-custom-blue rounded-lg hover:shadow-lg text-white flex items-center justify-center">
              <h3 class="font-origin text-yellow-300 text-xs sm:text-sm md:text-base text-center">{{ link.name }}</h3>
            </a>
          </section>

          <div class="mt-8 bg-card-blue bg-opacity-85 p-5 rounded-xl border-1 border-custom-blue">
            <h3 class="font-origin text-yellow-300 text-sm md:text-base mb-4">Example of Miner run by a project called Pond - $20 Million USD</h3>
            
            <MinerReport :report-data="minerReportData" class="mb-6" />

            <a href="https://etherscan.io/address/0xe0e907e3743715294c2a5f52618d278cbc006ced" 
               class="inline-block bg-yellow-300 font-nixie text-black font-bold px-4 py-2 rounded-lg hover:scale-105 transition-transform mb-6">
              View on Etherscan
            </a>

            <hr class="border-t border-custom-blue my-6">

            <div class="text-teal font-nixie">
              <p class="mb-4 font-bold">PrimordialPePe LP is 100% burned - Market Liquidity is 100% safe</p>
              <div class="flex items-center justify-between mb-4">
                <a href="https://etherscan.io/tx/0x006151516eb21126db8ae98e8e02159e80423ff2a2aa31e6c766637c487f2b3f" 
                   class="text-yellow-300 font-nixie hover:underline">
                  Verify on Etherscan
                </a>
                <!-- <div class="w-32">
                  <apexchart type="radialBar" :options="chartOptions" :series="chartSeries"></apexchart>
                </div> -->
              </div>
            </div>
          </div>
        </template>
      </div>
    </header>

    <div class="relative z-10">
      <RouterView v-if="isAuthenticated" />
      <Login v-else @login-success="onLoginSuccess" />
    </div>

    <button v-show="showScrollToTop" @click="scrollToTop" 
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-300 text-black p-2 rounded-full shadow-md transition-transform duration-300 ease-in-out hover:scale-110 z-50">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
</template>

<style>
#app {
  min-height: 100vh;
  position: relative;
}
</style>
