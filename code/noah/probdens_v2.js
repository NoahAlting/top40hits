// Load and merge data from two CSV files
async function loadAndMergeData() {
    const spotifySongs = await d3.csv("../../data/spotify_songs_with_ids_norm.csv", d3.autoType);
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

    const total_plot_width = 500;
    const total_plot_height = 500;

    const width = total_plot_width / 3;
    const height = 1 * total_plot_height / 5;
    const margin = { top: 20, right: 20, bottom: 20, left: 25 };

    const detailedWidth = total_plot_width - margin.right - margin.left;
    const detailedHeight = 2 *total_plot_height / 5;
    const detailedMargin = { top: 30, right: 30, bottom: 50, left: 50 }; // New margin for detailed plot

    // Create a container for the grid layout
    const container = d3.select("#histogram")
        .append("div")
        .style("display", "grid")
        .style("grid-template-columns", "repeat(3, auto)");
        // .style("grid-gap", "10px");

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
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Detailed View: ...");

    detailedSVG.append("text")
        .attr("class", "x-label")
        .attr("x", detailedWidth / 2)
        .attr("y", detailedHeight + detailedMargin.bottom / 2) // Adjust x-label position
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Feature Values");

    detailedSVG.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -detailedHeight / 2)
        .attr("y", -detailedMargin.left / 2) // Adjust y-label position
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
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
            .call(d3.axisBottom(x).ticks(3));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(2));

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
            .style("font-size", "12px")
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
        detailedSVG.select(".y-axis").transition().call(d3.axisLeft(yScale).ticks(3));

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

// Update the plot dynamically based on type
async function updateFeaturePlots() {
    const selectedYears = window.selectedYearRanges;
    const selectedTop = window.selectedTop;
    const selectedType = window.selectedType; // Add this to detect the current type
    const data = await loadAndMergeData();

    // Clear existing plots
    d3.select("#histogram").html("");

    if (selectedType === "features") {
        // Show feature-based density plots
        const features = [
            "Danceability", "Acousticness", "Energy", "Liveness", "Valence",
            "Speechiness", "Normalized_Loudness", "Normalized_Popularity", "Normalized_Tempo"
        ];
        const processedData = processDensityData(data, selectedYears, selectedTop, features);
        createPDFSubplots(processedData);

        // Update detailed plot if it matches the current feature
        const currentFeature = detailedSVG.select(".detailed-title").text().replace("Detailed View: ", "");
        const featureData = processedData.find(d => d.feature === currentFeature);
        if (featureData) {
            updateDetailedPlot(currentFeature, featureData.densities);
        } else {
            updateDetailedPlot();
        }
        
    } else if (selectedType === "genres") {
        const selectedGenreMapping = genreKeywords;

        // Define dimensions and margins
        const width = 500;
        const height = 500;
        const margin = { top: 50, right: 20, bottom: 50, left: 150 };
    
        // Map genres from CSV to predefined categories
        const mapToPossibleGenres = (genres) => {
            for (const [key, keywords] of Object.entries(selectedGenreMapping)) {
                if (keywords.some(keyword => genres.toLowerCase().includes(keyword))) {
                    return key;
                }
            }
            return "others"; // If no match, map to "others"
        };
    
        // Process and aggregate data
        const processedData = selectedYears.flatMap(([start, end]) => {
            const rangeLabel = `${start}-${end}`;
            const rangeData = data.filter(row => row.Jaar >= start && row.Jaar <= end);
            const genreCounts = {};
    
            rangeData.forEach(row => {
                const mappedGenre = mapToPossibleGenres(row.Artist_Genres || "");
                if (!genreCounts[mappedGenre]) genreCounts[mappedGenre] = 0;
                genreCounts[mappedGenre]++;
            });
    
            return Object.entries(genreCounts).map(([genre, count]) => ({
                range: rangeLabel,
                genre,
                count,
            }));
        });
    
        // Ensure all genres in genreKeywords + "others" are included
        const genres = [...Object.keys(selectedGenreMapping), "others"]; // Include all genres in order + "others"
        const ranges = Array.from(new Set(processedData.map(d => d.range)));
    
        // Fill missing genres with zero counts
        const processedDataWithMissingGenres = genres.flatMap(genre => {
            const genreData = processedData.filter(d => d.genre === genre);
            if (genreData.length === 0) {
                return ranges.map(range => ({
                    range,
                    genre,
                    count: 0, // Missing genres get zero
                }));
            }
            return genreData;
        });
    
        // Create grouped y-scales for genres and ranges
        const yGenre = d3.scaleBand()
            .domain(genres) // Fixed order from genreKeywords + "others"
            .range([0, height])
            .paddingInner(0.2); // Adds space between genres
    
        const yRange = d3.scaleBand()
            .domain(ranges) // Subcategories (ranges) within a genre
            .range([0, yGenre.bandwidth()])
            .padding(0.05); // Adds space within a genre group
    
        const x = d3.scaleLinear()
            .domain([0, d3.max(processedDataWithMissingGenres, d => d.count)])
            .range([0, width]);
    
        // Create SVG container
        const svg = d3.select("#histogram")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
        // Add bars
        svg.selectAll(".bar")
            .data(processedDataWithMissingGenres)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => yGenre(d.genre) + yRange(d.range)) // Use both y scales
            .attr("width", d => x(d.count))
            .attr("height", yRange.bandwidth())
            .attr("fill", d => get_color_yearRange(d.range, ranges));
    
        // Add x-axis
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5));
    
        // Add y-axis (only genre labels)
        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yGenre));
    
        // Add axis labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Number of Songs");
    
        svg.append("text")
            .attr("x", -margin.left)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "start")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Genres by Year Range");
    }
}

// Attach listeners to global events
window.addEventListener("yearRangeUpdated", updateFeaturePlots);
window.addEventListener("topUpdated", updateFeaturePlots);
window.addEventListener("typeUpdated", updateFeaturePlots);

// Initial load
updateFeaturePlots();

