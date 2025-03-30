<template>
  <nav v-show="isLoggedOut">
    <router-link to="/">Login</router-link> |
    <router-link to="/register">Register</router-link>
  </nav>

  <router-view/>
</template>

<script>
export default {
  data() {
    return {
      isLoggedOut: true
    }
  },
}
</script>