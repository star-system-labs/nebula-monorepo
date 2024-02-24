<template>
  <div class="flex items-center justify-left w-full max-w-[260px]">
    <input
      type="number"
      placeholder="0"
      v-model="amount"
      class="border-none  focus:outline-none bg-transparent w-full outline-none text-4xl text-yellow-300 overflow-hidden whitespace-nowrap text-overflow-ellipsis text-left placeholder-blue"
      ref="amountInput"
      @input="emitInputValue"
      :readonly="!isEditable"
    />
  </div>
</template>

<script>
export default {
  name: 'AmountInput',
  props: {
    maxAmount: {
      type: String,
      default: "0"
    },
    isEditable: {
      type: Boolean,
      defaul: true
    }
  },
  data() {
    return {
      amount: null
    };
  },
  methods: {
  setAmount(value) {
    this.amount = value;
    this.emitInputValue({ target: { value: this.amount } });
  },
  emitInputValue(event) {
    this.$emit('inputChanged', event.target.value);
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
