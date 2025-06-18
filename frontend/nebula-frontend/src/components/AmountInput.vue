<template>
  <div class="flex items-center justify-left w-full max-w-[260px] sm:max-w-[300px] md:max-w-[340px] lg:max-w-[380px] xl:max-w-[420px]">
    <input
      type="text"
      placeholder="0"
      v-model="inputValue"
      :class="inputValueClass"
      ref="amountInput"
      :disabled="!isEditable"
      @input="validateInput"
    />
  </div>
</template>

<script>
export default {
  name: 'AmountInput',
  props: {
    displayValue: {
    type: String,
    default: ''
  },
    maxAmount: {
      type: String,
      default: "0"
    },
    isEditable: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      amount: '',
    };
  },
  computed: {
    inputValue: {
      get() {
        return this.isEditable ? this.amount : this.displayValue;
      },
      set(value) {
        if (this.isEditable) {
          this.amount = value;
        }
      }
    },
    inputValueClass() {
      const isEmptyOrZero = this.inputValue === '' || this.inputValue === '0';
      return [
        'border-none focus:outline-none bg-transparent w-full outline-none text-4xl overflow-hidden whitespace-nowrap text-overflow-ellipsis text-left placeholder-blue',
        isEmptyOrZero ? 'text-custom-blue' : 'text-yellow-300'
      ];
    }
  },
  methods: {
    setAmount(value) {
      this.amount = value;
      this.emitInputValue();
    },
    emitInputValue() {
      this.$emit('inputChanged', this.amount);
    },
    validateInput(event) {
      const value = event.target.value;
      const regex = /^[0-9]*\.?[0-9]*$/;
      if (!regex.test(value)) {
        this.amount = value.slice(0, -1);
      } else {
        this.amount = value;
      }
      this.emitInputValue();
    }
  },
  mounted() {
    console.log('AmountInput mounted with displayValue:', this.displayValue);
  },
  watch: {
    displayValue(newVal, oldVal) {
      console.log(`displayValue changed in AmountInput from ${oldVal} to ${newVal}`);
    },
    estimatedReward(newVal) {
      if (parseFloat(newVal) === 0) {
        this.inputValue = '';
      } else {
        this.inputValue = newVal;
      }
    }
  }
}
</script>

<style scoped>
input {
  max-width: 100%;
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
}

@media (min-width: 640px) {
  input {
    max-width: 340px;
  }
}

@media (min-width: 768px) {
  input {
    max-width: 380px;
  }
}

@media (min-width: 1024px) {
  input {
    max-width: 420px;
  }
}

@media (min-width: 1280px) {
  input {
    max-width: 460px;
  }
}

@media (min-width: 1536px) {
  input {
    max-width: 500px;
  }
}

input::-webkit-inner-spin-button, input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
