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
      mapConfig: {
        center: [19.1433, 72.879], // Mumbai coordinates
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
  async mounted() {
    try {
      await this.initializeMap();
      await this.loadSpeciesList();
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  },
  methods: {
    initializeMap() {
      if (this.map) return;

      this.map = L.map(this.$refs.mapContainer).setView(
        this.mapConfig.center,
        this.mapConfig.zoom
      );

      L.tileLayer(
        this.mapConfig.tileLayer.url,
        this.mapConfig.tileLayer.options
      ).addTo(this.map);

      this.markerCluster = L.markerClusterGroup();
      this.markerCluster = L.markerClusterGroup({
        iconCreateFunction: function (cluster) {
          var markers = cluster.getAllChildMarkers();
          var n = 0;
          for (var i = 0; i < markers.length; i++) {
            n += markers[i].count;
          }
          return L.divIcon({
            html: n,
            className: "mycluster",
            iconSize: L.point(40, 40),
          });
        },
        maxClusterRadius: 50,
        disableClusteringAtZoom: null,
        spiderfyOnMaxZoom: false,
        zoomToBoundsOnClick: true,
        chunkedLoading: true,
        animate: false,
      });
      this.map.addLayer(this.markerCluster);
    },
    async loadSpeciesList() {
      try {
        const response = await fetch("http://localhost:8000/speciesList");
        if (!response.ok) throw new Error("Failed to fetch species list");

        this.speciesList = await response.json();
        if (this.speciesList.length) {
          this.selectedSpecies = this.speciesList[0];
          await this.loadLocationData();
        }
      } catch (error) {
        console.error("Error loading species list:", error);
        this.speciesList = [];
      }
    },
    async loadLocationData() {
      if (!this.selectedSpecies) return;

      try {
        const response = await fetch(
          `http://localhost:8000/locationData/${this.selectedSpecies}`
        );
        if (!response.ok) throw new Error("Failed to fetch location data");

        const locations = await response.json();
        this.updateMap(locations);
      } catch (error) {
        console.error("Error loading location data:", error);
      }
    },
    updateMap(locations) {
      // Clear existing layers
      this.markerCluster.clearLayers();
      if (this.heatLayer) {
        this.map.removeLayer(this.heatLayer);
      }

      const heatData = [];

      // Add new markers and heat data
      locations.forEach(({ lat, lng, count }) => {
        // Add marker with popup showing the count
        const marker = L.marker([lat, lng]);
        marker.count = count;
        marker.bindPopup(`Count: ${count}`);
        this.markerCluster.addLayer(marker);

        // Add heat data with intensity based on count
        heatData.push([lat, lng, count]);
      });

      // Add new heatmap layer
      this.heatLayer = L.heatLayer(heatData, {
        radius: 10,
        blur: 10,
        maxZoom: 8,
      });
      this.map.addLayer(this.heatLayer);
    },
  },
};
</script>

<style scoped>
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

.mycluster {
  background-color: rgba(0, 139, 139, 0.7); /* Teal background */
  border-radius: 50%;
  color: white;
  text-align: center;
  width: 40px;
  height: 40px;
  line-height: 40px; /* Center text vertically */
  font-size: 16px; /* Adjust font size */
  font-weight: bold; /* Make the text bold */
  border: 2px solid white; /* White border for contrast */
}

.map {
  width: 100%;
  height: 600px;
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  overflow: hidden;
}
</style>
