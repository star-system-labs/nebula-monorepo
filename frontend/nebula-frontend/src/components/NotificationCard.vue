<template>
    <transition name="fade">
        <div v-if="show" class="fixed bottom-10 right-10 bg-card-blue bg-opacity-80 border border-custom-blue p-4 rounded-lg shadow-md flex flex-col items-center space-x-4 z-50">
            <div class="flex items-center space-x-4 w-full">
                <img :src="image" alt="Status Image" class="w-12 h-12">
                <span class="text-yellow-300">{{ message }}</span>
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
        progress: 100,
        timer: null
      };
    },
    methods: {
      showNotification(type, customMessage) {
        if (this.timer) {
            clearInterval(this.timer);
            this.progress = 100;
        }
        switch (type) {
          case "success":
            this.message = customMessage || "PrimordialPePe Mined!";
            this.image = require("@/assets/ppepe.png");
            break;
          case "error":
            this.message = customMessage || "Failed Transaction";
            this.image = require("@/assets/error.png");
            break;
          case "pending":
            this.message = customMessage || "Transaction Pending...";
            this.image = require("@/assets/history.png");
            break;
          case "LPStakingSuccess":
            this.message = customMessage || "LP Staking Successful!";
            this.image = require("@/assets/staking.png");
            break;
          case "VestingSuccess":
            this.message = customMessage || "Vesting Successful!";
            this.image = require("@/assets/vesting.png");
            break;
          case "SDIVComingSoon":
            this.message = "SDIV is coming soon!";
            this.image = require("@/assets/sdiv.png");
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
      }
    },
    beforeUnmount() {
      if (this.timer) clearInterval(this.timer);
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
  