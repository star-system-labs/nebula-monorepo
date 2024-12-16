<script setup>
import { RouterLink, RouterView } from 'vue-router'
import '@/assets/tailwind.css';
import Title from './components/Title.vue'
import { ref, onMounted, onUnmounted, computed } from 'vue';
import MinerReport from './components/MinerReport.vue'
import Login from './components/Login.vue'
import ApexCharts from 'vue3-apexcharts';
import balanceGrowthData from './assets/balance_growth.json';

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
  totalETHReceived: '4,970.2335 ETH',
  totalTransactions: '14,492',
  ethReceivedUSD: '$19,481,278.07'
});

const chartOptions = ref({
  chart: {
    type: 'line',
    height: 220,
    toolbar: { show: false },
    animations: { enabled: true },
    zoom: { enabled: false },
  },
  title: {
    text: 'ETH Generated',
    align: 'center',
    style: {
      fontSize: '14px',
      fontFamily: 'NixieOne, nixieone',
      color: '#FFD700',
    },
    responsive: [{
      breakpoint: 480,
      options: {
        title: {
          style: {
            fontSize: '12px'
          }
        }
      }
    }]
  },
  xaxis: {
    type: 'datetime',
    min: new Date('2023-07-28').getTime(),
    max: new Date('2023-08-15').getTime(),
    title: {
      text: 'Time',
      style: { color: '#FFD700', fontFamily: 'NixieOne, nixieone' },
    },
    labels: {
      style: { colors: '#FFD700', fontFamily: 'NixieOne, nixieone' },
    },
  },
  yaxis: {
    title: {
      text: 'Balance (ETH)',
      style: { color: '#FFD700', fontFamily: 'NixieOne, nixieone' },
    },
    labels: {
      formatter: (value) => value.toFixed(2),
      style: { colors: '#FFD700', fontFamily: 'NixieOne, nixieone' },
    },
  },
  tooltip: {
    theme: 'dark',
    fillSeriesColor: false,
    style: {
      fontSize: '12px',
      fontFamily: 'NixieOne, nixieone',
    },
    x: {
      show: true,
      format: 'dd MMM yyyy HH:mm',
      formatter: undefined,
    },
    y: {
      show: true,
      title: {
        formatter: (seriesName) => seriesName,
      },
      formatter: (value) => `${value.toFixed(4)} ETH`,
    },
    marker: {
      show: true,
    },
    fixed: {
      enabled: true,
      position: 'topRight',
      offsetX: 0,
      offsetY: -30,
    },
  },
  stroke: { curve: 'smooth', width: 2 },
  colors: ['#0645a6'],
});

const chartSeries = ref([
  {
    name: 'Balance',
    data: balanceGrowthData
      .filter((_, index) => index % 15 === 0)
      .map((item) => {
        const timestamp = item.timestamp * 1000;
        const balance = Number(item.y) / 1e18;
        return [timestamp, balance];
      })
      .filter(([timestamp]) => timestamp <= new Date('2023-08-15').getTime()),
  },
]);

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

const isZoomedIn = ref(false);

const toggleZoom = () => {
  isZoomedIn.value = !isZoomedIn.value;
  updateChartRange();
};

const updateChartRange = () => {
  chartOptions.value = {
    ...chartOptions.value,
    xaxis: {
      ...chartOptions.value.xaxis,
      min: new Date('2023-07-28').getTime(),
      max: isZoomedIn.value 
        ? new Date('2023-07-30').getTime()
        : new Date('2023-08-15').getTime(),
    }
  };
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
            <h3 class="font-origin text-yellow-300 text-sm md:text-base mb-4">
              Example of a Miner run by a Pond Dex - ~$20 Million USD generated.
            </h3>
            
            <div class="flex flex-col md:flex-row mb-6">
              <div class="md:w-1/2">
                <MinerReport :report-data="minerReportData" />
                <div class="flex justify-center mt-4 md:justify-start">
                  <a href="https://etherscan.io/address/0xe0e907e3743715294c2a5f52618d278cbc006ced" 
                     class="inline-block bg-yellow-300 font-nixie text-black font-bold px-4 py-2 mb-5 rounded-lg hover:scale-105 transition-transform">
                    View on Etherscan
                  </a>
                </div>
              </div>
              <div class="md:w-1/2">
                <apexchart type="line" :options="chartOptions" :series="chartSeries" height="220"></apexchart>
                <div class="flex justify-center mt-4">
                  <button @click="toggleZoom" 
                          class="bg-yellow-300 font-nixie text-black font-bold px-4 py-2 rounded-lg hover:scale-105 hover:shadow-lg transition-transform hover-effect">
                    {{ isZoomedIn ? 'Zoom Out' : 'Zoom In' }}
                  </button>
                </div>
              </div>
            </div>

            <hr class="border-t border-custom-blue my-6">

            <div class="text-teal font-nixie">
              <p class="mb-4 font-bold text-center md:text-left">PrimordialPePe LP is 100% burned - Market Liquidity is 100% safe</p>
              <div class="flex justify-center md:justify-start">
                <a href="https://etherscan.io/tx/0x006151516eb21126db8ae98e8e02159e80423ff2a2aa31e6c766637c487f2b3f" 
                   class="text-yellow-300 font-nixie hover:underline">
                  Verify on Etherscan
                </a>
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
