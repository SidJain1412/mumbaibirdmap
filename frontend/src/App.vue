<template>
  <div id="app">
    <div class="input-container">
      <select v-model="speciesName">
        <option v-for="species in speciesList" :key="species" :value="species">
          {{ species }}
        </option>
      </select>
      <button @click="fetchLocationData">Get Locations</button>
    </div>
    <div class="map-container" ref="map"></div>
  </div>
</template>

<script>
import L from "leaflet";

export default {
  name: "App",
  data() {
    return {
      speciesName: "Select Species",
      speciesList: [],
      map: null,
    };
  },
  mounted() {
    this.fetchSpeciesList(); // Fetch species list on mount
    this.initializeMap([[19.076, 72.8777]]); // Center the map to Mumbai by default
  },
  methods: {
    fetchSpeciesList() {
      fetch(`http://localhost:8000/speciesList`)
        .then((response) => response.json())
        .then((data) => {
          this.speciesList = data; // Set species list
        })
        .catch((error) => console.error("Error fetching species list:", error));
    },
    fetchLocationData() {
      console.log(this.speciesName);
      if (!this.speciesName) return;

      fetch(`http://localhost:8000/locationData/${this.speciesName}`)
        .then((response) => response.json())
        .then((data) => {
          this.initializeMap(data);
        })
        .catch((error) =>
          console.error("Error fetching location data:", error)
        );
    },
    initializeMap(locations) {
      if (!this.map) {
        this.map = L.map(this.$refs.map).setView([19.1433, 72.879], 11); // Center on Mumbai
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(this.map);
      }

      // Clear previous markers
      this.map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          this.map.removeLayer(layer);
        }
      });

      // Add new markers based on the fetched locations
      locations.forEach((location) => {
        L.marker([location.lat, location.lng])
          .addTo(this.map)
          .bindPopup(`Location: (${location.lat}, ${location.lng})`);
      });
    },
  },
};
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-container {
  margin-bottom: 20px;
}

input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 250px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  margin-left: 10px;
}

button:hover {
  background-color: #0056b3;
}

.map-container {
  height: 600px;
  width: 100%;
  max-width: 800px; /* Set a max width for the map */
  border: 2px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden; /* Ensure the map stays within the container */
}
</style>
