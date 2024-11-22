<template>
  <div class="container">
    <header class="header">
      <h1>Mumbai Bird Map</h1>
      <p>Explore bird sightings across Mumbai</p>
    </header>
    <div class="controls">
      <v-select
        v-model="selectedSpecies"
        :options="speciesList"
        :searchable="true"
        :disabled="!speciesList.length"
        placeholder="Select or search for a bird species"
        class="species-select"
      />
      <v-select
        v-model="selectedMonth"
        :options="months"
        :searchable="false"
        :disabled="!months.length"
        placeholder="All Months"
        class="month-select"
      />
      <button @click="loadLocationData" :disabled="!selectedSpecies" class="load-button">
        Show Locations
      </button>
      <button @click="surpriseMe" class="surprise-button">
        Surprise Me
      </button>
    </div>
    <MonthlyPlot 
      v-if="monthlyData.length"
      :monthly-data="monthlyData" 
      class="monthly-plot"
    />
    <div ref="mapContainer" class="map-container" />
  </div>
</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.heat";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MonthlyPlot from './components/MonthlyPlot.vue'

export default {
  name: "SpeciesMap",
  components: {
    MonthlyPlot
  },
  data() {
    return {
      selectedSpecies: "",
      selectedMonth: { value: null, label: 'All Months' },
      months: [
        { value: null, label: 'All Months' },
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
      ],
      speciesList: [],
      map: null,
      markerCluster: null,
      heatLayer: null,
      isDestroying: false,
      mapConfig: {
        center: [19.1433, 72.879],
        zoom: 11,
        tileLayer: {
          url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          options: {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors",
          },
        },
      },
      monthlyData: [],
    };
  },
  async created() {
    await this.loadSpeciesList();
  },
  async mounted() {
    try {
      await this.initializeMap();
      if (this.selectedSpecies && !this.isDestroying) {
        await this.loadLocationData();
      }
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  },
  beforeUnmount() {
    this.cleanup();
  },
  watch: {
    selectedSpecies(newValue) {
      if (newValue && !this.isDestroying) {
        this.loadLocationData();
      }
    },
    selectedMonth() {
      if (this.selectedSpecies && !this.isDestroying) {
        this.loadLocationData();
      }
    },
  },
  methods: {
    cleanup() {
      this.isDestroying = true;

      if (this.heatLayer) {
        this.map.removeLayer(this.heatLayer);
        this.heatLayer = null;
      }

      if (this.markerCluster) {
        this.markerCluster.clearLayers();
        this.map.removeLayer(this.markerCluster);
        this.markerCluster = null;
      }

      if (this.map) {
        this.map.remove();
        this.map = null;
      }
    },
    async initializeMap() {
      if (this.map || this.isDestroying) return;

      await this.$nextTick();

      if (!this.$refs.mapContainer || this.isDestroying) {
        throw new Error("Map container not found or component is being destroyed");
      }

      this.map = L.map(this.$refs.mapContainer, {
        fadeAnimation: true,
        zoomAnimation: true,
        markerZoomAnimation: false,
      }).setView(this.mapConfig.center, this.mapConfig.zoom);

      L.tileLayer(this.mapConfig.tileLayer.url, this.mapConfig.tileLayer.options).addTo(this.map);

      this.markerCluster = L.markerClusterGroup({
        iconCreateFunction: (cluster) => {
          const count = cluster.getAllChildMarkers().reduce((acc, marker) => acc + (marker.options.count || 0), 0);
          return L.divIcon({
            html: `<span>${count}</span>`,
            className: "mycluster",
            iconSize: L.point(40, 40),
          });
        },
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        zoomToBoundsOnClick: true,
        chunkedLoading: true,
        animate: false,
        animateAddingMarkers: false,
      });

      if (!this.isDestroying) {
        this.map.addLayer(this.markerCluster);
      }
    },
    async loadSpeciesList() {
      if (this.isDestroying) return;

      try {
        const response = await fetch("http://localhost:8000/speciesList");
        if (!response.ok) throw new Error("Failed to fetch species list");

        this.speciesList = await response.json();
        if (this.speciesList.length && !this.isDestroying) {
          this.selectedSpecies = this.speciesList[0];
        }
      } catch (error) {
        console.error("Error loading species list:", error);
        this.speciesList = [];
      }
    },
    async loadLocationData() {
      if (!this.selectedSpecies || !this.map || this.isDestroying) return;

      try {
        const monthParam = (this.selectedMonth && this.selectedMonth.value !== null) ? 
          `?month=${this.selectedMonth}` : '';
        
        const response = await fetch(
          `http://localhost:8000/locationData/${encodeURIComponent(this.selectedSpecies)}${monthParam}`
        );
        if (!response.ok) throw new Error("Failed to fetch location data");

        const locations = await response.json();
        if (!this.isDestroying) {
          await this.updateMap(locations);
          await this.loadMonthlyData();
        }
      } catch (error) {
        console.error("Error loading location data:", error);
      }
    },
    async updateMap(locations) {
      if (this.isDestroying) return;

      if (this.markerCluster) {
        this.markerCluster.clearLayers();
      }

      if (this.heatLayer && this.map.hasLayer(this.heatLayer)) {
        this.map.removeLayer(this.heatLayer);
        this.heatLayer = null;
      }

      const heatData = [];
      const bounds = L.latLngBounds();

      locations.forEach(({ lat, lng, count }) => {
        if (this.isDestroying) return;

        const latLng = [lat, lng];
        const marker = L.marker(latLng, { count, animate: false });
        marker.bindPopup(`Count: ${count}`);

        if (this.markerCluster && !this.isDestroying) {
          this.markerCluster.addLayer(marker);
        }

        heatData.push([lat, lng, Math.min(count, 30)]);
        bounds.extend(latLng);
      });

      if (this.isDestroying) return;

      if (heatData.length > 0 && this.map) {
        this.heatLayer = L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 10,
          max: 30,
          gradient: {
            0.4: "blue",
            0.6: "cyan",
            0.8: "lime",
            0.9: "yellow",
            1.0: "red",
          },
        });

        if (!this.isDestroying) {
          this.map.addLayer(this.heatLayer);
          this.map.fitBounds(bounds, { padding: [50, 50], animate: false });
        }
      }
    },
    surpriseMe() {
      if (this.speciesList.length > 0) {
        const randomIndex = Math.floor(Math.random() * this.speciesList.length);
        this.selectedSpecies = this.speciesList[randomIndex];
      }
    },
    async loadMonthlyData() {
      if (!this.selectedSpecies) return;
      
      try {
        const response = await fetch(
          `http://localhost:8000/monthlyData/${encodeURIComponent(this.selectedSpecies)}`
        );
        if (!response.ok) throw new Error("Failed to fetch monthly data");
        
        this.monthlyData = await response.json();
      } catch (error) {
        console.error("Error loading monthly data:", error);
        this.monthlyData = [];
      }
    },
  },
};
</script>

<style>
/* Font Import */
@font-face {
  font-family: 'Hubot Sans';
  src: url('https://github.githubassets.com/static/fonts/github/hubot-sans.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Hubot Sans';
  src: url('https://github.githubassets.com/static/fonts/github/hubot-sans-bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
}

/* Global Font Settings */
* {
  font-family: 'Hubot Sans', system-ui, -apple-system, sans-serif;
}

/* Layout & Container Styles */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* Header Styles */
.header {
  text-align: center;
  margin-bottom: 0.2rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2.75rem;
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1.1;
}

.header p {
  color: #666;
  font-size: 1.25rem;
  line-height: 1.5;
  font-weight: 400;
}

/* Controls Section */
.controls {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 1000px;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 1000;
}

/* Button Styles */
.load-button,
.surprise-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Hubot Sans', system-ui, -apple-system, sans-serif;
  letter-spacing: -0.01em;
}

.load-button {
  background-color: #4caf50;
  color: white;
}

.surprise-button {
  background-color: #ff9800;
  color: white;
}

.load-button:hover:not(:disabled),
.surprise-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.load-button:hover:not(:disabled) {
  background-color: #45a049;
}

.surprise-button:hover {
  background-color: #f57c00;
}

.load-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Map Styles */
.map-container {
  width: 100%;
  height: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

/* Cluster Marker Styles */
.mycluster {
  background: linear-gradient(45deg, #008b8b, #20b2aa);
  border-radius: 50%;
  color: white;
  width: 40px !important;
  height: 40px !important;
  font-size: 16px;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Vue Select Styles */
.v-select {
  flex: 1;
  position: relative;
  z-index: 1000;
  font-size: 1rem;
  font-family: 'Hubot Sans', system-ui, -apple-system, sans-serif;
}

.v-select .vs__dropdown-toggle {
  padding: 6px 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #fff;
}

.v-select .vs__selected {
  color: #2c3e50;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.v-select .vs__search::placeholder {
  color: #94a3b8;
}

.v-select .vs__dropdown-menu {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Remove duplicate multiselect styles */
.month-select {
  min-width: 150px;
  max-width: 200px;
}

.monthly-plot {
  margin-bottom: 1rem;
}

</style>
