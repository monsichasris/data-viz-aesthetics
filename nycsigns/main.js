import "./style.css";
import * as d3 from "d3";

const chart = d3.select("#chart");
const width = 1200;
const height = 600;
const margin = { top: 80, right: 80, bottom: 80, left: 120 };

const svg = chart
  .append("svg")
  .attr("viewBox", "0 0 1200 600")
  .attr("width", width)
  .attr("height", height);

// create a query to filter the data
const query = `SELECT * 
               WHERE (created_date BETWEEN "2024-06-01T00:00:00" AND "2024-09-30T23:59:59") 
               AND (caseless_starts_with(\`complaint_type\`, 'Street Sign')
               AND caseless_ne(\`borough\`, 'Unspecified'))
               LIMIT ${4000} OFFSET ${0}`;

// create a url to fetch the data
const url = `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$query=${encodeURIComponent(query)}`;

// get data from the url
const data = await d3.json(url);
console.log(data);

// group data by borough and complaint type
const groupData = d3.rollup(
  data,
  v => v.length,
  d => d.borough,
  d => d.complaint_type
);
console.log(groupData);

// convert grouped data for stacking
const stackData = Array.from(groupData, ([borough, complaints]) => {
  const result = { borough };
  complaints.forEach((count, type) => {
    result[type] = count;
  });
  return result;
});

// define the stack function
const stack = d3.stack()
  .keys(d3.union(...stackData.map(d => Object.keys(d).slice(1))))
  .value((d, key) => d[key] || 0);

// define the series
const series = stack(stackData);

// calculate the total for each borough
stackData.forEach(d => {
  d.total = d3.sum(series.map(s => s.find(item => item.data.borough === d.borough)[1] - s.find(item => item.data.borough === d.borough)[0]));
});

// sort the data in descending order based on the total value
stackData.sort((a, b) => b.total - a.total);





// set up scales
const xScale = d3
  .scaleLinear()
  .domain([0,d3.max(stackData, d => d.total)])
  .range([margin.left, width-margin.right])
  .nice();

const yScale = d3
  .scaleBand()
  .domain(stackData.map(d => d.borough))
  .range([margin.top, height-margin.bottom])
  .paddingInner(0.4)
  .paddingOuter(0.2);

// define color scale
const colorType = {
  'Street Sign - Dangling': '#2d9c40', // green
  'Street Sign - Damaged': '#7a543d', // brown
  'Street Sign - Missing': '#ababab' // grey
}

const colorScale = d3
  .scaleOrdinal()
  .domain(Object.keys(colorType))
  .range(Object.values(colorType));





// create a legend container
const legend = svg.append('g')
  .attr('class', 'legend')
  .attr('transform', `translate(${margin.left-120}, ${margin.top-64})`);

// append legend items
const legendItems = legend.selectAll('.legend-item')
  .data(colorScale.domain())
  .enter()
  .append('g')
  .attr('class', 'legend-item')
  .attr('transform', (d, i) => `translate(${i * 120},0)`);

// append colored rectangles
legendItems.append('rect')
  .attr('x', 0)
  .attr('y', 0)
  .attr('width', 24)
  .attr('height', 16)
  .attr('rx', 2)
  .attr('ry', 2)
  .attr('fill', colorScale);

// append text labels
legendItems.append('text')
  .attr('x', 32)
  .attr('y', 9)
  .attr('dy', '0.25em')
  .text(d => d.slice(14))
  .attr('font-size', '12px')
  .attr('font-weight', 'bold');





// create the tooltip
const tooltip = d3
  .select('body')
  .append('div')
  .attr('class', 'tooltip')
  .style('position', 'absolute')
  .style('background-color', 'white')
  .style('border-radius', '4px')
  .style('box-shadow', '0 0 4px rgba(0,0,0,0.1)')
  .style('font-size', '12px')
  .style('padding', '8px')
  .style('display', 'none')
  .style('pointer-events', 'none');

// append layers in the correct order
const bars_layer = svg.append('g');
const axes_layer = svg.append('g');

// append bars
bars_layer
  .selectAll("g")
  .data(series)
  .join("g")
  .attr('fill', d => colorScale(d.key))
  .selectAll('rect')
  .data(d => d)
  .join('rect')
  .attr('x', d => xScale(d[0]))
  .attr('y', d => yScale(d.data.borough))
  .attr('width', d => xScale(d[1]) - xScale(d[0]))
  .attr('height', yScale.bandwidth())
  .attr('rx', 4)
  .attr('ry', 4)

  // add interactive to tooltip
  .on('mouseover', function(event, d) {
    tooltip.style('display', 'block')
      .html(`
        ${d.data.borough}<br>
        <b>${d3.select(this.parentNode).datum().key.slice(13)}</b>: ${d[1] - d[0]}
        `);

      const rect = d3.select(this);

    if (d3.select(this.parentNode).datum().key === 'Street Sign - Dangling') {
      const cx = +rect.attr('x') + rect.attr('width') / 2;
      const cy = +rect.attr('y') + rect.attr('height') / 2;
      rect.attr('transform', `rotate(15, ${cx}, ${cy})`);
    } else if (d3.select(this.parentNode).datum().key === 'Street Sign - Missing') {
      rect
      .attr('fill', 'rgba(255,255,255,0')
      .attr('stroke', 'gray')
      .attr('stroke-dasharray', '4,2')
    } else if (d3.select(this.parentNode).datum().key === 'Street Sign - Damaged') {
      svg.append('image')
        .attr('xlink:href', '/texture.jpg')
        .attr('x', rect.attr('x'))
        .attr('y', rect.attr('y'))
        .attr('width', rect.attr('width'))
        .attr('height', rect.attr('height'))
        .attr('preserveAspectRatio', 'none') 
        .style("mix-blend-mode", "color-burn")
        .attr('class', 'texture');
    }
    
  })
  .on('mousemove', function(event) {
    tooltip.style('left', (event.pageX + 8) + 'px')
      .style('top', (event.pageY - 8) + 'px');
  })
  .on('mouseout', function() {
    tooltip.style('display', 'none');
    d3
    .select(this)
    .attr('transform', null)
    .attr('fill', d => colorScale(d3.select(this.parentNode).datum().key)) // Reset fill color
      .attr('stroke', null) // Reset stroke
      .attr('stroke-dasharray', null); // Reset stroke-dasharray
    svg.selectAll('.texture').remove(); // Remove texture
  });

// append text totals
bars_layer
  .selectAll('.total')
  .data(stackData)
  .enter()
  .append('text')
  .attr('x', d => xScale(d.total) + 12) // position to the right of the stack
  .attr('y', d => yScale(d.borough) + yScale.bandwidth() / 2) // centered vertically
  .attr('dy', '0.35em')
  .attr('font-size', '12px')
  .text(d => d.total);





// Y axis
axes_layer
  .append('g')
  .attr('transform',`translate(${margin.left}, 0)`) 
  .call(d3.axisLeft(yScale))
  .selectAll('text')
  .attr('font-family', 'interstate')
  .attr('font-size', '12px');

axes_layer
  .append('text')
  .attr('x', margin.left-80)
  .attr('y', margin.top)
  .attr('text-anchor', 'right')
  .text('BOROUGH')
  .attr('font-size', '12px')
  .attr('font-weight', 'bold');

// X axis
axes_layer
  .append('g')
  .attr('transform',`translate(0, ${height-margin.bottom})`)
  .call(d3.axisBottom(xScale)
    .tickValues(xScale.ticks().filter((d, i) => i % 2 === 0)))
  .selectAll('text')
  .attr('font-family', 'interstate');

axes_layer
  .append('text')
  .attr('x', width / 2 +40)
  .attr('y', height - margin.bottom+40)
  .attr('text-anchor', 'middle')
  .text('NUMBER OF COMPLAINTS')
  .attr('font-size', '12px')
  .attr('font-weight', 'bold');