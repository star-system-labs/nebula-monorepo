<script setup>
defineProps({
  msg: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="greetings flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-x-4 sm:space-y-0 p-4 w-full">
    <img src="@/assets/SSL_logo.png" alt="SSL logo" class="w-14 h-12 sm:w-20 sm:h-18 md:w-28 md:h-26 lg:w-32 lg:h-30 xl:w-36 xl:h-32 mx-auto" />
    <div class="flex flex-col text-center sm:text-left w-full">
      <div>
        <h1 class="text-yellow-300 text-base sm:text-lg md:text-xl lg:text-2xl mb-6">{{ msg }}</h1>
        <h3 class="text-teal text-xs sm:text-base md:text-lg mb-6">
          The world's first decentralized finance platform for meme coins. 
          Make your <a target="_blank" class="green" rel="noopener">Memes</a> generate
          <a target="_blank" class="green" rel="noopener">Bitcoin</a>.
        </h3>
      </div>
      <div class="space-x-2 text-yellow-300 sm:space-x-4 text-xs sm:text-sm md:text-base">
        <a href="https://www.starsystemlabs.com">Website</a>
        <a href="https://github.com/star-system-labs/whitepaper/blob/main/Star-System-Labs-Whitepaper.pdf">Whitepaper</a>
        <a href="https://docs.starsystemlabs.com">Documentation</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
h1 {
  font-weight: 500;
  font-size: 2rem;
}

h3 {
  font-size: 1rem;
}

.greetings {
  text-align: left;
}
</style>
