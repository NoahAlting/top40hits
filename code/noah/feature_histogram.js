// Load the JSON file
fetch("filtered_song_features.json")
    .then(response => response.json())
    .then(data => {
        console.log(data); // Check the loaded data structure in the console
        createHistogram(data); // Pass the data to the visualization function
    })
    .catch(error => console.error("Error loading JSON:", error));

// Function to create the histogram
function createHistogram(data) {
    // Binning function
    const binData = (values, bins = 5) => {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / bins;

        // Create bins
        const binCounts = Array(bins).fill(0);
        values.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
            binCounts[binIndex]++;
        });

        return binCounts.map((count, index) => ({
            binStart: min + index * binSize,
            binEnd: min + (index + 1) * binSize,
            count
        }));
    };

    // Transform and bin data
    const transformedData = Object.keys(data[0]).map(feature => ({
        feature: feature,
        bins: binData(data.map(d => d[feature]), 5) // 5 bins
    }));

    // SVG setup
    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    const svg = d3
        .select("#histogram")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const x0 = d3
        .scaleBand()
        .domain(transformedData.map(d => d.feature))
        .range([margin.left, width - margin.right])
        .paddingInner(0.1);

    const x1 = d3
        .scaleBand()
        .domain(d3.range(5)) // 5 bins
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3
        .scaleLinear()
        .domain([0, d3.max(transformedData, d => d3.max(d.bins, b => b.count))])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // X and Y axes
    const xAxis = g =>
        g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x0))
            .selectAll("text")
            // .attr("transform", "rotate(-45)")
            .style("text-anchor", "middle");

    const yAxis = g =>
        g
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove());

    svg.append("g").call(xAxis);
    svg.append("g").call(yAxis);

    // Viridis color scale for bins
    const color = d3.scaleSequential(d3.interpolateViridis).domain([0, 4]); // Map bin indices to Viridis

    // Add bars
    svg.append("g")
        .selectAll("g")
        .data(transformedData)
        .join("g")
        .attr("transform", d => `translate(${x0(d.feature)},0)`)
        .selectAll("rect")
        .data(d => d.bins.map((bin, index) => ({ ...bin, index })))
        .join("rect")
        .attr("x", d => x1(d.index))
        .attr("y", d => y(d.count))
        .attr("width", x1.bandwidth())
        .attr("height", d => y(0) - y(d.count))
        .attr("fill", d => color(d.index)); // Use Viridis colormap for bins

    // Add axes labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height)
        .attr("text-anchor", "middle")
        .text("Features");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .text("Count");
}
