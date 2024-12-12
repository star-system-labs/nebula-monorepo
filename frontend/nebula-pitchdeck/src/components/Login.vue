<template>
  <div class="flex items-start justify-center min-h-screen mt-5">
    <div class="bg-card-blue bg-opacity-75 p-8 rounded-xl border-2 border-custom-blue">
      <h2 class="font-origin text-yellow-300 text-center mb-6">Login</h2>
      <form @submit.prevent="login">
        <div class="mb-4">
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            class="w-full p-2 rounded bg-transparent border border-custom-blue font-nixie text-white"
            required
          />
        </div>
        <div class="mb-6">
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="w-full p-2 rounded bg-transparent border border-custom-blue font-nixie text-white"
            required
          />
        </div>
        <button
          type="submit"
          class="w-full bg-yellow-300 text-black font-bold py-2 rounded hover:scale-105 transition-transform"
        >
          Login
        </button>
        <p v-if="errorMessage" class="text-red-500 text-center mt-4">{{ errorMessage }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const errorMessage = ref('')
const emit = defineEmits(['login-success']);

const login = async () => {
  if (username.value === import.meta.env.VITE_USERNAME && 
      password.value === import.meta.env.VITE_PASSWORD) {
    localStorage.setItem('authenticated', 'true')
    emit('login-success')
    router.push('/')
  } else {
    errorMessage.value = 'Invalid username or password.'
  }
}
</script>

<style scoped>
</style> 