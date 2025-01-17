// Load and merge data from two CSV files
async function loadAndMergeData() {
    const spotifySongs = await d3.csv("../../data/spotify_songs_with_ids.csv", d3.autoType);
    const top40 = await d3.csv("../../data/top40_with_ids.csv", d3.autoType);

    // Merge data based on Song_ID
    return top40.map(top40Row => {
        const spotifyRow = spotifySongs.find(song => song.Song_ID === top40Row.Song_ID);
        if (!spotifyRow) return null;

        return {
            Song_ID: top40Row.Song_ID,
            Jaar: +top40Row.Jaar,
            Weeknr: +top40Row.Weeknr,
            Longevity: +top40Row.Aantal_weken,
            Deze_week: +top40Row.Deze_week,
            ...spotifyRow,
        };
    }).filter(row => row !== null);
}

// Process data for probability density
function processDensityData(data, selectedYears, selectedTop, features) {
    // Filter data based on global variables
    const filteredData = data.filter(row => row.Deze_week <= selectedTop);

    // Group data by year range and feature
    return features.map(feature => ({
        feature,
        densities: selectedYears.map(([start, end]) => ({
            range: [start, end],
            values: filteredData
                .filter(row => row.Jaar >= start && row.Jaar <= end)
                .map(row => row[feature])
                .filter(v => v !== undefined && v !== null)
        }))
    }));
}

// Create individual subplots for each feature
function createPDFSubplots(dataArray) {
    const kernelDensityEstimator = (kernel, X) => V =>
        X.map(x => [x, d3.mean(V, v => kernel(x - v))]);

    const kernelEpanechnikov = k => v =>
        Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;

    const calculateBandwidth = (values, factor = 8) => {
        const n = values.length;
        const stdDev = d3.deviation(values);
        return factor * stdDev * Math.pow(n, -1 / 5);
    };

    const width = 300;
    const height = 200;
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    const detailedWidth = 800;
    const detailedHeight = 600;
    const detailedMargin = { top: 50, right: 50, bottom: 70, left: 70 }; // New margin for detailed plot

    // Create a container for the grid layout
    const container = d3.select("#histogram")
        .append("div")
        .style("display", "grid")
        .style("grid-template-columns", "repeat(4, auto)")
        .style("grid-gap", "20px");

    // Create a persistent detailed plot frame
    const detailedPlotContainer = d3.select("#histogram")
        .append("div")
        .attr("id", "detailed-plot");
    

    const detailedSVG = detailedPlotContainer
    .append("svg")
    .attr("width", detailedWidth + detailedMargin.left + detailedMargin.right)
    .attr("height", detailedHeight + detailedMargin.top + detailedMargin.bottom)
    .append("g")
    .attr("transform", `translate(${detailedMargin.left},${detailedMargin.top})`);

    // Add frame elements (axes and labels)    
    const xScale = d3.scaleLinear().range([0, detailedWidth]);
    const yScale = d3.scaleLinear().range([detailedHeight, 0]);

    detailedSVG.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${detailedHeight})`);

    detailedSVG.append("g")
        .attr("class", "y-axis");

    detailedSVG.append("text")
        .attr("class", "detailed-title")
        .attr("x", detailedWidth / 2)
        .attr("y", -detailedMargin.top / 2) // Adjust title position
        .attr("text-anchor", "middle")
        .style("font-size", "24px")
        .style("font-weight", "bold")
        .text("Detailed View: ...");

    detailedSVG.append("text")
        .attr("class", "x-label")
        .attr("x", detailedWidth / 2)
        .attr("y", detailedHeight + detailedMargin.bottom / 2) // Adjust x-label position
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Feature Values");

    detailedSVG.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -detailedHeight / 2)
        .attr("y", -detailedMargin.left / 2) // Adjust y-label position
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .text("Probability Density");

    // Add event listeners for subplots
    dataArray.forEach(({ feature, densities }) => {
        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("cursor", "pointer")
            .on("click", () => {
                updateDetailedPlot(feature, densities);
            });

        const allValues = densities.flatMap(d => d.values);
        const x = d3.scaleLinear()
            .domain(d3.extent(allValues))
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(densities, d => {
                const bandwidth = calculateBandwidth(d.values);
                const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), x.ticks(100));
                const density = kde(d.values);
                return d3.max(density, d => d[1]);
            }) * 1.1])
            .range([height - margin.bottom, margin.top]);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(5));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5));

        densities.forEach((d, i) => {
            const bandwidth = calculateBandwidth(d.values);
            const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), x.ticks(100));
            const density = kde(d.values);

            svg.append("path")
                .datum(density)
                .attr("fill", "none")
                .attr("stroke", d3.schemeCategory10[i % 10])
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(d => x(d[0]))
                    .y(d => y(d[1]))
                );
        });

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(feature);
    });

    function updateDetailedPlot(feature = null, densities = []) {
        if (!feature || densities.length === 0) {
            detailedSVG.select(".detailed-title").text("Detailed View: ...");
            xScale.domain([0, 1]);
            yScale.domain([0, 1]);
            detailedSVG.select(".x-axis").call(d3.axisBottom(xScale));
            detailedSVG.select(".y-axis").call(d3.axisLeft(yScale));
            detailedSVG.selectAll(".density-line").remove();
            return;
        }

        detailedSVG.select(".detailed-title").text(`Detailed View: ${feature}`);

        const allValues = densities.flatMap(d => d.values);
        xScale.domain(d3.extent(allValues));
        yScale.domain([0, d3.max(densities, d => {
            const bandwidth = calculateBandwidth(d.values, 2);
            const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), xScale.ticks(100));
            const density = kde(d.values);
            return d3.max(density, d => d[1]);
        }) * 1.1]);

        detailedSVG.select(".x-axis").transition().call(d3.axisBottom(xScale));
        detailedSVG.select(".y-axis").transition().call(d3.axisLeft(yScale).ticks(10));

        const lines = detailedSVG.selectAll(".density-line")
            .data(densities);

        lines.enter()
            .append("path")
            .attr("class", "density-line")
            .attr("fill", "none")
            .attr("stroke", (d, i) => d3.schemeCategory10[i % 10])
            .attr("stroke-width", 2)
            .merge(lines)
            .transition()
            .attr("d", d => {
                const bandwidth = calculateBandwidth(d.values, 2);
                const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), xScale.ticks(100));
                const density = kde(d.values);
                return d3.line()
                    .curve(d3.curveBasis)
                    .x(d => xScale(d[0]))
                    .y(d => yScale(d[1]))(density);
            });

        lines.exit().remove();
    }
}

// Update the plot dynamically
async function updateFeaturePlots() {
    const selectedYears = window.selectedYearRanges;
    const selectedTop = window.selectedTop;
    
    const data = await loadAndMergeData();
    const features = ["Danceability", "Acousticness", "Energy", "Liveness", "Loudness", "Valence", "Speechiness"];
    const processedData = processDensityData(data, selectedYears, selectedTop, features);

    d3.select("#histogram").html("");
    createPDFSubplots(processedData);

    const currentFeature = detailedSVG.select(".detailed-title").text().replace("Detailed View: ", "");
    const featureData = processedData.find(d => d.feature === currentFeature);
    if (featureData) {
        updateDetailedPlot(currentFeature, featureData.densities);
    } else {
        updateDetailedPlot();
    }
}

// Attach listeners to global events
window.addEventListener("yearRangeUpdated", updateFeaturePlots);
window.addEventListener("topUpdated", updateFeaturePlots);

// Initial load
updateFeaturePlots();
