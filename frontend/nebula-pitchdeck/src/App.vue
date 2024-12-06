<script setup>
import { RouterLink, RouterView } from 'vue-router'
import '@/assets/tailwind.css';
import Title from './components/Title.vue'
import { ref, onMounted, onUnmounted } from 'vue';

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

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>  
    <video autoplay loop muted playsinline id="backgroundVideo"
           class="fixed top-0 left-0 min-w-full min-h-full w-auto h-auto object-cover -z-10">
      <source src="./assets/POC.mp4" type="video/mp4">
      Video Not Supported.
    </video>

    <header class="relative z-10 flex items-center justify-center h-screen mr-0 sm:mr-10">
      <div class="mx-auto">
        <div class="items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-80 p-5 rounded-xl">
          <div class="wrapper font-origin font-bold">
            <Title msg="Star System Labs" />
          </div>
        </div>
        
        <section class="mt-8 grid grid-cols-3 gap-4">
          <a v-for="link in quickLinks" :key="link.name" :href="link.url" 
             class="p-4 bg-card-blue bg-opacity-75 border-2 border-custom-blue rounded-lg hover:shadow-lg text-white flex items-center justify-center">
            <h3 class="font-origin text-yellow-300 text-xs sm:text-sm md:text-base text-center">{{ link.name }}</h3>
          </a>
        </section>
      </div>
    </header>

    <RouterView class="relative z-10" />

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
