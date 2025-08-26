import { createApp } from "vue";
import App from "./App.vue";
import "leaflet/dist/leaflet.css";
import Multiselect from '@vueform/multiselect'
import '@vueform/multiselect/themes/default.css'
import { usePostHog } from './composables/usePostHog'

// Initialize PostHog
usePostHog()

const app = createApp(App);
app.component('v-select', Multiselect);
app.mount("#app");