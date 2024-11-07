<template>
  <div class="container">
    <div class="controls">
      <select
        v-model="selectedSpecies"
        class="species-select"
        :disabled="!speciesList.length"
      >
        <option value="" disabled>Select Species</option>
        <option v-for="species in speciesList" :key="species" :value="species">
          {{ species }}
        </option>
      </select>
      <button
        @click="loadLocationData"
        :disabled="!selectedSpecies"
        class="load-button"
      >
        Show Locations
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
    // Added for Vue 3 compatibility
    this.cleanup();
  },
  watch: {
    selectedSpecies: {
      handler(newValue) {
        if (newValue && !this.isDestroying) {
          this.loadLocationData();
        }
      },
    },
  },
  methods: {
    cleanup() {
      this.isDestroying = true;

      // Remove heat layer
      if (this.heatLayer && this.map) {
        this.map.removeLayer(this.heatLayer);
        this.heatLayer = null;
      }

      // Remove marker cluster
      if (this.markerCluster && this.map) {
        this.markerCluster.clearLayers();
        this.map.removeLayer(this.markerCluster);
        this.markerCluster = null;
      }

      // Remove map
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
    },
    async initializeMap() {
      if (this.map || this.isDestroying) return;

      await this.$nextTick();

      if (!this.$refs.mapContainer || this.isDestroying) {
        throw new Error(
          "Map container not found or component is being destroyed"
        );
      }

      this.map = L.map(this.$refs.mapContainer, {
        fadeAnimation: true, // Disable animations to prevent race conditions
        zoomAnimation: true,
        markerZoomAnimation: false,
      }).setView(this.mapConfig.center, this.mapConfig.zoom);

      L.tileLayer(
        this.mapConfig.tileLayer.url,
        this.mapConfig.tileLayer.options
      ).addTo(this.map);

      this.markerCluster = L.markerClusterGroup({
        iconCreateFunction: (cluster) => {
          const count = cluster
            .getAllChildMarkers()
            .reduce((acc, marker) => acc + (marker.options.count || 0), 0);
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
        animate: false, // Disable animations
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
        const response = await fetch(
          `http://localhost:8000/locationData/${encodeURIComponent(
            this.selectedSpecies
          )}`
        );
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

      // Clear existing layers
      if (this.markerCluster) {
        this.markerCluster.clearLayers();
      }

      if (this.heatLayer && this.map && this.map.hasLayer(this.heatLayer)) {
        this.map.removeLayer(this.heatLayer);
        this.heatLayer = null;
      }

      const heatData = [];
      const bounds = L.latLngBounds();

      // Add new markers and heat data
      locations.forEach(({ lat, lng, count }) => {
        if (this.isDestroying) return;

        const latLng = [lat, lng];

        const marker = L.marker(latLng, {
          count,
          // Disable marker animations
          animate: false,
        });
        marker.bindPopup(`Count: ${count}`);

        if (this.markerCluster && !this.isDestroying) {
          this.markerCluster.addLayer(marker);
        }

        heatData.push([lat, lng, Math.min(count, 30)]);
        bounds.extend(latLng);
      });

      if (this.isDestroying) return;

      // Only add heatmap if we have data
      if (heatData.length > 0 && this.map && !this.isDestroying) {
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
          this.map.fitBounds(bounds, {
            padding: [50, 50],
            animate: false, // Disable animation for bounds fitting
          });
        }
      }
    },
  },
};
</script>

<style>
/* Styles remain the same */
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.controls {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 600px;
}

.species-select {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  font-size: 1rem;
}

.load-button {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.load-button:hover {
  background-color: #45a049;
}

.load-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.map {
  width: 100%;
  height: 600px;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  overflow: hidden;
}

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
  display: flex;
  align-items: center;
  justify-content: center;
}

.mycluster span {
  display: block;
  text-align: center;
  width: 100%;
}
</style>
