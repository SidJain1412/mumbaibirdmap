<template>
  <div class="container">
    <header class="header">
      <h1>Mumbai Bird Map</h1>
      <p>Explore bird sightings across Mumbai Suburban Area</p>
      <p style="font-size: 0.8rem;">Made with ❤️ by <a href="https://www.instagram.com/__sidjain__/" target="_blank" rel="noopener">Siddharth Jain</a> with eBird Data</p>
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
        Random Species!
      </button>
    </div>
    <MonthlyPlot 
      v-if="monthlyData.length"
      :monthly-data="monthlyData" 
      class="monthly-plot"
    />
    <div ref="mapContainer" class="map-container" />
    <InfoFooter />
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
import InfoFooter from './components/InfoFooter.vue'

export default {
  name: "SpeciesMap",
  components: {
    MonthlyPlot,
    InfoFooter
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
      speciesCache: {},
      isLoading: false,
    };
  },
  async created() {
    await this.fetchSpeciesList();
    if (this.speciesList.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.speciesList.length/4);
      this.selectedSpecies = this.speciesList[randomIndex].value;
      this.selectedMonth = { value: null, label: 'All Months' };
    }
  },
  async mounted() {
    document.title = "Mumbai Bird Map";
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
    async fetchSpeciesList() {
      try {
        const response = await fetch("data/species-list.json");
        if (!response.ok) throw new Error("Failed to fetch species list");
        const data = await response.json();
        this.speciesList = data.map(species => ({
          value: species.name,
          label: `${species.name} (Rarity Rank: ${species.rank})`
        }));
      } catch (error) {
        console.error("Error fetching species list:", error);
      }
    },
    async loadLocationData() {
      if (!this.selectedSpecies) return;
      
      this.isLoading = true;
      
      try {
        // Get species data from cache or fetch it
        const speciesData = await this.getSpeciesData(this.selectedSpecies);
        
        // Filter by month if selected
        let locationData = [];
        if (typeof this.selectedMonth === 'object') {
          // Combine all months' data when no month is selected
          locationData = Object.values(speciesData).flat();
        } else {
          locationData = speciesData[this.selectedMonth] || [];
        }

        // Calculate monthly data for the plot
        this.monthlyData = Array(12).fill(0).map((_, index) => {
          const monthNum = index + 1;
          const monthData = speciesData[monthNum] || [];
          return monthData.reduce((sum, location) => sum + location.count, 0);
        });

        await this.updateMap(locationData);
      } catch (error) {
        console.error("Error loading location data:", error);
      } finally {
        this.isLoading = false;
      }
    },
    async getSpeciesData(species) {
      // Check cache first
      if (this.speciesCache[species]) {
        return this.speciesCache[species];
      }

      // Fetch data for the species
      const filename = species.toLowerCase().replaceAll(" ", "-");
      const response = await fetch(`data/species/${filename}.json`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${species}`);
      }
      
      const data = await response.json();
      this.speciesCache[species] = data;
      return data;
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
  },
};
</script>

<style>
/* Font Import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* {
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: #f8fafc;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 0.5rem;
  position: relative;
}

.header h1 {
  color: #0f172a;
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  background: linear-gradient(45deg, #1a5f7a, #2E7D32);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header p {
  color: #64748b;
  font-size: 1.1rem;
  margin: 0.5rem 0;
  font-weight: 400;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 1000px;
  background: white;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  position: relative;
  z-index: 1000;
}

.load-button,
.surprise-button {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.load-button {
  background: linear-gradient(45deg, #2E7D32, #388E3C);
  color: white;
}

.surprise-button {
  background: linear-gradient(45deg, #F57C00, #FB8C00);
  color: white;
}

.load-button:hover:not(:disabled),
.surprise-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.load-button:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.map-container {
  width: 100%;
  height: 400px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  z-index: 1;
}

/* Custom marker cluster styles */
.mycluster {
  background: linear-gradient(45deg, #1a5f7a, #2E7D32);
  border-radius: 50%;
  color: white;
  width: 36px !important;
  height: 36px !important;
  font-size: 0.9rem;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
}

/* Multiselect customization */
.v-select {
  --vs-controls-color: #64748b;
  --vs-border-color: #e2e8f0;
  --vs-dropdown-bg: #ffffff;
  --vs-dropdown-color: #0f172a;
  --vs-dropdown-option-color: #64748b;
  --vs-selected-bg: #f1f5f9;
  --vs-selected-color: #0f172a;
}

.v-select .vs__dropdown-toggle {
  padding: 4px 0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-color: #fff;
  transition: all 0.2s ease;
}

.v-select .vs__dropdown-toggle:hover {
  border-color: #cbd5e1;
}

.v-select .vs__selected {
  color: #0f172a;
  font-weight: 500;
}

.v-select .vs__search::placeholder {
  color: #94a3b8;
}

.v-select .vs__dropdown-menu {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  padding: 4px;
}

.v-select .vs__dropdown-option {
  padding: 8px 12px;
  border-radius: 8px;
}

.v-select .vs__dropdown-option--highlight {
  background: #f1f5f9;
  color: #0f172a;
}

.month-select {
  min-width: unset;
  width: 100%;
}

/* Add loading indicator styles */
.controls {
  position: relative;
}

.controls::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: none;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.controls.loading::after {
  display: flex;
  content: "Loading...";
  font-weight: 500;
  color: #2E7D32;
}

/* Add media queries for larger screens */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }

  .header h1 {
    font-size: 2.5rem;
  }

  .controls {
    flex-direction: row;
    gap: 1rem;
    padding: 1.25rem;
  }

  .map-container {
    height: 600px;
  }

  .month-select {
    min-width: 150px;
    max-width: 200px;
  }
}

/* Adjust v-select width for mobile */
.v-select {
  width: 100%;
}
</style>
