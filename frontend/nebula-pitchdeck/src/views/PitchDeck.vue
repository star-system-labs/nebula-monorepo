<template>
  <div class="flex flex-col items-center justify-between py-5 rounded-xl w-full max-w-7xl">
    <div class="mx-auto items-center border-1 border-custom-blue justify-between bg-card-blue bg-opacity-85 p-5 rounded-xl">
      <section class="mb-8">
        <h1 class="text-2xl sm:text-3xl md:text-4xl font-origin text-yellow-300">Nebula Platform</h1>
        <p class="text-sm sm:text-base md:text-xl mt-4 font-nixie font-bold text-teal">
          The Nebula Platform is the world's first decentralized finance platform for meme coins.
        </p>
      </section>

      <!-- <section class="grid grid-cols-3 gap-4 mb-8">
        <a v-for="link in quickLinks" :key="link.name" :href="link.url" class="p-4 bg-card-blue bg-opacity-75 border-2 border-custom-blue rounded-lg hover:shadow-lg text-white">
          <h3 class="font-origin text-yellow-300">{{ link.name }}</h3>
        </a>
      </section> -->

      <div class="space-y-8">
        <section v-for="section in sections" :key="section.title">
          <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold font-origin text-yellow-300 mb-4">{{ section.title }}</h2>
          <div class="prose max-w-none font-nixie font-bold text-teal">
            <p class="font-bold">{{ section.content }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
  
  <script setup>
  const quickLinks = [
    { name: 'Website', url: 'https://starsystemlabs.com' },
    { name: 'Documentation', url: 'https://docs.starsystemlabs.com' },
    { name: 'Whitepaper', url: 'https://github.com/star-system-labs/whitepaper/blob/main/Star-System-Labs-Whitepaper.pdf' },
    { name: 'Nebula', url: 'https://nebula.starsystemlabs.com' },
    { name: 'GitHub', url: 'https://github.com/star-system-labs' },
    { name: 'X', url: 'https://x.com/StarSystem_Labss' },
    { name: 'Telegram', url: 'https://t.me/starsystemlabs' },
    { name: 'Discord', url: 'https://discord.com/invite/kH8B5SCSgy' },
    { name: 'LinkTree', url: 'https://linktr.ee/starsystemlabs' }
  ]
  
  const sections = [
    {
      title: 'In a Nutshell',
      content: "Nebula Protocol enables meme coins to generate Bitcoin and yield, while providing a platform for meme coins to be traded, aggregated, and managed."
    },
    {
      title: 'The Problem',
      content: "Current Meme Coin infrastructure is build around gambling and not DeFi, there are no machinisms to gain yield on purchased memes, you must sell to reap any benefits."
    },
    {
      title: 'Our Solution',
      content: "Nebula provides secure place to lock your meme coins and generate Bitcoin and yield other meme coins, while providing a platform for meme coins to be traded, aggregated, and managed."
    },
    {
      title: 'Conclusion',
      content: "We're building the future of meme coin infrastructure."
    }
  ]
  </script>