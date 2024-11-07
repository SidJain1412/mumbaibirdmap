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
      <button @click="loadLocationData" :disabled="!selectedSpecies" class="load-button">
        Show Locations
      </button>
      <button @click="surpriseMe" class="surprise-button">
        Surprise Me
      </button>
    </div>
    <div ref="mapContainer" class="map" />
  </div>
</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.heat";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

export default {
  name: "SpeciesMap",
  data() {
    return {
      selectedSpecies: "",
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
            attribution: "© OpenStreetMap",
          },
        },
      },
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
        const response = await fetch(`http://localhost:8000/locationData/${encodeURIComponent(this.selectedSpecies)}`);
        if (!response.ok) throw new Error("Failed to fetch location data");

        const locations = await response.json();
        if (!this.isDestroying) {
          await this.updateMap(locations);
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
  },
};
</script>

<style>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  text-align: center;
  margin-bottom: 1rem;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.header p {
  color: #666;
  font-size: 1.1rem;
}

.controls {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 800px;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.species-select {
  flex: 1;
}

/* Vue Select Custom Styles */
.v-select {
  font-size: 1rem;
}

.v-select .vs__dropdown-toggle {
  padding: 4px 0;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.v-select .vs__selected {
  color: #2c3e50;
}

.v-select .vs__search::placeholder {
  color: #666;
}

.load-button, .surprise-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.load-button {
  background-color: #4caf50;
  color: white;
}

.load-button:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-1px);
}

.surprise-button {
  background-color: #ff9800;
  color: white;
}

.surprise-button:hover {
  background-color: #f57c00;
  transform: translateY(-1px);
}

.load-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
}

.map {
  width: 100%;
  height: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Cluster Marker Styles */
.mycluster {
  background-color: rgba(0, 139, 139, 0.9);
  border-radius: 50%;
  color: white;
  text-align: center;
  width: 40px !important;
  height: 40px !important;
  line-height: 40px;
  font-size: 16px;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mycluster span {
  display: block;
  text-align: center;
  width: 100%;
}

/* Add these styles for the new multiselect component */
.multiselect {
  min-height: 44px;
}

.multiselect-search {
  padding: 8px;
}

.multiselect-option {
  padding: 8px 12px;
}

.multiselect-option.is-pointed {
  background: #f3f4f6;
}

.multiselect-option.is-selected {
  background: #4caf50;
  color: white;
}
.controls {
  position: relative;  /* Add this */
  z-index: 1000;      /* Add this */
}

/* If using vue-select */
.v-select {
  position: relative;
  z-index: 1000;
}

/* If using @vueform/multiselect */
.multiselect {
  position: relative;
  z-index: 1000;
}

.multiselect-dropdown {
  z-index: 1000;
}

/* Ensure map stays below */
.map {
  z-index: 1;  /* Add this */
}

</style>
