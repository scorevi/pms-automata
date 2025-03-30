<template>
  <div class="home">
    <h1>{{ title }}</h1>
    <input type="text" ref="name">
    <button @click="handleClick">Click Me</button>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      title: 'Patients'
    }
  },
  methods: {
    handleClick() {
      console.log(this.$refs.value)
      this.$refs.name.classList.add('active')
      this.$refs.name.focus()
    }
  }
}
</script>

<style>

</style>