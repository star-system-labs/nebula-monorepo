<template>
  <div class="flex items-center justify-left w-full max-w-[260px]">
    <input
      type="text"
      placeholder="0"
      v-model="inputValue"
      :class="['border-none focus:outline-none bg-transparent w-full outline-none text-4xl overflow-hidden whitespace-nowrap text-overflow-ellipsis text-left placeholder-blue', inputValue === '0' ? 'text-custom-blue' : 'text-yellow-300']"
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
      amount: ''
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
    }
  }
}
</script>

<style scoped>
input {
  max-width: 240px;
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
}

input::-webkit-inner-spin-button, input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
