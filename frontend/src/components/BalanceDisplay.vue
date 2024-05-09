<template>
  <div class="flex items-center">
    {{ tokenName ? `${tokenName} Token ` : '' }}
    {{ $t('message.balance') }}
    <transition :name="transitionName" mode="out-in">
      <div :key="displayBalance" class="inline-block">
        {{ displayBalance }}
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'BalanceDisplay',
  props: {
    balance: {
      type: String,
      default: '0'
    },
    tokenName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      transitionName: 'balance-spin',
      displayBalance: '0.00'
    }
  },
  computed: {
    formattedBalance() {
      return parseFloat(this.balance).toFixed(2);
    }
  },
  mounted() {
    this.triggerAnimation();
  },
  methods: {
    triggerAnimation() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.displayBalance = this.formattedBalance;
        }, 50);
      });
    }
  }
}
</script>

<style scoped>
.balance-spin-enter-active, .balance-spin-leave-active {
  transition: transform 0.5s;
}
.balance-spin-enter, .balance-spin-leave-to {
  transform: rotateX(90deg);
}
</style>
