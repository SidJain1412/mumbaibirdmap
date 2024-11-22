<template>
  <div class="info-footer">
    <div class="info-content">
      <h3>About this Map</h3>
      <p>This mapuses bird observation data from <a href="https://ebird.org" target="_blank" rel="noopener">eBird</a>, 
      covering the period from January 2019 to January 2024.</p>
      
      <h4>Methodology</h4>
      <p>Data points are aggregated into small geographic cells to create both the heatmap and cluster views. 
      The intensity of the heatmap represents the number of observations in each area. 
      Monthly patterns are displayed in the bar chart above to show seasonal variations in sightings.</p>
      
      <p class="attribution">Built by <a href="https://github.com/sidjain1412" target="_blank" rel="noopener">Siddharth Jain</a>. Data courtesy of eBird, a project of the Cornell Lab of Ornithology.</p>
    </div>
  </div>
</template>

<style scoped>
.info-footer {
  width: 100%;
  max-width: 1000px;
  margin: 1rem auto 0;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  font-size: 0.9rem;
  line-height: 1.5;
}

.info-content {
  color: #4a5568;
}

h3 {
  font-size: 1.1rem;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
}

h4 {
  font-size: 1rem;
  color: #2d3748;
  margin: 1rem 0 0.5rem 0;
}

p {
  margin: 0.5rem 0;
}

.attribution {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #718096;
}

a {
  color: #4caf50;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style> 