import { createApp } from 'vue'
import './style/tailwind.css'
import 'vue-sonner/style.css'
import './plugins/echarts'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.mount('#app')
