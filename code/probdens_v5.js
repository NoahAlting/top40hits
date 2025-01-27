var featureGenreWidth = document.getElementById("feature_genre_selector").clientWidth;
var featureGenreHeight = document.getElementById("feature_genre_selector").clientHeight / 2;

// var featureGenreWidth = document.getElementById("topContainer_featuregenre").clientWidth;
// var featureGenreHeight = document.getElementById("topContainer_featuregenre").clientHeight / 2;


// Entry function to initialize plots based on global variables
function initializePlots() {
    const header = d3.select("#FG_Header");

    // Update the header text based on the selectedType
    if (window.selectedType === "features") {
        header.text("Probability Density for Features");

        removeButtonByContainerId("feature_genre_selector")
        createInfoButtonWithTooltip(
        "feature_genre_selector",
        `Probability Density of Features`,
        `A Probability Density Function (PDF) shows the density of features for specific value ranges.`,
        "The feature value",
        `The Probability Density`,
        "The lines indicate the probability density for the feature values within the selected year ranges, the latter is visualized using color hue.",
        "Channel",
        "A higher peak means a larger portion of the selected data has this feature value. The smaller top plots provide a global overview to distinguish interesting features, and can be clicked to show a detailed version of that plot below." +
        "<br><br> The detailed plot shows the PDF with a less relaxed fit. The lines can be hovered to show the median and average feature value within the data range.",
        "right"
    );    

        renderTopContainerFeatures();
        renderBottomContainerFeatures();
    } else if (window.selectedType === "genres") {
        header.text(`Genres in the top ${window.selectedTop}`);
        removeButtonByContainerId("feature_genre_selector")
        createInfoButtonWithTooltip(
        "feature_genre_selector",
        `Genres in the top ${window.selectedTop}`,
        `This histogram plot shows how many songs within a genre were in the top ${window.selectedTop} in the selected data range.`,
        "The number of songs",
        `The genre, aggregated to the ${Object.keys(genreKeywords).length} largest genres.`,
        "Position indicates the count, color indicates the year range.",
        "Channel",
        "In the top view, the total count of genres per year can be inspected. The genre groups or label can be clicked to show a detailed version below." +
        `<br><br> In the detailed histogram, the selected genre can be closely inspected across year ranges. When hovered, the exact amount of songs in the top ${window.selectedTop} that are classified as the selected genre is shown.`,
        "right"
        )
        renderTopContainerGenres(1.2);
        renderBottomContainerGenres(0.8);
    }
}
   
// ========================= Top Container (Features) =========================
function renderTopContainerFeatures() {
    const container = d3.select("#topContainer_featuregenre");
    container.selectAll("*").remove(); // Clear existing plots

    const features = possible_features_songs;
    const num_of_subcolumns = 3;

    const width_subplots = featureGenreWidth / num_of_subcolumns;
    const height_subplots = 1.2* featureGenreHeight / (possible_features_songs.length / (num_of_subcolumns - 1));

    var margin_subplots = {
        top: height_subplots * 0.15, 
        right: width_subplots * 0.1, 
        bottom: height_subplots * 0.15, 
        left: width_subplots * 0.15
    };

    // Get the background color of the chart container
    const chartContainer = document.querySelector(".chart_container_FG");
    const defaultBackgroundColor = window.getComputedStyle(chartContainer).backgroundColor;

    // Create a grid layout
    container.style("display", "grid")
        .style("grid-template-columns", `repeat(${num_of_subcolumns}, auto)`);

    features.forEach(feature => {
        const svg = container.append("svg")
            .attr("width", width_subplots)
            .attr("height", height_subplots)
            .style("cursor", "pointer")
            .style("border-radius", "10px") // Matches the parent container's border-radius
            
            .on("mouseover", function () {
                // Change the background color on hover
                d3.select(this).style("background-color", "rgba(255, 255, 255, 0.2)");
            })
            .on("mouseout", function () {
                // Reset the background color to the default chart container background color
                d3.select(this).style("background-color", defaultBackgroundColor);
            })
            .on("click", () => {
                // Update the global variable and dispatch event
                window.selectedGenre = feature;
                console.log(`Genre updated to: ${feature}`); // Log the updated genre to the console
                const event = new CustomEvent("genreUpdated", { detail: { feature } });
                window.dispatchEvent(event);
            });

        const g = svg.append("g")
            .attr("transform", `translate(${margin_subplots.left},${margin_subplots.top})`);

        // Render the content inside the SVG (e.g., PDFs)
        renderPDF(g, feature, 
            width_subplots - margin_subplots.left - margin_subplots.right, 
            height_subplots - margin_subplots.top - margin_subplots.bottom);
    });
}


// Render individual PDF using global_variables.js functions
function renderPDF(svg, feature, width, height) {
    filter_data()
        .then((filteredData) => {
            const allRanges = window.selectedYearRanges || [];
            const xExtent = d3.extent(filteredData.map(row => row[feature]).filter(v => v !== undefined));
            const densities = [];

            // Compute densities for each range
            allRanges.forEach((range) => {
                const rangeData = filteredData.filter(
                    row => row.Jaar >= range[0] && row.Jaar <= range[1] && row[feature] !== undefined
                ).map(row => row[feature]);

                if (rangeData.length > 0) {
                    const bandwidth = calculateBandwidth(rangeData);
                    const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), d3.range(xExtent[0], xExtent[1], (xExtent[1] - xExtent[0]) / 100));
                    const density = kde(rangeData);
                    densities.push({ range, density });
                }
            });

            // Update x and y scales
            const x = d3.scaleLinear()
                .domain(xExtent)
                .range([0, width]);

            const yMax = d3.max(densities.flatMap(d => d.density.map(point => point[1])));
            const y = d3.scaleLinear()
                .domain([0, yMax])
                .range([height, 0]);

            // Append axes
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(3));

            svg.append("g")
                .call(d3.axisLeft(y).ticks(2));

            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .style("fill", "white")
                .text(`${feature}`);

            // Draw the density lines
            densities.forEach(({ range, density }) => {
                svg.append("path")
                    .datum(density)
                    .attr("fill", "none")
                    .attr("stroke", get_color_yearRange(range, allRanges))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(d => x(d[0]))
                        .y(d => y(d[1])));
            });
        })
        .catch((err) => console.error("Error rendering PDF:", err));
}


// Kernel Density Estimation Helper Functions
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
}

function kernelEpanechnikov(k) {
    return function(v) {
        v /= k;
        return Math.abs(v) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

function calculateBandwidth(values, factor = 8) {
    const n = values.length;
    const stdDev = d3.deviation(values);
    return factor * stdDev * Math.pow(n, -1 / 5);
}


// ========================= Bottom Container (Features) =========================
function renderBottomContainerFeatures() {
    const container = d3.select("#bottomContainer_featuregenre");
    container.selectAll("*").remove();

    const width = featureGenreWidth;
    const height = featureGenreHeight;

    var margin = {
        top: height * 0.15, 
        right: width * 0.05, 
        bottom: height * 0.1, 
        left: width * 0.1};

    const svg = container.append("svg")
        .attr("width", width) // Set width of the detailed view
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const selectedFeature = window.selectedGenre;
    renderDetailedPDF(svg, selectedFeature, 
        width - margin.left - margin.right, 
        height - margin.top - margin.bottom);
}


function renderDetailedPDF(svg, feature, width, height) {
    filter_data()
        .then((filteredData) => {
            const allRanges = window.selectedYearRanges;

            // Extract data for each range
            const densities = allRanges.map(range => {
                const rangeData = filteredData
                    .filter(row => row.Jaar >= range[0] && row.Jaar <= range[1] && row[feature] !== undefined)
                    .map(row => row[feature]);

                if (rangeData.length > 0) {
                    const bandwidth = calculateBandwidth(rangeData, factor = 1.5);
                    const xTicks = d3.range(
                        d3.min(rangeData),
                        d3.max(rangeData),
                        (d3.max(rangeData) - d3.min(rangeData)) / 100
                    );
                    const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), xTicks);
                    return {
                        range,
                        density: kde(rangeData),
                        median: d3.median(rangeData),
                        mean: d3.mean(rangeData)
                    };
                }
                return null;
            }).filter(d => d !== null); // Remove ranges with no data

            // Combine data across ranges to calculate the x and y scales
            const allFeatureData = densities.flatMap(d => d.density.map(point => point[0]));
            const xExtent = d3.extent(allFeatureData);
            const yMax = d3.max(densities.flatMap(d => d.density.map(point => point[1])));

            // Define scales
            const x = d3.scaleLinear()
                .domain(xExtent)
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([0, yMax])
                .range([height, 0]);

            // Add x-axis
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(5));

            // Add y-axis
            svg.append("g")
                .call(d3.axisLeft(y).ticks(5));

            // Add x-axis label
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + 35)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("fill", "white")
                .text(feature + " value");

            // Add y-axis label
            svg.append("text")
                .attr("x", -height / 2)
                .attr("y", -40)
                .attr("transform", "rotate(-90)")
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("fill", "white")
                .text("Density");

            // Add title
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", -20)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .style("fill", "white")
                .text(`Detailed view: ${feature}`);

            // Hoverable lines
            const hoverLinesGroup = svg.append("g");

            // Draw density lines for each range
            densities.forEach(({ range, density, median, mean }) => {
                const color = get_color_yearRange(range, allRanges);

                // Add density line
                const linePath = svg.append("path")
                    .datum(density)
                    .attr("fill", "none")
                    .attr("stroke", color) // Use the color scheme
                    .attr("stroke-width", 2)
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(d => x(d[0]))
                        .y(d => y(d[1])));

                // Add invisible line for better hitbox
                const invisibleLine = svg.append("path")
                    .datum(density)
                    .attr("fill", "none")
                    .attr("stroke", "transparent")
                    .attr("stroke-width", 15) // Larger clickable area
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(d => x(d[0]))
                        .y(d => y(d[1])))

                    .on("mouseover", function () {
                        // Add vertical lines for median and mean
                        hoverLinesGroup.selectAll("*").remove();

                        // Highlight the hovered line
                        hoverLinesGroup.append("path")
                            .datum(density)
                            .attr("fill", "none")
                            .attr("stroke", "white")
                            .attr("stroke-width", 15) // Same size as the hitbox
                            .attr("stroke-opacity", 0.1) // Semi-transparent
                            .attr("d", d3.line()
                                .curve(d3.curveBasis)
                                .x(d => x(d[0]))
                                .y(d => y(d[1])));

                        const positions = [
                            median < mean
                                ? { value: median, label: `Median: ${median.toFixed(2)}`, align: "left" }
                                : { value: median, label: `Median: ${median.toFixed(2)}`, align: "right" },
                            mean < median
                                ? { value: mean, label: `Mean: ${mean.toFixed(2)}`, align: "left" }
                                : { value: mean, label: `Mean: ${mean.toFixed(2)}`, align: "right" }
                        ];

                        positions.forEach((pos) => {
                            // Add vertical line
                            hoverLinesGroup.append("line")
                                .attr("x1", x(pos.value))
                                .attr("x2", x(pos.value))
                                .attr("y1", 0)
                                .attr("y2", height)
                                .attr("stroke", "white")
                                .attr("stroke-width", 1)
                                .attr("stroke-dasharray", "4 2");

                            // Add text
                            hoverLinesGroup.append("text")
                                .attr("y", height * 0.8) // Set base y position for text
                                .attr("text-anchor", "middle")
                                .attr("fill", "white")
                                .attr("font-size", "12px")
                                .html(() => {
                                    const [label, value] = pos.label.split(': ');
                                    const offset = 0.05 * width; // Dynamically calculate offset as 5% of the width
                                    return `
                                        <tspan x="${x(pos.value) + (pos.align === "left" ? -offset : offset)}" dy="0">${label}</tspan>
                                        <tspan x="${x(pos.value) + (pos.align === "left" ? -offset : offset)}" dy="1.2em">${value}</tspan>
                                    `;
                                });
                        });
                    })
                    .on("mouseout", () => {
                        // Remove hover lines and highlight on mouseout
                        hoverLinesGroup.selectAll("*").remove();
                    });
            });
        })
        .catch((err) => console.error("Error rendering detailed PDF:", err));
}


// ========================= Top Container (Genres) =========================
function renderTopContainerGenres(containerHeightFraction) {
    const container = d3.select("#topContainer_featuregenre");
    container.selectAll("*").remove(); // Clear existing plots

    const width = featureGenreWidth;
    const height = featureGenreHeight * containerHeightFraction;

    var margin = {
        top: height * 0.05, 
        right: width * 0.05, 
        bottom: height * 0.1, 
        left: width * 0.15};

    // Create SVG container
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    renderHistogram(svg, 
        width - margin.left - margin.right, 
        height - margin.top - margin.bottom);
}

function renderHistogram(svg, width, height) {
    filter_data()
        .then((filteredData) => {
            const isObject = typeof filteredData === "object" && !Array.isArray(filteredData);

            if (isObject) {
                const genres = Object.keys(filteredData);
                const ranges = window.selectedYearRanges.map(range => `${range[0]}-${range[1]}`);

                // Flatten data for the histogram
                const data = genres.flatMap(genre => {
                    return window.selectedYearRanges.map(range => {
                        const rangeLabel = `${range[0]}-${range[1]}`;
                        const count = (filteredData[genre]?.filter(row =>
                            row.Jaar >= range[0] && row.Jaar <= range[1]
                        ).length) || 0;
                        return { genre, range: rangeLabel, count };
                    });
                });

                // Define scales
                const y0 = d3.scaleBand()
                    .domain(genres)
                    .range([0, height])
                    .paddingInner(0.2);

                const y1 = d3.scaleBand()
                    .domain(ranges)
                    .range([0, y0.bandwidth()])
                    .padding(0.05);

                const x = d3.scaleLinear()
                    .domain([0, d3.max(data, d => d.count)])
                    .range([0, width]);

                // Add y-axis (only genre labels)
                const yAxis = svg.append("g")
                    .attr("class", "y-axis")
                    .call(d3.axisLeft(y0))
                    .selectAll(".tick")
                    .style("font-size", "14px")
                    .style("cursor", "pointer");

                // Add hover effect and click interaction for y-axis ticks
                yAxis.each(function (d) {
                    const tick = d3.select(this);
                    const bbox = tick.node().getBBox();

                    // Add a rect behind each tick label for hover effect
                    tick.insert("rect", ":first-child")
                        .attr("x", bbox.x - 10) // Add padding
                        .attr("y", bbox.y - 5)
                        .attr("width", bbox.width + 5) // Add width for padding
                        .attr("height", bbox.height + 10) // Add height for padding
                        .attr("fill", "transparent") // Default transparent
                        .attr("rx", 5) // Rounded corners
                        .attr("ry", 5);

                    // Handle hover and click
                    tick.on("mouseover", function () {
                        // Highlight the bars for the hovered genre
                        svg.selectAll(".bar-group rect")
                            .attr("fill-opacity", 0.3); // Dim all bars
                        svg.selectAll(`.bar-group[transform="translate(0,${y0(d)})"] rect`)
                            .attr("fill-opacity", 1); // Highlight the bars for the hovered genre
                        
                        // Highlight the tick background
                        tick.select("rect").attr("fill", "rgba(255, 255, 255, 0.3)");
                    })
                        .on("mouseout", function () {
                            // Reset all bar opacities
                            svg.selectAll(".bar-group rect")
                                .attr("fill-opacity", 1);

                            // Reset tick background
                            tick.select("rect").attr("fill", "transparent");
                        })
                        .on("click", function () {
                            // Update the global variable and trigger event
                            window.selectedGenre = d;
                            console.log(`Genre updated to: ${d}`);
                            const genreEvent = new CustomEvent("genreUpdated", { detail: { genre: d } });
                            window.dispatchEvent(genreEvent);
                        });
                });

                // Add x-axis
                svg.append("g")
                    .attr("class", "x-axis")
                    .attr("transform", `translate(0,${height})`)
                    .call(d3.axisBottom(x).ticks(5));

                // Group bars by genre
                const barGroups = svg.selectAll(".bar-group")
                    .data(genres)
                    .enter()
                    .append("g")
                    .attr("class", "bar-group")
                    .attr("transform", d => `translate(0,${y0(d)})`)
                    .on("mouseover", function (event, genre) {
                        // Make all bar groups semi-transparent
                        svg.selectAll(".bar-group rect")
                            .attr("fill-opacity", 0.3);

                        // Highlight the hovered bar group
                        d3.select(this).selectAll("rect")
                            .attr("fill-opacity", 1)
                            .attr("y", d => y1(d.range) - 0.05 * y1.bandwidth()) // Add padding to the top
                            .attr("height", y1.bandwidth() * 1.1); // Increase height
                    })
                    .on("mouseout", function () {
                        // Reset all bar groups to full opacity and original size
                        svg.selectAll(".bar-group rect")
                            .attr("fill-opacity", 1)
                            .attr("y", d => y1(d.range)) // Reset y position
                            .attr("height", y1.bandwidth()); // Reset height
                    })
                    .on("click", function (event, genre) {
                        // Update global variable
                        window.selectedGenre = genre;
                        console.log(`Genre updated to: ${genre}`);

                        // Dispatch custom event
                        const genreEvent = new CustomEvent("genreUpdated", { detail: { genre } });
                        window.dispatchEvent(genreEvent);
                    });

                // Add bars within each group
                barGroups.selectAll("rect")
                    .data(genre => data.filter(d => d.genre === genre))
                    .enter()
                    .append("rect")
                    .attr("y", d => y1(d.range))
                    .attr("x", 0)
                    .attr("width", d => x(d.count))
                    .attr("height", y1.bandwidth())
                    .attr("fill", d => get_color_yearRange(d.range, ranges));

                // Add axis labels
                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", height + 35)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("font-weight", "bold")
                    .style("fill", "white")
                    .text("Number of Songs");

                // svg.append("text")
                //     .attr("x", width / 2)
                //     .attr("y", -20)
                //     .attr("text-anchor", "middle")
                //     .style("font-size", "22px")
                //     .style("font-weight", "bold")
                //     .style("fill", "white")
                //     .text(`Genres in the top ${window.selectedTop}`);
            } else {
                // Handle errors
                console.error("Expected filteredData to be an object, but got:", filteredData);
                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .style("font-weight", "bold")
                    .style("fill", "white")
                    .text("No data available");
            }
        })
        .catch((err) => {
            console.error("Error rendering histogram:", err);
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height / 2)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .style("font-weight", "bold")
                .text("Error loading data");
        });
}


// ========================= Bottom Container (Genres) =========================
function renderBottomContainerGenres(containerHeightFraction) {
    const container = d3.select("#bottomContainer_featuregenre");
    container.selectAll("*").remove();

    const width = featureGenreWidth;
    const height = featureGenreHeight * containerHeightFraction; // If time left change this so that it is large but not absolutely necessary

    var margin = {
        top: height * 0.35, 
        right: width * 0.05, 
        bottom: height * 0.15, 
        left: width * 0.15
    };

    // Create SVG container
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    renderDetailedHistogram(svg, 
        width - margin.left - margin.right, 
        height - margin.top - margin.bottom);
}


function renderDetailedHistogram(svg, width, height) {
    filter_data()
        .then((filteredData) => {
            const selectedGenre = window.selectedGenre; // Check the global variable for the selected genre

            if (!selectedGenre) {
                console.error("No genre selected. Cannot render barplot.");
                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .style("font-weight", "bold")
                    .text("No genre selected.");
                return;
            }

            // Extract data for the selected genre
            const genreData = filteredData[selectedGenre];
            if (!genreData || genreData.length === 0) {
                console.error(`No data available for genre: ${selectedGenre}`);
                svg.append("text")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .style("font-weight", "bold")
                    .style("fill", "white")
                    .text(`No data available for genre: ${selectedGenre}`);
                return;
            }

            const ranges = window.selectedYearRanges.map(range => `${range[0]}-${range[1]}`);

            // Prepare data for the barplot (counts per year range)
            const data = window.selectedYearRanges.map(range => {
                const rangeData = genreData.filter(row => row.Jaar >= range[0] && row.Jaar <= range[1]);
                return {
                    range: `${range[0]}-${range[1]}`,
                    count: rangeData.length
                };
            });

            // Define scales
            const y = d3.scaleBand()
                .domain(ranges)
                .range([0, height])
                .paddingInner(0.2);

            const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.count)])
                .range([0, width]);

            // Add x-axis (counts)
            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(5));

            // Add y-axis
            svg.append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(0,0)`) // No translation needed for y-axis
                .style("font-size", "14px")
                .call(d3.axisLeft(y));

            // Add bars with hover functionality
            const bars = svg.selectAll(".bar-group")
                .data(data)
                .enter()
                .append("g")
                .attr("class", "bar-group")
                .attr("transform", d => `translate(0,${y(d.range)})`);

            bars.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", d => x(d.count))
                .attr("height", y.bandwidth())
                .attr("fill", d => get_color_yearRange(d.range, ranges))
                .on("mouseover", function (event, d) {
                    // Reduce opacity of all bars
                    bars.selectAll("rect")
                        .attr("fill", function (b) {
                            const originalColor = get_color_yearRange(b.range, ranges);
                            const opaqueColor = d3.color(originalColor);
                            opaqueColor.opacity = 0.5; // Reduce opacity
                            return opaqueColor.toString();
                        });

                    // Keep the hovered bar's original color
                    d3.select(this)
                        .attr("fill", get_color_yearRange(d.range, ranges));

                    // Show the count text for the hovered bar
                    d3.select(this.parentNode).select("text").style("display", "block");
                })
                .on("mouseout", function () {
                    // Reset all bars to their original color
                    bars.selectAll("rect")
                        .attr("fill", d => get_color_yearRange(d.range, ranges));

                    // Hide the count text
                    d3.select(this.parentNode).select("text").style("display", "none");
                });

            // Add text elements inside the bars
            bars.append("text")
                .attr("x", d => x(d.count) - width * 0.05) // Position text near the end of the bar
                .attr("y", y.bandwidth() / 2) // Vertically center the text
                .attr("dy", "0.35em") // Adjust text alignment
                .attr("text-anchor", "end") // Align text to the end
                .style("fill", "white") // Text color
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .style("display", "none") // Hide text by default
                .text(d => d.count);

            // Add x-axis label
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + 35) // Position below the x-axis
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("fill", "white")
                .text(`Number of ${selectedGenre} songs`);
        })
        .catch((err) => console.error("Error rendering barplot:", err));
}


// ========================= Event Listeners =========================
window.addEventListener("typeUpdated", initializePlots);
window.addEventListener("genreUpdated", initializePlots);
window.addEventListener("yearRangeUpdated", initializePlots);
window.addEventListener("weekRangeUpdated", initializePlots);
window.addEventListener("topUpdated", initializePlots);

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    initializePlots();
});
