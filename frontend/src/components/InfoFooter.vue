<template>
  <div class="info-footer">
    <div class="info-content">
      <h3>About this Map</h3>
      <p>This map uses bird observation data from <a href="https://ebird.org" target="_blank" rel="noopener">eBird</a>, 
      covering the period from January 2019 to January 2024, for the region Mumbai Suburban, India.</p>
      
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
  padding: 1.25rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  font-size: 0.9rem;
  line-height: 1.6;
}

.info-content {
  color: #475569;
}

h3 {
  font-size: 1.1rem;
  color: #0f172a;
  margin: 0 0 0.75rem 0;
  font-weight: 600;
}

h4 {
  font-size: 1rem;
  color: #0f172a;
  margin: 1.25rem 0 0.5rem 0;
  font-weight: 600;
}

p {
  margin: 0.5rem 0;
}

.attribution {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
  font-size: 0.85rem;
  color: #64748b;
}

a {
  color: #2E7D32;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

a:hover {
  color: #1B5E20;
}
</style> 