// Get dimensions of the feature/genre selector container
var featureGenreWidth = document.getElementById("feature_genre_selector").clientWidth;
var featureGenreHeight = document.getElementById("feature_genre_selector").clientHeight / 2;


// Initializes plots based on the selected type (features or genres).
// Updates the header, adds tooltips, and renders the appropriate plots.

function initializePlots() {
    const header = d3.select("#FG_Header");

    // Determine the plot type based on the global variable `selectedType`
    if (window.selectedType === "features") {
        header.text("Probability Density Function for Features");

        // Remove any existing info button and create a new one
        removeButtonByContainerId("feature_genre_selector");
        createInfoButtonWithTooltip(
            "feature_genre_selector",
            "Probability Density of Features",
            "A Probability Density Function (PDF) shows the density of features for specific value ranges.",
            "The feature value",
            "The Probability Density",
            "The lines indicate the probability density for the feature values within the selected year ranges, with color hue representing different years.",
            "Position and color hue",
            "A higher peak means a larger portion of the selected data has this feature value. The smaller top plots provide a global overview to identify interesting features and can be clicked to show a detailed version below." +
            "<br><br>The detailed plot shows the PDF with a finer fit. Hovering over the lines reveals the median and average feature value within the data range.",
            "right"
        );

        // Render the visualizations for feature-based plots
        renderTopContainerFeatures();
        renderBottomContainerFeatures();

    } else if (window.selectedType === "genres") {
        header.text(`Genres in the top ${window.selectedTop}`);

        // Remove existing info button and create a new one for genre plots
        removeButtonByContainerId("feature_genre_selector");
        createInfoButtonWithTooltip(
            "feature_genre_selector",
            `Genres in the top ${window.selectedTop}`,
            `This barplot plot shows how many songs within a genre were in the top ${window.selectedTop} in the selected data range.`,
            "The number of songs that were assigned the genre label.",
            `The genre, aggregated to the ${Object.keys(genreKeywords).length} largest genres.`,
            "Position indicates the count, color indicates the year range.",
            "Length, color hue",
            `In the top view, the total count of genres per year can be inspected. Genre groups or labels can be clicked to show a detailed version below.` +
            `<br><br> In the detailed barplot, the selected genre can be closely inspected across year ranges. Hovering over the bars reveals the exact number of songs in the top ${window.selectedTop} classified as the selected genre.`,
            "right"
        );

        // Render the visualizations for genre-based plots with customly tweaked grid sizes
        renderTopContainerGenres(1.2);
        renderBottomContainerGenres(0.8);
    }
}


function PDF_highlight_range_opacity(selectedRange) {
    const motherSvg = d3.select("#topContainer_featuregenre");
    const svgs = motherSvg.selectAll("svg");

    // Reset all paths to full opacity and default stroke width
    svgs.selectAll("path")
        .attr("stroke-width", 1.5)
        .attr("opacity", 1.0);

    // If no valid range is selected, exit the function
    if (!selectedRange || !Array.isArray(selectedRange) || selectedRange.length !== 2) {
        return;
    }

    const rangeKey = `${selectedRange[0]}-${selectedRange[1]}`;

    // Dim all paths to lower opacity
    svgs.selectAll("path").attr("opacity", 0.4);

    // Highlight the path that matches the selected range
    svgs.selectAll("path")
        .filter(function () {
            return d3.select(this).attr("data-range") === rangeKey;
        })
        .attr("stroke-width", 3)
        .attr("opacity", 1.0) // Full opacity for the selected path
        .raise(); // Bring to the front
}


function PDF_highlight_range_detailed_opacity(selectedRange) {
    const svgs = d3.selectAll("#bottomContainer_featuregenre");

    // Reset all paths to full opacity and default stroke width
    svgs.selectAll("path")
        .attr("stroke-width", 1.5)
        .attr("opacity", 1.0);

    // If no valid range is selected, exit the function
    if (!selectedRange || !Array.isArray(selectedRange) || selectedRange.length !== 2) {
        return;
    }

    const rangeKey = `${selectedRange[0]}-${selectedRange[1]}`;

    // Dim all paths to lower opacity
    svgs.selectAll("path").attr("opacity", 0.4);

    // Highlight the path that matches the selected range
    svgs.selectAll("path")
        .filter(function () {
            return d3.select(this).attr("data-range") === rangeKey;
        })
        .attr("stroke-width", 3)
        .attr("opacity", 1.0) // Full opacity for the selected path
        .raise(); // Bring to the front
}


function GenreBarplot_range_detailed_opacity(selectedRange) {
    const svg = d3.select("#bottomContainer_featuregenre").select("svg");

    // Reset all bars to full opacity
    svg.selectAll("rect").attr("opacity", 1.0);

    // If no valid range is selected, exit the function
    if (!selectedRange || !Array.isArray(selectedRange) || selectedRange.length !== 2) {
        return;
    }

    const rangeKey = `${selectedRange[0]}-${selectedRange[1]}`;

    // Dim all bars to lower opacity
    svg.selectAll("rect").attr("opacity", 0.4);

    // Highlight bars that match the selected range
    svg.selectAll("rect")
        .filter(function () {
            return d3.select(this).attr("data-range") === rangeKey;
        })
        .attr("opacity", 1.0) // Full opacity for the selected bars
        .raise(); // Bring to the front
}



// ========================= Top Container (Features) =========================

// Renders the top container with feature-based Probability Density Function (PDF) plots.

function renderTopContainerFeatures() {
    const container = d3.select("#topContainer_featuregenre");
    container.selectAll("*").remove(); // Clear existing plots

    const features = possible_features_songs;
    const numOfSubcolumns = 3;

    const widthSubplots = featureGenreWidth / numOfSubcolumns;
    const heightSubplots = 1.2 * featureGenreHeight / (features.length / (numOfSubcolumns - 1));

    const marginSubplots = {
        top: heightSubplots * 0.15,
        right: widthSubplots * 0.1,
        bottom: heightSubplots * 0.15,
        left: widthSubplots * 0.15
    };

    // Get the background color of the chart container
    const chartContainer = document.querySelector(".chart_container_FG");
    const defaultBackgroundColor = window.getComputedStyle(chartContainer).backgroundColor;

    // Create a grid layout for the feature plots
    container.style("display", "grid")
        .style("grid-template-columns", `repeat(${numOfSubcolumns}, auto)`);

    features.forEach(feature => {
        const svg = container.append("svg")
            .attr("width", widthSubplots)
            .attr("height", heightSubplots)
            .style("cursor", "pointer")
            .style("border-radius", "10px") // Matches the parent container's border-radius
            .on("mouseover", function () {
                d3.select(this).style("background-color", "rgba(255, 255, 255, 0.2)"); // Highlight on hover
            })
            .on("mouseout", function () {
                d3.select(this).style("background-color", defaultBackgroundColor); // Reset background
            })
            .on("click", () => {
                // Update the global variable and dispatch a custom event
                window.selectedGenre = feature;
                // console.log(`Genre updated to: ${feature}`);
                const event = new CustomEvent("genreUpdated", { detail: { feature } });
                window.dispatchEvent(event);
            });

        const g = svg.append("g")
            .attr("transform", `translate(${marginSubplots.left},${marginSubplots.top})`);

        // Render the PDF plot inside the SVG
        renderPDF(g, feature, 
            widthSubplots - marginSubplots.left - marginSubplots.right, 
            heightSubplots - marginSubplots.top - marginSubplots.bottom);
    });
}


// Renders a Probability Density Function (PDF) plot for a given feature.
function renderPDF(svg, feature, width, height) {
    filter_data()
        .then((filteredData) => {
            const allRanges = window.selectedYearRanges || [];
            const densities = [];

            // Compute densities for each selected year range
            allRanges.forEach((range) => {
                const rangeData = filteredData
                    .filter(row => row.Jaar >= range[0] && row.Jaar <= range[1] && row[feature] !== undefined)
                    .map(row => row[feature]);

                if (rangeData.length > 0) {
                    const bandwidth = calculateBandwidth(rangeData);
                    const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), d3.range(0, 1.001, 0.01)); // Fixed range [0, 1]
                    const density = kde(rangeData);
                    densities.push({ range, density });
                }
            });

            // Define scales
            const x = d3.scaleLinear()
                .domain([0, 1.001]) // Fixed range for x-axis
                .range([0, width]);

            const yMax = d3.max(densities.flatMap(d => d.density.map(point => point[1])));
            const y = d3.scaleLinear()
                .domain([0, yMax])
                .range([height, 0]);

            // Append x and y axes
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(3));

            svg.append("g")
                .call(d3.axisLeft(y).ticks(2));

            // Add grid lines
            const grid = svg.append("g").attr("class", "grid");

            // Horizontal grid lines (y-axis)
            grid.selectAll(".horizontal-line")
                .data(y.ticks(2))
                .enter()
                .append("line")
                .attr("class", "horizontal-line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", d => y(d))
                .attr("y2", d => y(d))
                .attr("stroke", "white")
                .attr("stroke-opacity", 0.1)
                .attr("stroke-dasharray", "4 4");

            // Vertical grid lines (x-axis)
            grid.selectAll(".vertical-line")
                .data(x.ticks(3))
                .enter()
                .append("line")
                .attr("class", "vertical-line")
                .attr("x1", d => x(d))
                .attr("x2", d => x(d))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "white")
                .attr("stroke-opacity", 0.1)
                .attr("stroke-dasharray", "4 4");

            // Add feature label
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
                    .attr("data-range", `${range[0]}-${range[1]}`)
                    .attr("data-original-color", get_color_yearRange(range, allRanges))
                    .attr("d", d3.line()
                        .curve(d3.curveBasis)
                        .x(d => x(d[0]))
                        .y(d => y(d[1])));
            });
        })
        .catch((err) => console.error("Error rendering PDF:", err));
}

// Kernel Density Estimation function.
function kernelDensityEstimator(kernel, X) {
    return function(V) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
    };
}


// Epanechnikov kernel function.
function kernelEpanechnikov(k) {
    return function(v) {
        v /= k;
        return Math.abs(v) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}


// Calculates the optimal bandwidth for Kernel Density Estimation.

function calculateBandwidth(values, factor = 8) {
    const n = values.length;
    const stdDev = d3.deviation(values);
    return factor * stdDev * Math.pow(n, -1 / 5);
}


// ========================= Bottom Container (Detailed Features) =========================


// Renders the bottom container with a detailed Probability Density Function (PDF) plot for the selected feature.
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
            const allRanges = window.selectedYearRanges || [];

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
                    const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), d3.range(0, 1.001, 0.01));
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
            const xMax = d3.max(densities.flatMap(d => d.density.map(point => point[0])));
            const xMin = d3.min(densities.flatMap(d => d.density.map(point => point[0])));
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
                .call(d3.axisBottom(x).ticks(8));

            // Add y-axis
            svg.append("g")
                .call(d3.axisLeft(y).ticks(3));

            // Add grid lines
            const grid = svg.append("g")
            .attr("class", "grid");

            const yTicks = y.ticks(6)
            // Add horizontal grid lines (y-axis)
            grid.selectAll(".horizontal-line")
                .data(yTicks)
                .enter()
                .append("line")
                .attr("class", "horizontal-line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", d => y(d))
                .attr("y2", d => y(d))
                .attr("stroke", "white")
                .attr("stroke-opacity", 0.1)
                .attr("stroke-dasharray", "4 4");

            // Add vertical grid lines (x-axis)
            const xTicks = x.ticks(8); // Get tick positions
            grid.selectAll(".vertical-line")
                .data(xTicks)
                .enter()
                .append("line")
                .attr("class", "vertical-line")
                .attr("x1", d => x(d))
                .attr("x2", d => x(d))
                .attr("y1", 0)
                .attr("y2", height)
                .attr("stroke", "white")
                .attr("stroke-opacity", 0.1)
                .attr("stroke-dasharray", "4 4");

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

                    // add for highlighting
                    .attr("data-range", `${range[0]}-${range[1]}`)
                    .attr("data-original-color", get_color_yearRange(range, allRanges))

                    // add actual line
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


// Renders the top container with a bar plot for genres.

function renderTopContainerGenres(containerHeightFraction) {
    const container = d3.select("#topContainer_featuregenre");
    container.selectAll("*").remove(); // Clear existing plots

    const width = featureGenreWidth;
    const height = featureGenreHeight * containerHeightFraction;

    const margin = {
        top: height * 0.05,
        right: width * 0.05,
        bottom: height * 0.1,
        left: width * 0.15
    };

    // Create SVG container
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Render the genre barplot
    renderGenreBarplot(svg, width - margin.left - margin.right, height - margin.top - margin.bottom);
}


// Renders a barplot showing the number of songs in a genres.
function renderGenreBarplot(svg, width, height) {
    filter_data()
        .then((filteredData) => {
            if (typeof filteredData !== "object" || Array.isArray(filteredData)) {
                console.error("Expected filteredData to be an object, but got:", filteredData);
                displayNoDataMessage(svg, width, height);
                return;
            }

            const genres = Object.keys(filteredData);
            const ranges = window.selectedYearRanges.map(range => `${range[0]}-${range[1]}`);

            // Flatten data for the barplot
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
            const y0 = d3.scaleBand().domain(genres).range([0, height]).paddingInner(0.2);
            const y1 = d3.scaleBand().domain(ranges).range([0, y0.bandwidth()]).padding(0.05);
            const x = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).range([0, width]);

            // Add grid lines
            addGridLines(svg, x, width, height);

            // Add y-axis with interactive labels
            addYAxis(svg, y0, genres);

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
                .on("mouseover", function () {
                    // Reduce opacity of all bars
                    svg.selectAll(".bar-group rect").attr("fill-opacity", 0.3);
                    // Highlight hovered bars
                    d3.select(this).selectAll("rect").attr("fill-opacity", 1);
                })
                .on("mouseout", function () {
                    // Restore opacity of all bars
                    svg.selectAll(".bar-group rect").attr("fill-opacity", 1);
                })
                .on("click", function (event, genre) {
                    updateSelectedGenre(genre);
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

            // Add axis label
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + 35)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("fill", "white")
                .text("Number of songs");
        })
        .catch((err) => {
            console.error("Error rendering barplot:", err);
            displayNoDataMessage(svg, width, height);
        });
}


// Adds vertical grid lines to the barplot.
function addGridLines(svg, x, width, height) {
    const grid = svg.append("g").attr("class", "grid");

    // Vertical grid lines (x-axis)
    grid.selectAll(".vertical-line")
        .data(x.ticks(5))
        .enter()
        .append("line")
        .attr("class", "vertical-line")
        .attr("x1", d => x(d))
        .attr("x2", d => x(d))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "white")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-dasharray", "4 4");
}


// Adds the y-axis with interactive labels.
function addYAxis(svg, yScale, genres) {
    const yAxis = svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .selectAll(".tick")
        .style("font-size", "14px")
        .style("cursor", "pointer");

    yAxis.each(function (d) {
        const tick = d3.select(this);
        const bbox = tick.node().getBBox();

        // Add a rectangle behind each tick label for hover effect
        tick.insert("rect", ":first-child")
            .attr("x", bbox.x - 10)
            .attr("y", bbox.y - 5)
            .attr("width", bbox.width + 5)
            .attr("height", bbox.height + 10)
            .attr("fill", "transparent")
            .attr("rx", 5)
            .attr("ry", 5);

        // Handle hover and click
        tick.on("mouseover", function () {
            svg.selectAll(".bar-group rect").attr("fill-opacity", 0.3);
            svg.selectAll(`.bar-group[transform="translate(0,${yScale(d)})"] rect`).attr("fill-opacity", 1);
            tick.select("rect").attr("fill", "rgba(255, 255, 255, 0.3)");
        })
            .on("mouseout", function () {
                svg.selectAll(".bar-group rect").attr("fill-opacity", 1);
                tick.select("rect").attr("fill", "transparent");
            })
            .on("click", function () {
                updateSelectedGenre(d);
            });
    });
}

// Updates the global selected genre and dispatches an event.
function updateSelectedGenre(genre) {
    window.selectedGenre = genre;
    // console.log(`Genre updated to: ${genre}`);
    const genreEvent = new CustomEvent("genreUpdated", { detail: { genre } });
    window.dispatchEvent(genreEvent);
}


// Displays a "No data available" message when there's an error.
function displayNoDataMessage(svg, width, height) {
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .text("No data available");
}


// ========================= Bottom Container (Genres) =========================

// Renders the bottom container with a detailed barplot for the selected genre.
function renderBottomContainerGenres(containerHeightFraction) {
    const container = d3.select("#bottomContainer_featuregenre");
    container.selectAll("*").remove(); // Clear previous plots

    const width = featureGenreWidth;
    const height = featureGenreHeight * containerHeightFraction; // Scaled height

    const margin = {
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

    // Render the detailed barplot
    renderDetailedbarplot(svg, width - margin.left - margin.right, height - margin.top - margin.bottom);
}

//Renders a detailed barplot showing the number of songs per year range for the selected genre.
function renderDetailedbarplot(svg, width, height) {
    filter_data()
        .then((filteredData) => {
            const selectedGenre = window.selectedGenre;

            // Handle missing genre selection
            if (!selectedGenre) {
                displayMessage(svg, width, height, "No genre selected.");
                return;
            }

            const genreData = filteredData[selectedGenre];

            // Handle missing genre data
            if (!genreData || genreData.length === 0) {
                displayMessage(svg, width, height, `No data available for genre: ${selectedGenre}`);
                return;
            }

            const ranges = window.selectedYearRanges.map(range => `${range[0]}-${range[1]}`);

            // Prepare data for the barplot (song count per year range)
            const data = window.selectedYearRanges.map(range => {
                const rangeData = genreData.filter(row => row.Jaar >= range[0] && row.Jaar <= range[1]);
                return {
                    range: `${range[0]}-${range[1]}`,
                    count: rangeData.length
                };
            });

            // Define scales
            const y = d3.scaleBand().domain(ranges).range([0, height]).paddingInner(0.2);
            const x = d3.scaleLinear().domain([0, d3.max(data, d => d.count) * 1.05]).range([0, width]);

            // Add axes and grid lines
            addbarplotAxes(svg, x, y, width, height);

            // Draw bars with hover effects
            addbarplotBars(svg, data, x, y, width, ranges);

            // Add x-axis label
            svg.append("text")
                .attr("x", width / 2)
                .attr("y", height + 35)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("fill", "white")
                .text(`Number of songs labeled as ${selectedGenre}`);
        })
        .catch((err) => console.error("Error rendering barplot:", err));
}

// Adds x and y axes, along with grid lines, to the barplot.

function addbarplotAxes(svg, x, y, width, height) {
    // X-axis (count)
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));

    // Y-axis (year ranges)
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("font-size", "14px");

    // Grid lines for x-axis
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(0,${height})`)
        .call(
            d3.axisBottom(x)
                .ticks(5)
                .tickSize(-height)
                .tickFormat("") // Hide tick labels
        )
        .selectAll("line")
        .attr("stroke", "white")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-dasharray", "4 4");
}

// Adds bars to the barplot, with hover effects.
function addbarplotBars(svg, data, x, y, width, ranges) {
    const bars = svg.selectAll(".bar-group")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(0,${y(d.range)})`);

    // Add bars
    bars.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", d => x(d.count))
        .attr("height", y.bandwidth())
        .attr("fill", d => get_color_yearRange(d.range, ranges))
        .attr("data-range", d => d.range)
        .attr("data-original-color", d => get_color_yearRange(d.range, ranges))
        .on("mouseover", function () {
            bars.selectAll("rect").attr("opacity", 0.5);
            d3.select(this).attr("opacity", 1.0);
            d3.select(this.parentNode).select("text").style("display", "block");
        })
        .on("mouseout", function () {
            bars.selectAll("rect").attr("opacity", 1.0);
            d3.select(this.parentNode).select("text").style("display", "none");
        });

    // Add text labels inside the bars
    bars.append("text")
        .attr("x", d => x(d.count) - width * 0.05)
        .attr("y", y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .style("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("display", "none")
        .text(d => d.count);
}

// Displays a message (e.g., no data available) inside the SVG container.
function displayMessage(svg, width, height, message) {
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("fill", "white")
        .text(message);
}

// ========================= Event Listeners =========================

// Re-render plots when global state updates
["typeUpdated", "genreUpdated", "yearRangeUpdated", "weekRangeUpdated", "topUpdated"]
    .forEach(eventType => window.addEventListener(eventType, initializePlots));

// Initialize on page load
document.addEventListener("DOMContentLoaded", initializePlots);

