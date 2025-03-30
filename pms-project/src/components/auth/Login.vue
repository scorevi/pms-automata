<template>
    <div class="container flex-column">
        <div class="login-container flex-column">
            <div class="login-form flex-column">
                <h1>Login</h1>
                <form class="flex-column">
                    <input type="text" placeholder="Username" />
                    <input type="password" placeholder="Password" />
                </form>
                <div class="flex-column">
                    <button @click="handleLogin">Login (Test: Doctor)</button>
                    <button @click="handleLogin2">Login (Test: Patient)</button>
                </div>
                <span @click="navigateRegister">Create an Account</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Login',
    methods: {
        handleLogin() {
            // After Login Success
            this.$router.push('/doctor')
        },
        handleLogin2() {
            // After Login Success
            this.$router.push('/patient')
        },
        navigateRegister() {
            this.$router.push('/register')
        }
    }
}
</script>

<style scoped>
.container {
    width: 100vw;
    height: 100vh;
    align-items: center;
    justify-content: center;
    padding: 4em 4em;
    box-sizing: border-box;
    background-color: #F0F5FA;
}

.login-container {
    width: 100%;
    height: 100%;
    gap: 1em;
    align-items: center;
    justify-content: center;
    background-color: #FFF;
    border-radius: 1em;
}

.login-form {
    width: 300px;
    height: auto;
}

.login-form h1 {
    text-align: center;
    color: var(--primary-color);
    margin-bottom: 2em;
}

.login-form form {
    width: auto;
    height: auto;
    gap: 1em;
    margin-bottom: 2em;
}

button {
    margin-bottom: 1em;
}

span {
    text-align: center;
    color: var(--primary-color);
    cursor: pointer;
}
</style>