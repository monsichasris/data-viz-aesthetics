import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import "https://cdn.jsdelivr.net/npm/leaflet@1.9.3/+esm";
import "https://cdn.jsdelivr.net/npm/leaflet.markercluster@1.5.3/+esm";

const app = d3.select("#app")

const mapElement = app
  .append("div")
  .attr("id", "map");

// set map bounds
const bounds = [[-200, -200], [200, 200]];
const startCoordinates = [0, 30];
const startZoomLevel = 2.8;

// create leaflet map
const map = L.map(mapElement.node()).setView(startCoordinates, startZoomLevel);

// add a tile layer to map
const tileLayer = L.tileLayer(
 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
  {
    minZoom: 2.8,
    maxZoom: 8,
    attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
  }
);



// fetch data csv
const earthquakesCSV = await d3.csv("data/all_month.csv");
console.log(earthquakesCSV);

// extract the last word from the place
earthquakesCSV.forEach(d => {
  const placeParts = d.place.split(", ");
  d.lastWord = placeParts[placeParts.length - 1]; // Get the last word
});

// create layer group for earthquakes
const earthquakesLayer = L.layerGroup();






// fetch geojson data
const geojson = await d3.json("data/world_countries.geojson");

// Group earthquakes by last word (Country)
const geojsonCountries = new Set(geojson.features.map(f => f.properties.name));

const earthquakes = d3.rollup(
  earthquakesCSV,
  (v) => v.length,
  (d) => {
    let lastWord = d.lastWord;
    if (lastWord === "Dominican Republic") {
      lastWord = "Dominican Rep.";
    } else if (lastWord === "U.S. Virgin Islands") {
      lastWord = "U.S. Virgin Is.";
    } else if (lastWord === "the Fiji Islands" || lastWord === "Fiji region") {
      lastWord = "Fiji";
    }
    return geojsonCountries.has(lastWord) ? lastWord : "United States";
  }
);

console.log(earthquakes);




// create legend
const legend = d3.select("#legend");
const legendItems = [
  { color: "red", text: "High" },
  { color: "orange", text: "Medium" },
  { color: "yellow", text: "Low" }
];

// legend for magnitude
const magLegend = legend.append("div").attr("class", "legend-mag-container");

magLegend.append("div").style("font-weight", "800").text("Color by Magnitude");

legendItems.forEach(item => {
  const legendItem = magLegend.append("div").attr("class", "legend-mag");
  legendItem.append("span")
    .style("background-color", item.color)
    .style("display", "inline-block")
    .style("width", "10px")
    .style("height", "10px")
    .style("border-radius", "50%")
    .style("margin-right", "5px");
  legendItem.append("span").text(item.text);
});

const depths = earthquakesCSV.map(d => d.depth);
const minDepth = Math.min(...depths);
const maxDepth = Math.max(...depths);

// legend for depth
const depthLegendContainer = legend.append("div").attr("class", "legend-depth-container");
depthLegendContainer.append("div").style("font-weight", "800").text("Size by Depth");

const depthLegend = depthLegendContainer.append("div").attr("class", "legend-depth");
// create container for text
const textContainer = depthLegend.append("div").attr("class", "legend-text-container");
textContainer.append("div").text("High");
textContainer.append("div").text("↓");
textContainer.append("div").text("Low");
for (let i = 0; i < 4; i++) {
  const size = minDepth + (maxDepth - minDepth) * (i / 3);
  const markerSize = Math.sqrt(size) / 10;
  depthLegend.append("div").attr("class", "legend-depth-item")
    .style("background-color", "transparent")
    .style("border", "1px solid red")
    .style("width", `${markerSize}rem`)
    .style("height", `${markerSize}rem`)
    .style("border-radius", "50%")
    .style("position", "absolute")
    .style("bottom", 0)
    .style("left", "60%")
    .style("transform", "translateX(-50%)");
}
depthLegend.style("position", "relative");




// add markers to map
// create color scale for mag data
const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
  .domain(d3.extent(earthquakesCSV, d => d.mag));

// update getMarkerColor function to use color scale
const getMarkerColor = (mag) => colorScale(mag);

for (const earthquake of earthquakesCSV) {
  if (!earthquake.latitude || !earthquake.longitude) {
    continue;
  }
  
  const markerHtmlStyles = `
    width: ${Math.sqrt(earthquake.depth)/10}rem;
    height: ${Math.sqrt(earthquake.depth)/10}rem;
    display: block;
    border-radius: 50%;
    border: 0.5px solid ${getMarkerColor(earthquake.mag)};
    `
  // create custom icon
  const icon = L.divIcon({
    className: "my-custom-pin",
    iconAnchor: [0, 24],
    labelAnchor: [-6, 0],
    popupAnchor: [0, -36],
    html: `<span style="${markerHtmlStyles}" />`
  });

  const marker = L.marker([earthquake.latitude, earthquake.longitude], { icon });

    const placeParts = earthquake.place.split(" of ");
    const place = placeParts[placeParts.length - 1]; // Get the last part after " of "
    marker.bindPopup(`
      <div class="popup-content" style="border-radius: 0px; color: teal;">
      <div style="font-weight: 800;">${place}</div>
      <div>Date: ${earthquake.time.slice(0, 10)}</div>
      <div>Time: ${earthquake.time.slice(11, 16)}</div>
      <div>Depth: ${earthquake.depth}</div>
      <div>Magnitude: ${earthquake.mag}</div>
      </div>`)

    earthquakesLayer.addLayer(marker);

    marker.on('mouseover', function (e) {
      this.getElement().style.backgroundColor = getMarkerColor(earthquake.mag);
      this.getElement().style.zIndex = 1000;
      this.getElement().style.borderRadius = "50%";
      this.getElement().style.width = `${Math.sqrt(earthquake.depth)/10}rem`;
      this.getElement().style.height = `${Math.sqrt(earthquake.depth)/10}rem`;
    });
    
    marker.on('mouseout', function (e) {
      this.getElement().style
      this.getElement().style.backgroundColor = "transparent";
    });
}






// add geojson layer to map
const geojsonLayer = L.geoJSON(geojson, {
  style: function (feature) {
    let countryEq = earthquakes.get(feature.properties.name) || 0;
    return {
      fillColor: 'transparent',
      color: 'transparent',
      weight: 0,
    };
  },
  onEachFeature: function (feature, layer) {
    const countryEqCount = earthquakes.get(feature.properties.name) || 0;
    const popupContent = `<div style="font-weight: 800;">${feature.properties.name}</div>
      <div>Totals earthquakes: ${countryEqCount}</div>`;
      
    const infoDiv = d3.select("#info");
    if (infoDiv.empty()) {
      d3.select("body").append("div").attr("id", "info");
    }

    layer.on('mouseover', function (e) {
      d3.select("#info").html(popupContent).style("display", "block");
      this.setStyle({
      fillColor: 'transparent',
      color: '#5bcfc5',
      weight: 2,
      });

      // Highlight earthquakes with the same last word (country)
      earthquakesCSV.forEach(earthquake => {
      if (earthquake.lastWord === feature.properties.name) {
        const marker = earthquakesLayer.getLayers().find(m => {
        const latLng = m.getLatLng();
        return latLng.lat === +earthquake.latitude && latLng.lng === +earthquake.longitude;
        });
        if (marker) {
        marker.getElement().style.backgroundColor = getMarkerColor(earthquake.mag);
        marker.getElement().style.zIndex = 1000;
        marker.getElement().style.borderRadius = "50%";
        marker.getElement().style.width = `${Math.sqrt(earthquake.depth)/10}rem`;
        marker.getElement().style.height = `${Math.sqrt(earthquake.depth)/10}rem`;
        }
      }

      });
    });

    layer.on('mouseout', function (e) {
      d3.select("#info").html("").style("display", "none");
      this.setStyle({
      fillColor: 'transparent',
      color: 'transparent',
      weight: 0
      });

      // Reset all markers to their original style
      earthquakesLayer.eachLayer(marker => {
      marker.getElement().style.backgroundColor = "transparent";
      });
    });
    console.log(feature.properties.name);
  },
});






// reset button control
L.Control.ResetButton = L.Control.extend({
  options: {
    position: "topleft",
  },
  onAdd: function (map) {
    const container = d3
      .create("div")
      .attr("class", "leaflet-bar leaflet-control");

    const button = container
      .append("a")
      .attr("class", "leaflet-control-button")
      .attr("role", "button")
      .style("cursor", "pointer");

    const icon = button
      .append("img")
      .attr("src", "images/refresh-icon.svg")
      .style("transform", "scale(0.5)");

    button.on("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      map.setView(startCoordinates, startZoomLevel);
    });

    return container.node();
  },
  onRemove: function (map) {},
});
const resetButton = new L.Control.ResetButton();
resetButton.addTo(map);





// add layers to map
map
  .panTo(startCoordinates)
  .setMaxBounds(bounds)
  .addLayer(tileLayer)
  .addLayer(earthquakesLayer)
  .addLayer(geojsonLayer);
