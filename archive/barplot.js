// Data for the bar plot
const data = [25, 50, 75, 100, 125, 150, 175, 200];

// Dimensions
const width = 400;
const height = 400;
const margin = { top: 20, right: 30, bottom: 40, left: 40 };

// Create SVG container
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Scales
const xScale = d3.scaleBand()
  .domain(data.map((_, i) => i)) // Create a domain based on indices
  .range([0, width - margin.left - margin.right])
  .padding(0.1);

const yScale = d3.scaleLinear()
  .domain([0, d3.max(data)]) // Domain: [0, max value of data]
  .nice() // Makes the axis rounded
  .range([height - margin.top - margin.bottom, 0]); // Reverse range for SVG (top = 0)

// Axes
svg.append("g")
  .call(d3.axisLeft(yScale))
  .attr("class", "y-axis");

svg.append("g")
  .call(d3.axisBottom(xScale).tickFormat((d, i) => `Item ${i + 1}`)) // Custom tick labels
  .attr("class", "x-axis")
  .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`);

// Bars
svg.selectAll(".bar")
  .data(data)
  .enter()
  .append("rect")
  .attr("class", "bar")
  .attr("x", (_, i) => xScale(i))
  .attr("y", d => yScale(d))
  .attr("width", xScale.bandwidth())
  .attr("height", d => height - margin.top - margin.bottom - yScale(d))
  .attr("fill", "steelblue");

console.log("Barplot data:", data);
