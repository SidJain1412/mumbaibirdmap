(function(){"use strict";var e={8074:function(e,t,a){var i=a(5130),s=a(6768);const n={class:"container"},o={class:"controls"},r=["disabled"],l={ref:"mapContainer",class:"map-container"};function c(e,t,a,i,c,h){const u=(0,s.g2)("v-select"),d=(0,s.g2)("MonthlyPlot"),p=(0,s.g2)("InfoFooter");return(0,s.uX)(),(0,s.CE)("div",n,[t[4]||(t[4]=(0,s.Lk)("header",{class:"header"},[(0,s.Lk)("h1",null,"Mumbai Bird Map"),(0,s.Lk)("p",null,"Explore bird sightings across Mumbai"),(0,s.Lk)("p",{style:{"font-size":"0.8rem"}},[(0,s.eW)("Made with ❤️ by "),(0,s.Lk)("a",{href:"https://www.instagram.com/__sidjain__/",target:"_blank",rel:"noopener"},"Siddharth Jain")])],-1)),(0,s.Lk)("div",o,[(0,s.bF)(u,{modelValue:c.selectedSpecies,"onUpdate:modelValue":t[0]||(t[0]=e=>c.selectedSpecies=e),options:c.speciesList,searchable:!0,disabled:!c.speciesList.length,placeholder:"Select or search for a bird species",class:"species-select"},null,8,["modelValue","options","disabled"]),(0,s.bF)(u,{modelValue:c.selectedMonth,"onUpdate:modelValue":t[1]||(t[1]=e=>c.selectedMonth=e),options:c.months,searchable:!1,disabled:!c.months.length,placeholder:"All Months",class:"month-select"},null,8,["modelValue","options","disabled"]),(0,s.Lk)("button",{onClick:t[2]||(t[2]=(...e)=>h.loadLocationData&&h.loadLocationData(...e)),disabled:!c.selectedSpecies,class:"load-button"}," Show Locations ",8,r),(0,s.Lk)("button",{onClick:t[3]||(t[3]=(...e)=>h.surpriseMe&&h.surpriseMe(...e)),class:"surprise-button"}," Random Species! ")]),c.monthlyData.length?((0,s.uX)(),(0,s.Wv)(d,{key:0,"monthly-data":c.monthlyData,class:"monthly-plot"},null,8,["monthly-data"])):(0,s.Q3)("",!0),(0,s.Lk)("div",l,null,512),(0,s.bF)(p)])}a(4114);var h=a(6886),u=a.n(h);a(5710),a(954);const d={class:"chart-container"};function p(e,t,a,i,n,o){const r=(0,s.g2)("Bar");return(0,s.uX)(),(0,s.CE)("div",d,[o.chartData?((0,s.uX)(),(0,s.Wv)(r,{key:0,data:o.chartData,options:o.chartOptions},null,8,["data","options"])):(0,s.Q3)("",!0)])}var m=a(1010),f=a(6912);f.t1.register(f.hE,f.m_,f.s$,f.E8,f.PP,f.kc);var y={name:"MonthlyPlot",components:{Bar:m.yP},props:{monthlyData:{type:Array,required:!0}},computed:{chartData(){return{labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],datasets:[{label:"Observations",data:this.monthlyData,backgroundColor:"#4caf50",borderRadius:5}]}},chartOptions(){return{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{backgroundColor:"rgba(255, 255, 255, 0.95)",titleColor:"#0f172a",bodyColor:"#0f172a",bodyFont:{family:"Inter"},borderColor:"#e2e8f0",borderWidth:1,padding:10,cornerRadius:8,callbacks:{label:function(e){return`${e.formattedValue} Observations`}}}},scales:{y:{beginAtZero:!0,grid:{color:"#f1f5f9"},ticks:{callback:function(e){return e},font:{size:10,family:"Inter"},color:"#64748b"}},x:{grid:{display:!1},ticks:{font:{size:10,family:"Inter"},color:"#64748b"}}}}}}},b=a(1241);const g=(0,b.A)(y,[["render",p],["__scopeId","data-v-402c4fb8"]]);var v=g;const L={class:"info-footer"};function k(e,t){return(0,s.uX)(),(0,s.CE)("div",L,t[0]||(t[0]=[(0,s.Fv)('<div class="info-content" data-v-2e199107><h3 data-v-2e199107>About this Map</h3><p data-v-2e199107>This map uses bird observation data from <a href="https://ebird.org" target="_blank" rel="noopener" data-v-2e199107>eBird</a>, covering the period from January 2019 to January 2024, for the region Mumbai Suburban, India.</p><h4 data-v-2e199107>Methodology</h4><p data-v-2e199107>Data points are aggregated into small geographic cells to create both the heatmap and cluster views. The intensity of the heatmap represents the number of observations in each area. Monthly patterns are displayed in the bar chart above to show seasonal variations in sightings.</p><p class="attribution" data-v-2e199107>Built by <a href="https://github.com/sidjain1412" target="_blank" rel="noopener" data-v-2e199107>Siddharth Jain</a>. DM me on my <a href="https://www.instagram.com/__sidjain__/" target="_blank" rel="noopener" data-v-2e199107>Instagram</a> if you have any feedback/ ideas!</p><p data-v-2e199107>Data courtesy of eBird, a project of the Cornell Lab of Ornithology.</p></div>',1)]))}const M={},C=(0,b.A)(M,[["render",k],["__scopeId","data-v-2e199107"]]);var w=C,D={name:"SpeciesMap",components:{MonthlyPlot:v,InfoFooter:w},data(){return{selectedSpecies:"",selectedMonth:{value:null,label:"All Months"},months:[{value:null,label:"All Months"},{value:1,label:"January"},{value:2,label:"February"},{value:3,label:"March"},{value:4,label:"April"},{value:5,label:"May"},{value:6,label:"June"},{value:7,label:"July"},{value:8,label:"August"},{value:9,label:"September"},{value:10,label:"October"},{value:11,label:"November"},{value:12,label:"December"}],speciesList:[],map:null,markerCluster:null,heatLayer:null,isDestroying:!1,mapConfig:{center:[19.1433,72.879],zoom:11,tileLayer:{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",options:{maxZoom:19,attribution:"© OpenStreetMap contributors"}}},monthlyData:[],speciesCache:{},isLoading:!1}},async created(){await this.fetchSpeciesList(),this.speciesList.length>0&&(this.selectedSpecies=this.speciesList[0],this.selectedMonth={value:null,label:"All Months"})},async mounted(){document.title="Mumbai Bird Map";try{await this.initializeMap(),this.selectedSpecies&&!this.isDestroying&&await this.loadLocationData()}catch(e){console.error("Failed to initialize map:",e)}},beforeUnmount(){this.cleanup()},watch:{selectedSpecies(e){e&&!this.isDestroying&&this.loadLocationData()},selectedMonth(){this.selectedSpecies&&!this.isDestroying&&this.loadLocationData()}},methods:{cleanup(){this.isDestroying=!0,this.heatLayer&&(this.map.removeLayer(this.heatLayer),this.heatLayer=null),this.markerCluster&&(this.markerCluster.clearLayers(),this.map.removeLayer(this.markerCluster),this.markerCluster=null),this.map&&(this.map.remove(),this.map=null)},async initializeMap(){if(!this.map&&!this.isDestroying){if(await this.$nextTick(),!this.$refs.mapContainer||this.isDestroying)throw new Error("Map container not found or component is being destroyed");this.map=u().map(this.$refs.mapContainer,{fadeAnimation:!0,zoomAnimation:!0,markerZoomAnimation:!1}).setView(this.mapConfig.center,this.mapConfig.zoom),u().tileLayer(this.mapConfig.tileLayer.url,this.mapConfig.tileLayer.options).addTo(this.map),this.markerCluster=u().markerClusterGroup({iconCreateFunction:e=>{const t=e.getAllChildMarkers().reduce(((e,t)=>e+(t.options.count||0)),0);return u().divIcon({html:`<span>${t}</span>`,className:"mycluster",iconSize:u().point(40,40)})},maxClusterRadius:50,spiderfyOnMaxZoom:!0,zoomToBoundsOnClick:!0,chunkedLoading:!0,animate:!1,animateAddingMarkers:!1}),this.isDestroying||this.map.addLayer(this.markerCluster)}},async fetchSpeciesList(){try{const e=await fetch("data/species-list.json");if(!e.ok)throw new Error("Failed to fetch species list");const t=await e.json();this.speciesList=t}catch(e){console.error("Error fetching species list:",e)}},async loadLocationData(){if(this.selectedSpecies){this.isLoading=!0;try{const e=await this.getSpeciesData(this.selectedSpecies);let t=[];t=this.selectedMonth?e[this.selectedMonth]||[]:Object.values(e).flat(),this.monthlyData=Array(12).fill(0).map(((t,a)=>{const i=a+1,s=e[i]||[];return s.reduce(((e,t)=>e+t.count),0)})),await this.updateMap(t)}catch(e){console.error("Error loading location data:",e)}finally{this.isLoading=!1}}},async getSpeciesData(e){if(this.speciesCache[e])return this.speciesCache[e];const t=e.toLowerCase().replace(" ","-"),a=await fetch(`data/species/${t}.json`);if(!a.ok)throw new Error(`Failed to fetch data for ${e}`);const i=await a.json();return this.speciesCache[e]=i,i},async updateMap(e){if(this.isDestroying)return;this.markerCluster&&this.markerCluster.clearLayers(),this.heatLayer&&this.map.hasLayer(this.heatLayer)&&(this.map.removeLayer(this.heatLayer),this.heatLayer=null);const t=[],a=u().latLngBounds();e.forEach((({lat:e,lng:i,count:s})=>{if(this.isDestroying)return;const n=[e,i],o=u().marker(n,{count:s,animate:!1});o.bindPopup(`Count: ${s}`),this.markerCluster&&!this.isDestroying&&this.markerCluster.addLayer(o),t.push([e,i,Math.min(s,30)]),a.extend(n)})),this.isDestroying||t.length>0&&this.map&&(this.heatLayer=u().heatLayer(t,{radius:25,blur:15,maxZoom:10,max:30,gradient:{.4:"blue",.6:"cyan",.8:"lime",.9:"yellow",1:"red"}}),this.isDestroying||(this.map.addLayer(this.heatLayer),this.map.fitBounds(a,{padding:[50,50],animate:!1})))},surpriseMe(){if(this.speciesList.length>0){const e=Math.floor(Math.random()*this.speciesList.length);this.selectedSpecies=this.speciesList[e]}}}};const S=(0,b.A)(D,[["render",c]]);var A=S,O=a(4014);const _=(0,i.Ef)(A);_.component("v-select",O.A),_.mount("#app")}},t={};function a(i){var s=t[i];if(void 0!==s)return s.exports;var n=t[i]={exports:{}};return e[i].call(n.exports,n,n.exports,a),n.exports}a.m=e,function(){var e=[];a.O=function(t,i,s,n){if(!i){var o=1/0;for(h=0;h<e.length;h++){i=e[h][0],s=e[h][1],n=e[h][2];for(var r=!0,l=0;l<i.length;l++)(!1&n||o>=n)&&Object.keys(a.O).every((function(e){return a.O[e](i[l])}))?i.splice(l--,1):(r=!1,n<o&&(o=n));if(r){e.splice(h--,1);var c=s();void 0!==c&&(t=c)}}return t}n=n||0;for(var h=e.length;h>0&&e[h-1][2]>n;h--)e[h]=e[h-1];e[h]=[i,s,n]}}(),function(){a.n=function(e){var t=e&&e.__esModule?function(){return e["default"]}:function(){return e};return a.d(t,{a:t}),t}}(),function(){a.d=function(e,t){for(var i in t)a.o(t,i)&&!a.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:t[i]})}}(),function(){a.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)}}(),function(){var e={524:0};a.O.j=function(t){return 0===e[t]};var t=function(t,i){var s,n,o=i[0],r=i[1],l=i[2],c=0;if(o.some((function(t){return 0!==e[t]}))){for(s in r)a.o(r,s)&&(a.m[s]=r[s]);if(l)var h=l(a)}for(t&&t(i);c<o.length;c++)n=o[c],a.o(e,n)&&e[n]&&e[n][0](),e[n]=0;return a.O(h)},i=self["webpackChunkfrontend"]=self["webpackChunkfrontend"]||[];i.forEach(t.bind(null,0)),i.push=t.bind(null,i.push.bind(i))}();var i=a.O(void 0,[504],(function(){return a(8074)}));i=a.O(i)})();
//# sourceMappingURL=app.0c06c2eb.js.map