const svg = d3.select("#circle") // Target the specific div
    .append("svg")
    .attr("width", 400)
    .attr("height", 400);

// Add a circle
svg.append("circle")
    .attr("cx", 200)
    .attr("cy", 200)
    .attr("r", 50)
    .attr("fill", "blue");
