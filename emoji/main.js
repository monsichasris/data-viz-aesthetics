// load first dataset for chart 1 and 2
const data1 = await d3.csv("data/emoji_usage.csv");
console.log("⬇ Dataset 1 ⬇");
console.log(data1);

// load second dataset for chart 3 and 4
const data2 = await d3.csv("data/emoji_scores.csv");
console.log("⬇ Dataset 2 ⬇");
console.log(data2);

// define layout for all charts
const margin = { top: 24, right: 24, bottom: 24, left: 24 };
const width = window.innerWidth * 0.7 - margin.left - margin.right;
const height = window.innerHeight * 0.8 - margin.top - margin.bottom;





//----------first chart - group by platform and age----------//
const chart1 = d3.group(
  data1,
  d => {
    const age = d.age;
    if (age < 20) {
      return "Under 20";
    } else if (age >= 20 && age < 40) {
      return "20-39";
    } else if (age >= 40 && age < 60) {
      return "40-59";
    } else {
      return "60+";
    }
  },
  d => d.platform
);

// Prepare the data for the stacked bar chart
const platforms = Array.from(new Set(data1.map(d => d.platform)));
const ageGroups = ["Under 20", "20-39", "40-59", "60+"]; // Sorted age groups

const stackedData = ageGroups.map(ageGroup => {
  const ageData = chart1.get(ageGroup);
  const platformCounts = platforms.map(platform => {
    const platformData = ageData ? ageData.get(platform) : [];
    return platformData ? platformData.length : 0;
  });
  return { ageGroup, ...Object.fromEntries(platforms.map((platform, i) => [platform, platformCounts[i]])) };
});
console.log("⬇ Chart 1 ⬇");
console.log(stackedData);

// Create the stacked bar chart
const svgStack = d3.select("#chart-1")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom + 80)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Define scales
const xBar = d3.scaleBand()
  .domain(ageGroups)
  .range([0, width])
  .padding(0.32);

const yBar = d3.scaleLinear()
  .domain([0, d3.max(stackedData, d => d3.sum(platforms, platform => d[platform]))])
  .nice()
  .range([height, 0]);

// Define colors
const colorMapping = {
  "Facebook": "#006AFF",
  "WhatsApp": "#25d366",
  "Snapchat": "#FFFC00",
  "Twitter": "#1DA1F2",
  "Instagram": "#833AB4",
  "TikTok": "#ff0050"
};

const color = d3.scaleOrdinal()
  .domain(platforms)
  .range(platforms.map(platform => colorMapping[platform]));

// Create the border for the stacked bar chart
svgStack.selectAll(".stack-border")
  .data(stackedData)
  .enter().append("rect")
  .attr("class", "stack-border")
  .attr("x", d => xBar(d.ageGroup)-12)
  .attr("y", d => yBar(d3.sum(platforms, platform => d[platform]))-12)
  .attr("width", xBar.bandwidth()+24)
  .attr("height", d => height - yBar(d3.sum(platforms, platform => d[platform])) + 40)
  .attr("fill", "black")
  .attr("stroke", "white")
  .attr("stroke-width", 2)
  .attr("rx", 8)
  .attr("ry", 8);

// Add sum text on top of the bar
svgStack.selectAll(".sum-text")
  .data(stackedData)
  .enter().append("text")
  .attr("class", "sum-text")
  .attr("x", d => xBar(d.ageGroup) + xBar.bandwidth() / 2)
  .attr("y", d => yBar(d3.sum(platforms, platform => d[platform])) - 24)
  .attr("text-anchor", "middle")
  .attr("fill", "white")
  .text(d => `${d3.sum(platforms, platform => d[platform])} users`);

// Create the stacked bar chart
const stack = d3.stack()
  .keys(platforms)
  .order(d3.stackOrderNone)
  .offset(d3.stackOffsetNone);

const series = stack(stackedData);

const layers = svgStack.selectAll("g.layer")
  .data(series)
  .enter().append("g")
  .classed("layer", true)
  .attr("fill", d => color(d.key));

// Add the bars to each layer with transition animation
layers.selectAll("rect")
  .data(d => d)
  .enter().append("rect")
  .attr("x", d => xBar(d.data.ageGroup))
  .attr("y", height)
  .attr("height", 0)
  .attr("width", xBar.bandwidth())
  .attr("stroke", "black")
  .attr("stroke-width", 2)
  .attr("rx", 4)
  .attr("ry", 4);
  // Add tooltip events to each rect
  layers.selectAll("rect")
    .on("mouseover", function(event, d) {
      tooltip.style("display", "block")
        .style("color", "black")
        .html(`${d[1] - d[0]} users`);
      tooltip.append("div")
        .style("color", "black")
        .html(`${((d[1] - d[0]) / d3.sum(platforms, platform => d.data[platform]) * 100).toFixed(2)}%`);
      d3.select(this)
        .attr("stroke", "white")
        .attr("stroke-width", 3);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
      d3.select(this)
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    });

// Function to play the transition
function playTransition() {
  layers.selectAll("rect")
    .transition()
    .duration(3000)
    .attr("y", d => yBar(d[1]))
    .attr("height", d => yBar(d[0]) - yBar(d[1]));
}

// Add an intersection observer to trigger the transition when the section is in view
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      playTransition();
      observer.unobserve(entry.target); // Remove observer after animation plays
    }
  });
}, { threshold: 0.5 }); // Adjust threshold as needed

observer.observe(document.querySelector("#chart-1"));

// Create and append the axes
svgStack.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(xBar).tickSize(0))
  .attr("color", "black")
  .selectAll("text")
  .attr("font-size", "14px")
  .attr("fill", "white")
  .attr("dy", "1em");

// Remove the axis line but keep the text
svgStack.selectAll(".domain").remove();

// Add label for xAxis
svgStack.append("text")
  .attr("x", width / 2)
  .attr("y", height + margin.bottom + 40)
  .attr("text-anchor", "middle")
  .attr("font-size", "16px")
  .attr("fill", "white")
  .text("Age");

// Add colors legend to text box
const legend = svgStack.append("g")
  .attr("id", "legend-1")
  .attr("transform", `translate(80, 0)`);

platforms.slice().reverse().forEach((platform, i) => {
  const legendRow = legend.append("g")
    .attr("transform", `translate(0, ${i * 32})`);

  legendRow.append("rect")
    .attr("width", 16)
    .attr("height", 16)
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("fill", color(platform));

  legendRow.append("text")
    .attr("x", 24)
    .attr("y", 12)
    .attr("text-anchor", "start")
    .attr("font-size", "16px")
    .attr("fill", "white")
    .text(platform);
});








//----------second chart - group by context, age, and emoji----------//

const chart2 = Array.from(d3.group(
  data1, 
  d => d.context, 
  d => {
    const age = d.age;
    if (age < 20) {
      return "Under 20";
    } else if (age >= 20 && age < 40) {
      return "20-39";
    } else if (age >= 40 && age < 60) {
      return "40-59";
    } else {
      return "60+";
    }
  },
  d => d.emoji), ([context, ageGroups]) => ({
  context,
  children: Array.from(ageGroups, ([ageGroup, emojis]) => ({
    ageGroup,
    children: Array.from(emojis, ([emoji, entries]) => ({
      emoji,
      size: entries.length
    }))
  }))
}));

console.log("⬇ Chart 2 ⬇");
console.log(chart2);

// Create a packed circle chart for contextData
const svgBubble = d3.select("#chart-2")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom+40)
  .append("g")
  .attr("transform", `translate(${margin.left + 40},${margin.top})`);

  const xBubble = d3.scaleBand()
  .domain(chart2.map(d => d.context))
  .range([0, width-80])
  .padding(0.1);

  const yBubble = d3.scaleBand()
  .domain(["Under 20", "20-39", "40-59", "60+"])
  .range([height, 0])
  .padding(0.1);

  // Create and append the axes
  svgBubble.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xBubble).tickSize(0))
    .attr("font-size", "14px")
    .selectAll("text")
    .attr("fill", "white")
    .attr("dy", "1em");

  // Remove the axis line but keep the text
  svgBubble.selectAll(".domain").remove();

  // Add label for xAxis
  svgBubble.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom + 40)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "16px")
    .attr("font-weight", 600)
    .text("Context");

  svgBubble.append("g")
    .call(d3.axisLeft(yBubble).tickSize(0))
    .attr("font-size", "14px")
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .attr("x", 0)
    .attr("y", margin.left-40)
    .style("text-anchor", "middle");
  
  // Remove the axis line but keep the text
  svgBubble.selectAll(".domain").remove();

  svgBubble.append("text")
    .attr("x", -20)
    .attr("y", margin.top)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "16px")
    .attr("font-weight", 600)
    .text("Age");

// Create a group for each context and age group
const contextGroups = svgBubble.selectAll(".context-group")
.data(chart2)
.enter().append("g")
.attr("class", "context-group")
.attr("transform", d => `translate(${xBubble(d.context)},0)`);

const ageGroupElements = contextGroups.selectAll(".age-group")
  .data(d => d.children)
  .enter().append("g")
  .attr("class", "age-group")
  .attr("transform", d => `translate(0,${yBubble(d.ageGroup)})`);

// Create a hierarchy and pack layout for each age group
ageGroupElements.each(function(d) {
  const group = d3.select(this);

  const top5Data = d.children.sort((a, b) => b.size - a.size).slice(0, 5);
  const root = d3.hierarchy({ children: top5Data })
    .sum(d => d.size)
    .sort((a, b) => b.value - a.value);

  const pack = d3.pack()
    .size([xBubble.bandwidth(), yBubble.bandwidth()])
    .padding(5); // Increase padding to make more space between bubbles

  const nodes = pack(root).leaves();

  // Add emoji with initial scale 0
  group.selectAll("text")
    .data(nodes)
    .enter().append("text")
    .attr("x", d => Math.random() * xBubble.bandwidth())
    .attr("y", d => Math.random() * yBubble.bandwidth())
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 0)
    .attr("cursor", "pointer")
    .text(d => d.data.emoji);
});

// Function to play the transition
function playBubbleTransition() {
  ageGroupElements.selectAll("text")
    .transition()
    .duration(3000)
    .attr("font-size", d => d.r * 2.5)
    .attr("x", d => d.x)
    .attr("y", d => d.y);
}

// Add an intersection observer to trigger the transition when the section is in view
const observerBubble = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      playBubbleTransition();
      observerBubble.unobserve(entry.target); // Remove observer after animation plays
    }
  });
}, { threshold: 0.5 });
observerBubble.observe(document.querySelector("#chart-2"));

// Add tooltip div
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "white")
  .style("opacity", 0.9)
  .style("padding", "8px")
  .style("border-radius", "8px")
  .style("display", "none");

  // Add mouseover and mouseout events to show and hide tooltip
  ageGroupElements.selectAll("text")
    .on("mouseover", function(event, d) {
      tooltip.style("display", "block").style("color", "black")
        .html(`${d.data.emoji}<br>Count: ${d.data.size}`);
        d3.selectAll("text")
        .filter(function() {
            return d3.select(this).text().match(/[^A-Za-z0-9-+\s]/);
        })
        .style("opacity", 0.2);
        d3.select(this)
        .style("opacity", 1);
    // Highlight the same text across the group
    ageGroupElements.selectAll("text")
      .filter(text => text.data.emoji === d.data.emoji)
      .style("opacity", 1);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 10) + "px");
    })
    .on("mouseout", function() {
      tooltip.style("display", "none");
      d3.selectAll("text")
      .style("opacity", 1);
      tooltip.style("display", "none");
    });



        






//----------third chart - radar chart for each emoji----------//

const svgRadar = d3.select("#chart-3")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left+24},${margin.top})`);

// Define the dimensions of the radar chart
const radarSize = Math.min(width, height) / 3;
const radarRadius = radarSize / 2.4;
const levels = 4;
const axes = Object.keys(data2[0]).filter(key => !["emoji", "unicode", "name"].includes(key));
const angleSlice = (2 * Math.PI) / axes.length;

// Find the highest score for each axis
const highestScores = axes.map(axis => {
  return data2.reduce((max, row) => row[axis] > max[axis] ? row : max, data2[0]);
});

// Draw radar charts for the highest score of each axis
highestScores.forEach((row, index) => {
  drawRadarChart(row, index);
});

const emotionColors = {
  "anger": "red",
  "joy": "yellow",
  "anticipation": "pink",
  "surprise": "orange",
  "sadness": "blue",
  "fear": "purple",
  "disgust": "green",
  "trust": "cyan"
};

const colorScale = d3.scaleOrdinal()
  .domain(axes)
  .range(axes.map(axis => emotionColors[axis]));

// Add color legend on top of the chart
const legendRadar = d3.select("#chart-3")
  .append("div")
  .style("display", "flex")
  .style("justify-content", "space-between")
  .style("width", `${width - margin.left + margin.right}px`);

axes.forEach(axis => {
  const legendItem = legendRadar.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("margin", "0 10px");

  legendItem.append("div")
    .style("width", "24px")
    .style("height", "4px")
    .style("background-color", colorScale(axis))
    .style("margin-right", "8px");

  legendItem.append("span")
    .style("font-size", "16px")
    .style("color", "white")
    .text(axis);
});


// Define the radar chart function
function drawRadarChart(data, index) {
  const cols = Math.floor(width / (radarSize + 24));
  const x = (index % cols) * (radarSize + 24) + radarRadius;
  const y = Math.floor(index / cols) * (radarSize + 80) + radarRadius * 2;

  const radarGroup = svgRadar.append("g")
    .attr("transform", `translate(${x},${y})`);

  // Draw the levels
  for (let level = 0; level < levels; level++) {
    const levelRadius = radarRadius * ((level + 1) / levels);
    radarGroup.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", levelRadius)
      .style("fill", "none")
      .style("stroke", "#CDCDCD")
      .style("stroke-width", "0.5px")
      .style("stroke-dasharray", "4,4");
  }

  // Draw the axes
  axes.forEach((axis, i) => {
    const angle = i * angleSlice;
    const x = radarRadius * Math.cos(angle - Math.PI / 2);
    const y = radarRadius * Math.sin(angle - Math.PI / 2);

    radarGroup.append("text")
      .attr("x", x * 1.1)
      .attr("y", y * 1.1)
      .attr("dy", "0.35em")
      .style("font-size", "12px")
      .style("fill", data[axis] == 0 ? "gray" : "#fff")
      .style("text-anchor", "middle")
      .style("display", "none")
      .text(axis)
      .append("tspan")
      .attr("x", x * 1.1)
      .attr("dy", "1.2em")
      .text(data[axis])
      .attr("z-index", 1000);

    // Show the axis text on hover
    radarGroup.on("mouseover", function() {
      d3.select(this)
      .selectAll("text")
      .filter((d, i) => i < axes.length)
      .attr("cursor", "pointer")
      .style("display", "block");
    }).on("mouseout", function() {
      d3.select(this)
      .selectAll("text")
      .filter((d, i) => i < axes.length)
      .style("display", "none");
    });
  });

const radarData = axes.map(axis => ({ axis, value: data[axis] }));

const emotionColors = {
  "anger": "red",
  "joy": "yellow",
  "anticipation": "pink",
  "surprise": "orange",
  "sadness": "blue",
  "fear": "purple",
  "disgust": "green",
  "trust": "cyan"
};

const colorScale = d3.scaleOrdinal()
  .domain(axes)
  .range(axes.map(axis => emotionColors[axis]));


radarGroup.selectAll("line")
  .data(radarData)
  .enter().append("line")
  .attr("x1", 0)
  .attr("y1", 0)
  .attr("x2", 0)
  .attr("y2", 0)
  .style("stroke", d => colorScale(d.axis))
  .style("stroke-width", "4px");

  // Function to play the radar chart transition
  function playRadarTransition() {
    radarGroup.selectAll("line")
      .transition()
      .duration(3000)
      .attr("x2", d => radarRadius * d.value * Math.cos(angleSlice * axes.indexOf(d.axis) - Math.PI / 2))
      .attr("y2", d => radarRadius * d.value * Math.sin(angleSlice * axes.indexOf(d.axis) - Math.PI / 2));
  }

  // Add an intersection observer to trigger the transition when the section is in view
  const observerRadar = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        playRadarTransition();
        observerRadar.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  observerRadar.observe(document.querySelector("#chart-3"));

// add img for emoji doesn't work
  if (data.emoji == "☺")  {
    radarGroup.append("image")
      .attr("xlink:href", "assets/smiling-face.png")
      .attr("x", -20)
      .attr("y", -radarRadius - 60)
      .attr("width", 40)
      .attr("height", 40);
  } else if (data.emoji == "‼") {
    radarGroup.append("image")
      .attr("xlink:href", "assets/double-exclamation-mark.png")
      .attr("x", -20)
      .attr("y", -radarRadius - 60)
      .attr("width", 40)
      .attr("height", 40);
  } else {
    // Add emoji
    radarGroup.append("text")
      .attr("x", 0)
      .attr("y", -radarRadius - 40)
      .attr("dy", "0.35em")
      .style("font-size", "40px")
      .style("text-anchor", "middle")
      .style("fill", "#fff")
      .text(data.emoji);
  }

}



//----------fourth chart - scatter plot to compare two sentiments----------//

const svgScatter = d3.select("#chart-4")
  .append("svg")
  .attr("width", width + margin.left + margin.right+24)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left+24},${margin.top})`);

// Define the initial axes variables
let xVariable = "joy";
let yVariable = "surprise";

// Create dropdown menus for selecting the axes variables
const variables = Object.keys(data2[0]).filter(key => !["emoji", "unicode", "name"].includes(key));

// Create x-axis dropdown
d3.select("#chart-4")
  .append("select")
  .attr("id", "x-axis-dropdown")
  .attr("class", "dropdown")
  .style("position", "absolute")
  .style("left", `${width + margin.left + margin.right+64}px`)
  .style("top", `${height + margin.top + 120}px`)
  .selectAll("option")
  .data(variables)
  .enter().append("option")
  .text(d => d)
  .attr("value", d => d)
  .property("selected", d => d === xVariable);

// Create y-axis dropdown
d3.select("#chart-4")
  .append("select")
  .attr("id", "y-axis-dropdown")
  .attr("class", "dropdown")
  .style("position", "absolute")
  .style("left", `${margin.left + 24}px`)
  .style("top", `${margin.top + 80}px`)
  .selectAll("option")
  .data(variables)
  .enter().append("option")
  .text(d => d)
  .attr("value", d => d)
  .property("selected", d => d === yVariable);

// Define scales
const x = d3.scaleLinear()
  .range([0, width])
  .domain([0,1])

const y = d3.scaleLinear()
  .range([height, 0])
  .domain([0,1]);

// Create and append the axes
svgScatter.append("g")
  .attr("class", "axis")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(x))
  .attr("color", "white");

svgScatter.append("g")
  .attr("class", "axis")
  .call(d3.axisLeft(y))
  .attr("color", "white");

// Add tooltip div
const tooltipScatter = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("background", "white")
  .style("color", "black")
  .style("opacity", 0.9)
  .style("padding", "16px")
  .style("border-radius", "8px")
  .style("display", "none");

// Function to update the scatter plot based on the selected variables
function updateScatterPlot() {

  // Bind the data
  const emojis = svgScatter.selectAll("text")
    .filter(function() {
      // Filter out the axis text
      return !d3.select(this).text().match(/^[A-Za-z0-9-+\s]/);
    })
    .data(data2);

    emojis.enter()
    .append("text")
    .attr("x", () => Math.random() * width)
    .attr("y", () => Math.random() * height)
    .merge(emojis)
    .text(d => d.emoji)
    .style("font-size", "0")
    .style("cursor", "pointer");

  // Function to play the scatter plot transition
  function playScatterTransition() {
    svgScatter.selectAll("text").filter(function() {
      return !d3.select(this).text().match(/^[A-Za-z0-9-+\s]/);
    })
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .style("font-size", "24px")
      .style("fill", "white")
      .attr("x", d => x(+d[xVariable]))
      .attr("y", d => y(+d[yVariable]));
  }

  // Add an intersection observer to trigger the transition when the section is in view
  const observerScatter = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        playScatterTransition();
        observerScatter.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  observerScatter.observe(document.querySelector("#chart-4"));

  // Remove old emojis
  emojis.exit().remove();

  // Add tooltip events
  svgScatter.selectAll("text")
    .on("mouseover", function(event, d) {
      tooltipScatter.style("display", "block")
        .html(`<text style ="font-weight: 600">${yVariable}: ${d[yVariable]}<br>${xVariable}: ${d[xVariable]}</text><br>` +
          variables.filter(v => v !== xVariable && v !== yVariable).map(v => `${v}: ${d[v]}`).join("<br>"))
      
      // Highlight the reference lines
      svgScatter.append("line")
        .attr("class", "reference-line")
        .attr("x1", x(d[xVariable]))
        .attr("x2", x(d[xVariable]))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        .attr("stroke-dasharray", "4,4");

      svgScatter.append("line")
        .attr("class", "reference-line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(d[yVariable]))
        .attr("y2", y(d[yVariable]))
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        .attr("stroke-dasharray", "4,4");

      d3.select(this)
        .attr("cursor", "pointer")
        .style("filter", "url(#glow)")
        .style("font-size", "32px");
    })

    .on("mousemove", function(event) {
      tooltipScatter.style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 10) + "px");
    })
    
    .on("mouseout", function() {
      tooltipScatter.style("display", "none");
      svgScatter.selectAll(".reference-line").remove(); 
      d3.select(this)
        .style("filter", "none")
        .style("font-size", "24px");
    });

// Add a filter definition for the glowing effect
const defs = svgScatter.append("defs");

const filter = defs.append("filter")
  .attr("id", "glow");

filter.append("feGaussianBlur")
  .attr("stdDeviation", "3.5")
  .attr("result", "coloredBlur");

const feMerge = filter.append("feMerge");

feMerge.append("feMergeNode")
  .attr("in", "coloredBlur");

feMerge.append("feMergeNode")
  .attr("in", "SourceGraphic");
}

// Initial update of the scatter plot
updateScatterPlot();

document.querySelector("#x-axis-dropdown").addEventListener("change", (event) => {
  xVariable = event.target.value;
  console.log(`xVariable changed to: ${xVariable}`);
  updateScatterPlot();
});

document.querySelector("#y-axis-dropdown").addEventListener("change", (event) => {
  yVariable = event.target.value;
  console.log(`yVariable changed to: ${yVariable}`);
  updateScatterPlot();
});