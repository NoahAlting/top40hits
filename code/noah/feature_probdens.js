// Load the JSON file
fetch("filtered_song_features.json")
    .then(response => response.json())
    .then(data => {
        console.log(data); // Check the loaded data structure in the console
        createPDFSubplots(data); // Pass the data to the visualization function
    })
    .catch(error => console.error("Error loading JSON:", error));

// Function to create individual subplots for each feature
function createPDFSubplots(data) {
    // Kernel Density Estimation functions
    const kernelDensityEstimator = (kernel, X) => V =>
        X.map(x => [x, d3.mean(V, v => kernel(x - v))]);

    const kernelEpanechnikov = k => v =>
        Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;

    // Calculate bandwidth using Silverman's rule of thumb
    const calculateBandwidth = values => {
        const n = values.length;
        const stdDev = d3.deviation(values);
        return 1.06 * stdDev * Math.pow(n, -1 / 5);
    };

    // Extract features and their values
    const features = Object.keys(data[0]);
    const transformedData = features.map(feature => ({
        feature,
        values: data.map(d => d[feature])
    }));

    // Subplot dimensions
    const width = 400;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    // Create a container for the subplots
    const container = d3.select("#histogram").append("div").attr("class", "subplots-container");

    // Set up a color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(features);

    transformedData.forEach(featureData => {
        // Calculate feature-specific x-axis range
        const featureMin = Math.min(...featureData.values);
        const featureMax = Math.max(...featureData.values);

        // Create a new SVG for each feature
        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Set up scales
        const x = d3.scaleLinear()
            .domain([featureMin, featureMax]) // Feature-specific x-axis range
            .range([margin.left, width - margin.right]);

        const bandwidth = calculateBandwidth(featureData.values);
        const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), x.ticks(100));
        const density = kde(featureData.values);

        // Normalize KDE
        const totalArea = d3.sum(density.map(d => d[1])) * (x(density[1][0]) - x(density[0][0]));
        density.forEach(d => d[1] /= totalArea);

        const maxDensity = Math.max(...density.map(d => d[1]));

        const y = d3.scaleLinear()
            .domain([0, maxDensity * 1.1])
            .range([height - margin.bottom, margin.top]);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5)); // 5 ticks on the y axis
            

        // Fill the area under the KDE line
        svg.append("path")
            .datum(density)
            .attr("fill", colorScale(featureData.feature))
            .attr("fill-opacity", 0.3) // Slight transparency for the filled area
            .attr("stroke", colorScale(featureData.feature))
            .attr("stroke-width", 1.5)
            .attr("d", d3.area()
                .curve(d3.curveBasis)
                .x(d => x(d[0]))
                .y0(y(0)) // Start the area at the baseline
                .y1(d => y(d[1]))); // End at the KDE curve

        // Add titles and labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(featureData.feature);

        // svg.append("text")
        //     .attr("x", width / 2)
        //     .attr("y", height - margin.bottom / 2 + 20)
        //     .attr("text-anchor", "middle")
        //     .style("font-size", "12px")
        //     .text("Feature Values");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", margin.left / 2 - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Probability Density");
    });
}
