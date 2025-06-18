<template>
    <transition name="fade">
        <div v-if="show" 
             class="fixed bg-card-blue bg-opacity-80 border border-custom-blue p-4 rounded-lg shadow-md flex flex-col items-center z-50"
             :class="[
                isMobile ? 'bottom-4 left-1/2 transform -translate-x-1/2 max-w-[95%]' : 'bottom-10 right-10'
             ]">
            <div class="flex w-full space-x-4"
                 :class="[isMobile ? 'items-start' : 'items-center']">
                <span v-if="type === 'info'" class="text-4xl w-12 h-12 flex items-center justify-center">⛽</span>
                <img v-else :src="image" alt="Status Image" class="w-12 h-12">
                <span class="text-yellow-300 flex-1" :class="{ 'text-sm': isMobile }">{{ message }}</span>
            </div>
            <div class="relative w-full mx-auto h-1 mt-2 rounded-full bg-button">
                <div class="absolute h-1 bg-yellow-300 rounded-full" :style="{'width': progress + '%'}"></div>
            </div>
        </div>
    </transition>
</template>
  
<script>
export default {
  data() {
    return {
      show: false,
      message: '',
      image: '',
      type: '',
      progress: 100,
      timer: null,
      windowWidth: window.innerWidth
    };
  },
  computed: {
    isMobile() {
      return this.windowWidth < 640;
    }
  },
  methods: {
    showNotification(type, customMessage) {
      this.type = type;
      if (this.timer) {
          clearInterval(this.timer);
          this.progress = 100;
      }
      switch (type) {
        case "success":
          this.message = customMessage || "PrimordialPePe Mined!";
          this.image = require("@/assets/ppepe.webp");
          break;
        case "error":
          this.message = customMessage || "Failed Transaction";
          this.image = require("@/assets/error.webp");
          break;
        case "pending":
          this.message = customMessage || "Transaction Pending...";
          this.image = require("@/assets/history.webp");
          break;
        case "LPStakingSuccess":
          this.message = customMessage || "LP Staking Successful!";
          this.image = require("@/assets/staking.webp");
          break;
        case "VestingSuccess":
          this.message = customMessage || "Vesting Successful!";
          this.image = require("@/assets/vesting.webp");
          break;
        case "SDIVComingSoon":
          this.message = "SDIV is coming soon!";
          this.image = require("@/assets/sdiv.webp");
          break;
        case "info":
          this.message = customMessage || "";
          this.image = "";
          break;
      }
      this.show = true;
      const intervalDuration = type === "pending" ? 100 : 35;
      this.timer = setInterval(() => {
        if (this.progress <= 0) {
          clearInterval(this.timer);
          this.show = false;
        } else {
          this.progress -= 1;
        }
      }, intervalDuration);
    },
    handleResize() {
      this.windowWidth = window.innerWidth;
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>
  
<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
  