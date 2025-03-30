import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import '@/assets/styles/global.css'
import '@/assets/styles/utilities.css'
import '@/assets/styles/styles.css'

createApp(App).use(router).mount('#app')