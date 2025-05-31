// Function to fetch and process a single file
/* global RiTa */
const fetchAndProcessFile = async (filePath) => {
  const text = await d3.text(filePath);
  const tokenized = RiTa.tokenize(text).filter((d) => {
    return RiTa.isStopWord(d) === false && RiTa.isPunct(d) === false && d !== '\n' && RiTa.isNoun(d) === true && d.toLowerCase() !== 'applause';
  });

  const words = d3.rollup(
    tokenized,
    (v) => v.length,
    (d) => {
      return d.toUpperCase();
    }
  );

  // Filter out words that only appear less than 10 times
  const filteredWords = Array.from(words).filter(([word, count]) => count >= 3);

  // Sort the filtered words by count in descending order
  filteredWords.sort((a, b) => b[1] - a[1]);
  return filteredWords;
};

//extract the year from the filename
let extractYear = (filename) => {
  const match = filename.match(/_(\d{4})\.txt$/);
  return match ? parseInt(match[1], 10) : null;
};

let fileNames = [];
let name, year;

// Function to fetch and process all files in the folder
const fetchData = async () => {
  fileNames = [
    "Adams_1797.txt", "Adams_1798.txt", "Adams_1799.txt", "Adams_1800.txt", "Adams_1825.txt", "Adams_1826.txt", "Adams_1827.txt", "Adams_1828.txt", "Arthur_1881.txt", "Arthur_1882.txt", "Arthur_1883.txt", "Arthur_1884.txt", "Biden_2021.txt", "Biden_2022.txt", "Biden_2023.txt", "Buchanan_1857.txt", "Buchanan_1858.txt", "Buchanan_1859.txt", "Buchanan_1860.txt", "Buren_1837.txt", "Buren_1838.txt", "Buren_1839.txt", "Buren_1840.txt", "Bush_1989.txt", "Bush_1990.txt", "Bush_1991.txt", "Bush_1992.txt", "Bush_2001.txt", "Bush_2002.txt", "Bush_2003.txt", "Bush_2004.txt", "Bush_2005.txt", "Bush_2006.txt", "Bush_2007.txt", "Bush_2008.txt", "Carter_1978.txt", "Carter_1979.txt", "Carter_1980.txt", "Carter_1981.txt", "Cleveland_1885.txt", "Cleveland_1886.txt", "Cleveland_1887.txt", "Cleveland_1888.txt", "Cleveland_1893.txt", "Cleveland_1894.txt", "Cleveland_1895.txt", "Cleveland_1896.txt", "Clinton_1993.txt", "Clinton_1994.txt", "Clinton_1995.txt", "Clinton_1996.txt", "Clinton_1997.txt", "Clinton_1998.txt", "Clinton_1999.txt", "Clinton_2000.txt", "Coolidge_1923.txt", "Coolidge_1924.txt", "Coolidge_1925.txt", "Coolidge_1926.txt", "Coolidge_1927.txt", "Coolidge_1928.txt", "Eisenhower_1954.txt", "Eisenhower_1955.txt", "Eisenhower_1956.txt", "Eisenhower_1957.txt", "Eisenhower_1958.txt", "Eisenhower_1959.txt", "Eisenhower_1960.txt", "Eisenhower_1961.txt", "Fillmore_1850.txt", "Fillmore_1851.txt", "Fillmore_1852.txt", "Ford_1975.txt", "Ford_1976.txt", "Ford_1977.txt", "Grant_1869.txt", "Grant_1870.txt", "Grant_1871.txt", "Grant_1872.txt", "Grant_1873.txt", "Grant_1874.txt", "Grant_1875.txt", "Grant_1876.txt", "Harding_1921.txt", "Harding_1922.txt", "Harrison_1889.txt", "Harrison_1890.txt", "Harrison_1891.txt", "Harrison_1892.txt", "Hayes_1877.txt", "Hayes_1878.txt", "Hayes_1879.txt", "Hayes_1880.txt", "Hoover_1929.txt", "Hoover_1930.txt", "Hoover_1931.txt", "Hoover_1932.txt", "Jackson_1829.txt", "Jackson_1830.txt", "Jackson_1831.txt", "Jackson_1832.txt", "Jackson_1833.txt", "Jackson_1834.txt", "Jackson_1835.txt", "Jackson_1836.txt", "Jefferson_1801.txt", "Jefferson_1802.txt", "Jefferson_1803.txt", "Jefferson_1804.txt", "Jefferson_1805.txt", "Jefferson_1806.txt", "Jefferson_1807.txt", "Jefferson_1808.txt", "Johnson_1865.txt", "Johnson_1866.txt", "Johnson_1867.txt", "Johnson_1868.txt", "Johnson_1964.txt", "Johnson_1965.txt", "Johnson_1966.txt", "Johnson_1967.txt", "Johnson_1968.txt", "Johnson_1969.txt", "Kennedy_1962.txt", "Kennedy_1963.txt", "Lincoln_1861.txt", "Lincoln_1862.txt", "Lincoln_1863.txt", "Lincoln_1864.txt", "Madison_1809.txt", "Madison_1810.txt", "Madison_1811.txt", "Madison_1812.txt", "Madison_1813.txt", "Madison_1814.txt", "Madison_1815.txt", "Madison_1816.txt", "McKinley_1897.txt", "McKinley_1898.txt", "McKinley_1899.txt", "McKinley_1900.txt", "Monroe_1817.txt", "Monroe_1818.txt", "Monroe_1819.txt", "Monroe_1820.txt", "Monroe_1821.txt", "Monroe_1822.txt", "Monroe_1823.txt", "Monroe_1824.txt", "Nixon_1970.txt", "Nixon_1971.txt", "Nixon_1972.txt", "Nixon_1973.txt", "Nixon_1974.txt", "Obama_2009.txt", "Obama_2010.txt", "Obama_2011.txt", "Obama_2012.txt", "Obama_2013.txt", "Obama_2014.txt", "Obama_2015.txt", "Obama_2016.txt", "Pierce_1853.txt", "Pierce_1854.txt", "Pierce_1855.txt", "Pierce_1856.txt", "Polk_1845.txt", "Polk_1846.txt", "Polk_1847.txt", "Polk_1848.txt", "Reagan_1982.txt", "Reagan_1983.txt", "Reagan_1984.txt", "Reagan_1985.txt", "Reagan_1986.txt", "Reagan_1987.txt", "Reagan_1988.txt", "Roosevelt_1901.txt", "Roosevelt_1902.txt", "Roosevelt_1903.txt", "Roosevelt_1904.txt", "Roosevelt_1905.txt", "Roosevelt_1906.txt", "Roosevelt_1907.txt", "Roosevelt_1908.txt", "Roosevelt_1934.txt", "Roosevelt_1935.txt", "Roosevelt_1936.txt", "Roosevelt_1937.txt", "Roosevelt_1938.txt", "Roosevelt_1939.txt", "Roosevelt_1940.txt", "Roosevelt_1941.txt", "Roosevelt_1942.txt", "Roosevelt_1943.txt", "Roosevelt_1944.txt", "Roosevelt_1945.txt", "Taft_1909.txt", "Taft_1910.txt", "Taft_1911.txt", "Taft_1912.txt", "Taylor_1849.txt", "Truman_1946.txt", "Truman_1947.txt", "Truman_1948.txt", "Truman_1949.txt", "Truman_1950.txt", "Truman_1951.txt", "Truman_1952.txt", "Truman_1953.txt", "Trump_2017.txt", "Trump_2018.txt", "Trump_2019.txt", "Trump_2020.txt", "Tyler_1841.txt", "Tyler_1842.txt", "Tyler_1843.txt", "Tyler_1844.txt", "Washington_1791.txt", "Washington_1792.txt", "Washington_1793.txt", "Washington_1794.txt", "Washington_1795.txt", "Washington_1796.txt", "Wilson_1913.txt", "Wilson_1914.txt", "Wilson_1915.txt", "Wilson_1916.txt", "Wilson_1917.txt", "Wilson_1918.txt", "Wilson_1919.txt", "Wilson_1920.txt"
  ];

// Sort the filenames by the extracted year
fileNames.sort((a, b) => extractYear(b) - extractYear(a));

// Fetch and process all files
const filePaths = fileNames.map(fileName => `./text/${fileName}`);
const allData = await Promise.all(filePaths.map(fetchAndProcessFile));
  return allData;
};

const data = await fetchData();

const app = d3.select('#app');

// Render the data in separate columns
data.forEach((fileData, index) => {
  const column = app.append('div').attr('class', 'column');

  // Extract the filename and year
  const filename = fileNames[index];
  // Remove text after _ in filename
  name = filename.split('_')[0];
  // Extract year from filename
  year = extractYear(filename);

  // Add the filename as a header for the column
  const headerDiv = column.append('div').attr('class', 'legend');
  headerDiv.append('text')
    .attr('class', 'president')
    .text(`${name}`);
  headerDiv.append('text')
    .attr('class', 'year')
    .text(`${year}`);
 
  // Create a container div for all words
  const wordsContainer = column.append('div').attr('class', 'words-container');

  // Add the words as div elements with font size based on count
  const maxCount = d3.max(fileData, d => d[1]);
  const scaleFontWeight = d3.scaleLinear()
    .domain([2, maxCount])
    .range([2050, 1979]);

  wordsContainer.selectAll('div')
    .data(fileData)
    .join('div')
    .attr('class', 'word-stack')
    .text(d => d[0])
    .style('font-variation-settings', d => `"YEAR" ${scaleFontWeight(d[1])}`)
    .style('font-size', d => `${d[1]}px`)
    .style('text-align', 'center')
    .on('mouseover', function(event, d) {
      const word = d[0];
      d3.selectAll('.word-stack')
        .filter(function(data) {
          return data[0] === word;
        })
        .style('cursor', 'pointer')
        .style('color', 'blue');
    })
    .on('mouseout', function(event, d) {
      const word = d[0];
      d3.selectAll('.word-stack')
      .filter(function(data) {
        return data[0] === word && !d3.select(this).classed('selected');
      })
      .style('color', '#333333');

      d3.selectAll('.word-stack')
        .filter(function(data) {
          return data[0] === word && d3.select(this).classed('selected');
        })
        .style('color', 'red');
    })
    .on('click', function(event, d) {
      const word = d[0];
      d3.selectAll('.word-stack')
        .classed('selected', false)
        .style('color', '#333333');

      d3.selectAll('.word-stack')
        .filter(function(data) {
          return data[0] === word;
        })
        .classed('selected', true)
        .style('color', 'red');

      const wordData = data.map((fileData, index) => {
        const wordEntry = fileData.find(([w]) => w === word);
        const maxCount = d3.max(fileData, d => d[1]);
        return {
          year: extractYear(fileNames[index]),
          count: wordEntry ? wordEntry[1] : 0,
          word: word,
          max: maxCount
        };
      });

      // Remove old chart if it exists
      d3.selectAll('svg').remove();

      createLineChart(wordData);
      console.log(wordData);
    });
});

// create line chart when word is clicked
function createLineChart(wordData) {
  const margin = {top: 40, right: 40, bottom: 60, left: 80};
  const width = 600 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const x = d3.scaleLinear()
    .domain(d3.extent(wordData, d => d.year))
    .range([width, 0]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(wordData, d => d.count)])
    .range([height, 0]);

  const line = d3.line()
    .curve(d3.curveMonotoneX) // Apply smoothing
    .x(d => x(d.year))
    .y(d => y(d.count));

  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  svg.append('path')
    .datum(wordData)
    .attr('fill', 'none')
    .attr('stroke', 'red')
    .attr('stroke-width', 1.5)
    .attr('d', line);

  // add x and y axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')));

  svg.append('g')
    .call(d3.axisLeft(y).tickSize(0).tickPadding(8));

  // add x axis label
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + margin.top)
    .style('text-anchor', 'middle')
    .style('font-size', '14px')
    .text('Year');

  svg.append('text')
    .attr('x', 0)
    .attr('y', height + margin.top)
    .style('font-size', '10px')
    .text('Present ←');

  svg.append('text')
    .attr('x', width)
    .attr('y', height + margin.top)
    .style('text-anchor', 'end')
    .style('font-size', '10px')
    .text('→ Past');

  // add y axis label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left + 20)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('font-size', '14px')
    .text('Count');

  // add title as word clicked
  const avgCount = d3.median(wordData, d => d.count);

  const scaleAvgWeight = d3.scaleLinear()
    .domain([2, wordData[0].max])
    .range([2050, 1979]);

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 0)
    .attr('text-anchor', 'middle')
    .text(wordData[0].word)
    .style('font-family', 'climate-crisis-variable')
    .style('font-size', '20px')
    .style('font-variation-settings', `"YEAR" ${scaleAvgWeight(avgCount)}`);

  // Create a tooltip div that is hidden by default
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Add lines for each data point and tooltips
  svg.selectAll(".hover-line")
    .data(wordData)
    .enter()
    .append("line")
    .attr("class", "hover-line")
    .attr("x1", d => x(d.year))
    .attr("x2", d => x(d.year))
    .attr("y1", 0)
    .attr("y2", height)
    .attr("stroke", "transparent")
    .attr("stroke-width", 5)
    .on("mouseover", function(event, d) {
      tooltip.style("opacity", .9);
      tooltip.html(`Year: ${d.year}<br>Count: ${d.count}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");

      d3.select(this)
        .attr("stroke", "gray")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4");
    })
    .on("mouseout", function() {
      tooltip.style("opacity", 0);
      d3.select(this)
        .attr("stroke", "transparent");
    });

  // add close button
  svg.append('text')
    .attr('x', width + 24)
    .attr('y', -8)
    .attr('text-anchor', 'end')
    .style('cursor', 'pointer')
    .style('font-size', '24px')
    .text('✖')
    .on('click', function() {
      d3.selectAll('svg').remove();
      d3.selectAll('.word-stack')
        .style('color', '#333333');
    });
};
