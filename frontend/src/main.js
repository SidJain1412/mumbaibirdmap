import { createApp } from "vue";
import App from "./App.vue";
import router from './router';
import "leaflet/dist/leaflet.css";
import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'

const app = createApp(App);
app.component('v-select', Multiselect);

router.afterEach((to) => {
  gtag('config', 'G-VHEC5TXVJ2', {
    page_path: to.fullPath,
  });
});

app.use(router);
app.mount("#app");