function loadAndProcess_FeaturesData_LineGraph(spotifySongs, top40, selected_years, selected_weeks, max_top, selected_feature_or_genre) {
    const plotData = [];
    selected_years.forEach(range_years=>{
        const mergedData = top40
            .filter((row) => +row.Jaar >= range_years[0] && +row.Jaar <= range_years[1])
            .filter((row) => +row.Deze_week <= max_top) 
            .map(top40 => {
                const songData = spotifySongs.find(song => song.Song_ID === top40.Song_ID);
                return songData ? {
                    Song_ID: top40.Song_ID,
                    Jaar: +top40.Jaar,
                    Weeknr: +top40.Weeknr,
                    selected_feature_value: songData[selected_feature_or_genre]
                } : null;
            }).filter(row => row !== null);
            const weeklyAverages = d3.rollup(
                mergedData, 
                values => {
                    const mean = d3.mean(values, v => v.selected_feature_value);
                    let std = d3.deviation(values, v => v.selected_feature_value);
                    std = Math.min(std || 0, max_top); 
                    return {
                        mean_week: mean,
                        std_week: std
                    };
                },
                d => d.Weeknr
            );
        weeklyAverages.forEach((values, week) => {
            plotData.push({
                year_range: range_years,
                week: week,
                avgValue: values.mean_week,
                stdDev: values.std_week
                });
            });
    });
    plotData.sort((a, b) => {
        if (a.year_range[0] !== b.year_range[0]) {
            return a.year_range[0] - b.year_range[0];
        }
        return a.week - b.week;
    });

    return plotData;
}

// Load multiple JSON datasets dynamically
function loadAndVisualize(datasets) {
    Promise.all(datasets.map(dataset => fetch(dataset).then(response => response.json())))
        .then(dataArray => {
            console.log("Loaded Data:", dataArray);
            createPDFSubplots(dataArray); // Pass all datasets to the function
        })
        .catch(error => console.error("Error loading JSONs:", error));
}

// Function to create individual subplots for each feature and add a legend
function createPDFSubplots(dataArray) {
    const kernelDensityEstimator = (kernel, X) => V =>
        X.map(x => [x, d3.mean(V, v => kernel(x - v))]);

    const kernelEpanechnikov = k => v =>
        Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;

    const calculateBandwidth = values => {
        const n = values.length;
        const stdDev = d3.deviation(values);
        // return 1.06 * stdDev * Math.pow(n, -1 / 5);
        return 7 * stdDev * Math.pow(n, -1 / 5);
    };

    const features = Object.keys(dataArray[0][0]); // Extract features from the first dataset
    const transformedData = dataArray.map(dataset =>
        features.map(feature => ({
            feature,
            values: dataset.map(d => d[feature])
        }))
    );

    const width = 400;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    // Create a container for the grid layout
    const container = d3.select("#histogram")
        .append("div")
        .style("display", "grid")
        .style("grid-template-columns", "repeat(4, auto)")
        .style("grid-gap", "20px");

    // Define colors for each dataset using Viridis colormap
    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, dataArray.length - 1]);

    // Create subplots for each feature
    features.forEach((feature, i) => {
        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // Get min and max for x-axis based on all datasets
        const allValues = transformedData.map(dataset => dataset[i].values).flat();
        const featureMin = Math.min(...allValues);
        const featureMax = Math.max(...allValues);

        const x = d3.scaleLinear()
            .domain([featureMin, featureMax])
            .range([margin.left, width - margin.right]);

        // Get max density for y-axis
        let maxDensity = 0;
        const densities = transformedData.map((dataset, datasetIndex) => {
            const values = dataset[i].values;
            const bandwidth = calculateBandwidth(values);
            const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), x.ticks(100));
            const density = kde(values);

            // Normalize density
            const totalArea = d3.sum(density.map(d => d[1])) * (x(density[1][0]) - x(density[0][0]));
            density.forEach(d => d[1] /= totalArea);

            maxDensity = Math.max(maxDensity, ...density.map(d => d[1]));
            return { density, color: colorScale(datasetIndex) };
        });

        const y = d3.scaleLinear()
            .domain([0, maxDensity * 1.1])
            .range([height - margin.bottom, margin.top]);

        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5));

        // Plot densities for each dataset
        densities.forEach(({ density, color }) => {
            svg.append("path")
                .datum(density)
                .attr("fill", "none") // No fill since we're using only lines
                .attr("stroke", color)
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(d => x(d[0]))
                    .y(d => y(d[1])));
        });

        // Add titles and labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(feature);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom / 2 + 20)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Feature Values");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", margin.left / 2 - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Probability Density");
    });

// Add the legend in the 8th slot of the grid
const legendSvg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Calculate the starting y-position to center the legend
const legendPadding = 20; // Padding between legend items
const legendHeight = dataArray.length * legendPadding; // Total height of the legend
const startY = (height - legendHeight) / 2; // Center the legend vertically

// Add legend circles and text
dataArray.forEach((_, datasetIndex) => {
    legendSvg.append("circle")
        .attr("cx", width / 2 - 40) // Center horizontally
        .attr("cy", startY + datasetIndex * legendPadding)
        .attr("r", 6)
        .attr("fill", colorScale(datasetIndex));

    legendSvg.append("text")
        .attr("x", width / 2 - 20) // Position text next to the circle
        .attr("y", startY + datasetIndex * legendPadding + 4) // Align text with the circle
        .text(`Dataset ${datasetIndex + 1}`) // Update label as needed
        .style("font-size", "12px")
        .attr("alignment-baseline", "middle");
});

}

// Example usage: Load dynamic datasets
// loadAndVisualize(["features_70s.json", "features_80s.json", "features_90s.json", "features_00s.json"]);//, "features_10s.json"]); // Replace with dynamic API endpoints
// loadAndVisualize(["fsf68.json", "fsf78.json", "fsf88.json", "fsf98.json", "fsf08.json", "fsf18.json"]);
// loadAndVisualize(["fsf68.json", "fsf18.json"]);
