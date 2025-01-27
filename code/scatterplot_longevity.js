function createinfobutton_feat() {
    createInfoButtonWithTooltip(
        "longevityCharts",
        "Feature Value Distribution by Longevity",
        "This scatterplot displays per song its feature value and the amount of weeks the song was in the user-selected top positions. When zoomed out, it shows the density of these points.",
        "Longevity, amount of weeks in the user-selected top (default 40)",
        "Feature value",
        "Points, areas",
        "Position, color hue",
        "By scrolling on the plot, you can zoom in on the data. When a small enough range is selected (less than 6000 songs), the individual songs become visible. By clicking on the dots, you can see the song details and a barchart displaying all feature values.",
        "left"
    );
}

function createinfobutton_genre() {
    createInfoButtonWithTooltip(
        "longevityCharts",
        "Genre Distribution by Longevity",
        "This line plot shows the normalized number of songs in the selected genre that stayed in the top position for a certain number of weeks. The values are normalized by dividing the number of songs for each longevity week by the total number of songs in the selected year range. This allows comparisons across year ranges of different sizes.",
        "Longevity, amount of weeks in the user-selected top (default 40)",
        "Normalized Song Count",
        "lines, areas underneath lines",
        "color hue for year ranges, y-postion for frequency value, x-position for longevity",
        "Use this plot to analyze if the selected genre tends to produce longer-lasting hits across different year ranges, and if different trends can be spotted.",
        "left"
    );
}

createinfobutton_feat();


let infoButtonExists_feat = true;
let infoButtonExists_genre = false;
const headerElement = document.createElement("h1");

headerElement.id = "longevityHeader_2";
document.getElementById("longevityCharts").prepend(headerElement);

// Simplified updateHeader function
function updateHeader(headerText) {
    const headerElement = document.getElementById('longevityHeader_2');
    if (headerElement) {
        headerElement.textContent = headerText;
    }
}

// Ensure consistent header updates in toggleVisibility
function toggleVisibility(selectedType) {
    if (selectedType === "features") {
        hideGenreElements();

        if (!infoButtonExists_feat) {
            createinfobutton_feat();
            infoButtonExists_feat = true;
        }

        if (infoButtonExists_genre) {
            removeButtonByContainerId("longevityCharts");
            infoButtonExists_genre = false;
        }

        showFeatureElements();
        updateHeader(`${window.selectedGenre} Value Distribution by Longevity for ${window.selectedRange}`);
    } else if (selectedType === "genres") {
        hideFeatureElements();

        if (!infoButtonExists_genre) {
            createinfobutton_genre();
            infoButtonExists_genre = true;
        }

        if (infoButtonExists_feat) {
            removeButtonByContainerId("longevityCharts");
            infoButtonExists_feat = false;
        }

        showGenreElements();
        updateHeader(`${window.selectedGenre} Distribution by Longevity`);
    }
}

// Function to hide feature-related elements
function hideFeatureElements() {
    const featureElements = document.querySelectorAll('#barchart, #scatterplot, #feature-selector, #tooltip');
    featureElements.forEach(el => el.style.display = 'none');
}

// Function to show feature-related elements
function showFeatureElements() {
    const featureElements = document.querySelectorAll('#barchart, #scatterplot, #feature-selector, #tooltip');
    featureElements.forEach(el => el.style.display = 'block');
}

// Function to hide genre-related elements
function hideGenreElements() {
    const genreElements = document.querySelectorAll('#selected_genre_long, #longevity_histogram, #controls, #table-container_long, #value-table');
    genreElements.forEach(el => el.style.display = 'none');
}

// Function to show genre-related elements
function showGenreElements() {
    const genreElements = document.querySelectorAll('#selected_genre_long, #longevity_histogram, #controls, #table-container_long, #value-table');
    genreElements.forEach(el => el.style.display = 'block');
}

// Function to update or create the header dynamically
function updateHeader(headerText) {
    let headerElement = document.getElementById('longevityHeader_2');
    if (!headerElement) {
        headerElement = document.createElement("h1");
        headerElement.id = "longevityHeader_2";
        const longevityChartsContainer = document.getElementById("longevityCharts");
        longevityChartsContainer.insertBefore(headerElement, longevityChartsContainer.firstChild);
    }
    headerElement.textContent = headerText;
}

// Function to hide all elements (used for reset)
function hideAllElements() {
    const elementsToHide = document.querySelectorAll('#barchart, #scatterplot, #feature-selector, #tooltip, #prev, #next, #year-range-display, #clip, #h1');
    elementsToHide.forEach(element => {
        element.style.display = 'none';
    });
}

// Event listener for type updates
window.addEventListener("typeUpdated", function () {
    toggleVisibility(window.selectedType);
});


function updateLongevityChartContent() {
    const selectedFeatureElement = document.getElementById('selected_feature_long');
    const selectedGenreElement = document.getElementById('selected_genre_long');

    if (window.selectedType === 'features') {
        selectedFeatureElement.style.display = 'block';
        selectedGenreElement.style.display = 'none';

        updateHeader(`${window.selectedGenre} Value Distribution by Longevity for ${window.selectedRange}`)

        const elementsToHide = document.querySelectorAll('#barchart, #scatterplot, #feature-selector, #tooltip, #prev, #next, #year-range-display, #clip');
        elementsToHide.forEach(element => {
            element.style.display = 'block';
        });

    } else if (window.selectedType === 'genres') {
        selectedFeatureElement.style.display = 'none';
        selectedGenreElement.style.display = 'block';
        hideAllElements();
        updateHeader(`${window.selectedGenre} Distribution by Longevity`);
    }
}

const header = document.createElement("h1");
header.id = "longevityHeader_2";
const longevityChartsContainer = document.getElementById("longevityCharts");
longevityChartsContainer.insertBefore(header, longevityChartsContainer.firstChild);

const allWeeks = [];

const week_ranges = window.selectedWeekRange;

function loadAndProcess_FeaturesData_scat(filtered_data_input, range_years) {
    const filteredData = filtered_data_input.filter(row =>
        +row.Jaar >= range_years[0] && +row.Jaar <= range_years[1]
    );

    const groupedBySong = d3.group(filteredData, (row) => row.Song_ID);

    // Calculate longevity (number of unique weeks) for each song
    const plotData = Array.from(groupedBySong, ([Song_ID, appearances]) => {
        const uniqueWeeks = new Set(appearances.map(entry => entry.Weeknr)).size;

        const representativeEntry = appearances[0];

        return {
            Song_ID,
            Artist: representativeEntry.Artist,
            Title: representativeEntry.Titel,
            Longevity: uniqueWeeks,
            Danceability: representativeEntry.Danceability,
            Loudness: representativeEntry.Loudness,
            Tempo: representativeEntry.Tempo,
            Acousticness: representativeEntry.Acousticness,
            Energy: representativeEntry.Energy,
            Valence: representativeEntry.Valence,
        };
    });

    return plotData;
}

function showBarChart(year_range, colour, song, selectedFeature) {
    var width_scatterplot_container = document.getElementById("longevityCharts").clientWidth;
    var height_scatterplot_container = 800;
    var margin_scatterplot = {
        top: height_scatterplot_container * 0.1,
        right: width_scatterplot_container * 0.1,
        bottom: height_scatterplot_container * 0.4,
        left: width_scatterplot_container * 0.2
    };
    var width_scatterplot = width_scatterplot_container - margin_scatterplot.left - margin_scatterplot.right;
    var height_scatterplot = height_scatterplot_container - margin_scatterplot.top - margin_scatterplot.bottom;
    const barChartContainer = d3.select("#barchart");
    barChartContainer.selectAll("*").remove();

    const barChart = d3
        .select("#barchart")
        .append("svg")
        .attr("width", width_scatterplot)
        .attr("height", height_scatterplot + margin_scatterplot.bottom);

    const selectedFeatures = ['Danceability', 'Acousticness', 'Energy', 'Tempo', 'Valence', 'Loudness'];
    const featureData = selectedFeatures
        .map(feature => ({feature, value: song[feature]}))
        .filter(d => d.value != null && d.value != undefined);

    const xScale = d3.scaleBand()
        .domain(featureData.map(d => d.feature))
        .range([margin_scatterplot.left, (width_scatterplot - margin_scatterplot.right) * 1.2])
        .padding(0.1);

    const increasedHeight = height_scatterplot * 1.5;

    const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([increasedHeight - margin_scatterplot.bottom, margin_scatterplot.top]);

    barChart.selectAll("*").remove();

    const chartGroup = barChart.append("g")
        .attr("transform", "translate(0, -10)");

    chartGroup.append("g")
        .attr("transform", `translate(0, ${increasedHeight - margin_scatterplot.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    chartGroup.append("g")
        .attr("transform", `translate(${margin_scatterplot.left}, 0)`)
        .call(d3.axisLeft(yScale));


    chartGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(increasedHeight / 3))
        .attr("y", margin_scatterplot.left - 50)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .attr("class", "label-text")
        .text(`Feature Values`);


    chartGroup.selectAll("rect")
        .data(featureData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.feature))
        .attr("y", yScale(0))
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .attr("fill", d => d.feature === selectedFeature ? colour : "darkgrey")
        .transition()
        .duration(500)
        .attr("y", d => yScale(d.value))
        .attr("height", d => increasedHeight - margin_scatterplot.bottom - yScale(d.value));
    console.log(chartGroup)
}


function showTooltip(event, d) {
    const tooltip = d3.select("#tooltip");
    tooltip.style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .style("opacity", 1)
        .html(`<strong>Artist:</strong> ${d.Artist}<br><strong>Title:</strong> ${d.Title}`);
}

function createInteractiveGraph_Features_scat(divId, data, features, feature, year_range, year_range_colour) {
    var width_scatterplot_container = document.getElementById("longevityCharts").clientWidth;
    var height_scatterplot_container = document.getElementById("longevityCharts").clientHeight/1.8;
    var margin_scatterplot = {
        top: height_scatterplot_container * 0.1,
        right: width_scatterplot_container * 0.1,
        bottom: height_scatterplot_container * 0.3,
        left: width_scatterplot_container * 0.2
    };
    var width_scatterplot = width_scatterplot_container - margin_scatterplot.left - margin_scatterplot.right;
    var height_scatterplot = height_scatterplot_container - margin_scatterplot.top - margin_scatterplot.bottom;

    const svg = d3
        .select(divId)
        .append("svg")
        .attr("width", width_scatterplot + margin_scatterplot.left + margin_scatterplot.right)
        .attr("height", height_scatterplot + margin_scatterplot.bottom)
        .style("overflow", "hidden")
        .append("g")
        .attr("transform", `translate(${margin_scatterplot.left},${margin_scatterplot.top})`);

    // Define scales
    const xScale = d3.scaleLinear().domain(d3.extent(data, d => d.Longevity)).range([0, width_scatterplot]);
    const yScale = d3.scaleLinear().domain([0, 1]).range([height_scatterplot, 0]);

    // Define axes
    const xAxis = d3.axisBottom(xScale).ticks(null).tickFormat(d => (d % 1 === 0 ? d : ''));
    const yAxis = d3.axisLeft(yScale);

    // Append axes
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height_scatterplot})`)
        .call(xAxis);


    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // x-axis
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width_scatterplot * 0.5)
        .attr("y", height_scatterplot * 1.2)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "white")
        .text(`Longevity (amount of weeks song was charted in the top ${window.selectedTop})`);

    // y-axis
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -height_scatterplot * 0.5)
        .attr("y", -margin_scatterplot.left * 0.4)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .style("font-size", "12px")
        .style("fill", "white")
        .text(`Value of  ${feature}`);


    // Create a clipping path
    svg.append("defs").append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width_scatterplot)
        .attr("height", height_scatterplot);

    // Contour density
    const contours = d3.contourDensity()
        .x(d => xScale(d.Longevity))
        .y(d => yScale(d[feature]))
        .size([width_scatterplot, height_scatterplot])
        .bandwidth(30)
        .thresholds(12)(data);

    // Apply the clipping path to the contours
    svg.append("g")
        .attr("clip-path", "url(#clip)")
        .attr("fill", year_range_colour)
        .attr("fill-opacity", 0.3)
        .attr("stroke", year_range_colour)
        .attr("stroke-linejoin", "round")
        .selectAll("path")
        .data(contours)
        .join("path")
        .attr("class", "contour-path")
        .attr("stroke-width", (d, i) => (i % 5 ? 0.25 : 1))
        .attr("d", d3.geoPath());

    // Create the dot group with clipping path applied
    const dotGroup = svg.append("g").attr("clip-path", "url(#clip)");

    let previouslySelectedDot = null;
    // Dots for the scatterplot
    const dots = dotGroup
        .selectAll(".dot-scatter")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot-scatter")
        .attr("cx", d => xScale(d.Longevity))
        .attr("cy", d => yScale(d[feature]))
        .attr("r", 8)
        .attr("opacity", 0)
        .style("fill", year_range_colour)
        .on("click", (event, d) => {
            const dot = d3.select(event.target);
    
            // Reset the previously selected dot 
            if (previouslySelectedDot) {
                previouslySelectedDot
                    .style("fill", year_range_colour) 
                    .attr("r", 8); 
            }

            dot.style("fill", "orange").attr("r", 10); // Change color and size
            previouslySelectedDot = dot;

            const initialX = dot.attr("cx");
            const initialY = dot.attr("cy");
            dot.transition()
                .duration(500)
                .attr("cy", height_scatterplot)
                .attr("opacity", 1)
                .on("end", function () {
                    showBarChart(year_range, year_range_colour, d, feature);
                    showTooltip(event, d);
                    d3.select(this)
                        .attr("cy", initialY)
                        .attr("cx", initialX)
                        .on("end", function () {
                            d3.select(this).attr("opacity", 0);
                        });
                });
        })
        .on("mouseover", (event, d) => {
            d3.select(event.target)
                .attr("r", 10) 
                .transition()
                .duration(200);
        })
        .on("mouseout", event => {
            const dot = d3.select(event.target);
            if (!dot.classed("selected")) {
                dot.attr("r", 8);
            }
        });


    const background = svg.append("rect")
        .attr("width", width_scatterplot)
        .attr("height", height_scatterplot)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mousedown", function () {
            d3.select(this).style("pointer-events", "none");
        })
        .on("mouseup", function () {
            d3.select(this).style("pointer-events", "all");
        });


    const zoom = d3.zoom()
        .scaleExtent([1, 30])
        .on("zoom", event => {
            const newXScale = event.transform.rescaleX(xScale).clamp(true);
            const newYScale = event.transform.rescaleY(yScale).clamp(true);

            svg.select(".x-axis").call(xAxis.scale(newXScale));
            svg.select(".y-axis").call(yAxis.scale(newYScale));

            if (data.length < 6000) {
                dots.attr("cx", d => newXScale(d.Longevity))
                    .attr("cy", d => newYScale(d[feature]))
                    .attr("r", d => Math.max(10 - event.transform.k, 8))
                    .attr("opacity", d => Math.min(1, (event.transform.k - 1) / 5))
                    .attr("visibility", d =>
                        d.Longevity >= newXScale.domain()[0] &&
                        d.Longevity <= newXScale.domain()[1] &&
                        d[feature] >= newYScale.domain()[0] &&
                        d[feature] <= newYScale.domain()[1]
                            ? "visible"
                            : "hidden"
                    );
            }

            svg.selectAll(".contour-path")
                .attr("transform", event.transform.toString())
                .attr("fill-opacity", 0.3 / event.transform.k);
        });

    background.call(zoom);
    svg.call(zoom);
}

let currentYearRangeIndex_scat = 0;
let global_data_scat = []
let selected_genre = ""
const sortedYearRanges_scat = window.selectedYearRanges.sort((a, b) => a[0] - b[0]);

function update_scat_features(filtered_data_input, selectedGenre_scat) {
    global_data_scat = filtered_data_input;
    selected_genre = selectedGenre_scat;
    const selectedYearRanges_scat = window.selectedYearRanges.sort((a, b) => a[0] - b[0]);
    const currentYearRange = selectedYearRanges_scat[currentYearRangeIndex_scat];
    const yearRangeColor = get_color_yearRange(currentYearRange, selectedYearRanges_scat);
    const data = loadAndProcess_FeaturesData_scat(filtered_data_input, currentYearRange, selectedGenre_scat, possible_features_songs, selectedYearRanges_scat);

    // d3.select("#year-range-display")
    //     .text(`Year Range: ${yearRangeText}`)
    //     .style("background-color", yearRangeColor)
    d3.select("#scatterplot").html("");
    createInteractiveGraph_Features_scat("#scatterplot", data, possible_features_songs, selected_genre, currentYearRange, yearRangeColor);
    updateHeader(`${window.selectedGenre} Value Distribution by Longevity for ${window.selectedRange}`)

}

window.addEventListener("selectedRangeUpdated", function () {
    const selectedRange = window.selectedRange; 
    const selectedYearRanges_scat = window.selectedYearRanges.sort((a, b) => a[0] - b[0]);
    const currentYearRange = selectedRange;
    console.log("selected", selectedRange)
    const yearRangeColor = get_color_yearRange(currentYearRange, selectedYearRanges_scat);
    const data = loadAndProcess_FeaturesData_scat(global_data_scat, currentYearRange, selected_genre, possible_features_songs, selectedYearRanges_scat);
    d3.select("#scatterplot").html("");
    updateHeader(`${window.selectedGenre} Value Distribution by Longevity for ${window.selectedRange}`);
    createInteractiveGraph_Features_scat("#scatterplot", data, possible_features_songs, selected_genre, currentYearRange, yearRangeColor);
});

// document.getElementById("prev").addEventListener("click", function () {
//     const totalRanges = window.selectedYearRanges.length;
//     currentYearRangeIndex_scat = (currentYearRangeIndex_scat - 1 + totalRanges) % totalRanges;
//     update_scat_features(global_data_scat, selected_genre);
// });

// document.getElementById("next").addEventListener("click", function () {
//     const totalRanges = window.selectedYearRanges.length;
//     currentYearRangeIndex_scat = (currentYearRangeIndex_scat + 1) % totalRanges;
//     update_scat_features(global_data_scat, selected_genre);
// });


// =========================================== Genre Selected ========================================================
let smoothingEnabled = false;

function renderGenrePlot(filtered_data, selectedType) {
    const genreData = filtered_data[selectedType] || [];

    const yearRanges = window.selectedYearRanges.sort((a, b) => a[0] - b[0]);

    // Calculate longevity (number of unique weeks) for each song
    const groupedBySong = d3.group(genreData, (song) => song.Song_ID);

    const songLongevity = Array.from(groupedBySong, ([Song_ID, appearances]) => {
        const uniqueWeeks = new Set(appearances.map((entry) => entry.Weeknr));
        return {
            Song_ID,
            longevity: uniqueWeeks.size,
        };
    });

    const longevityCounts = d3.rollup(
        songLongevity,
        (songs) => songs.length,
        (song) => song.longevity
    );

    // Determine the max weeks dynamically
    const maxWeeks = Math.max(...Array.from(longevityCounts.keys()));

    const frequencyData = fillMissingWeeks(
        Array.from(longevityCounts, ([weeks, frequency]) => ({
            weeks: +weeks,
            frequency: +frequency,
        })).sort((a, b) => a.weeks - b.weeks),
        maxWeeks
    );

    const finalData = smoothingEnabled ? smoothData(frequencyData) : frequencyData;

    createVisualization(finalData, genreData, yearRanges, maxWeeks);
}


function fillMissingWeeks(data, maxWeeks) {
    const weekMap = new Map(data.map(d => [d.weeks, d.frequency]));
    const filledData = [];
    for (let week = 1; week <= maxWeeks; week++) {
        filledData.push({
            weeks: week,
            frequency: weekMap.get(week) || 0
        });
    }
    return filledData;
}

function smoothData(data, windowSize = 3) {
    return data.map((d, i, arr) => {
        const start = Math.max(0, i - Math.floor(windowSize / 2));
        const end = Math.min(arr.length, i + Math.ceil(windowSize / 2));
        const window = arr.slice(start, end);
        const average = d3.mean(window, w => w.frequency);
        return { ...d, frequency: average };
    });
}

function addInteractiveLine(svg, xScale, yScale, freqData, yearRanges, margin) {
    console.log("input year ranges", yearRanges)
    const overlay = svg.append("rect")
        .attr("class", "interactive-overlay")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", svg.attr("width") - margin.left - margin.right)
        .attr("height", svg.attr("height") - margin.top - margin.bottom)
        .attr("fill", "none")
        .attr("pointer-events", "all");

    const verticalLine = svg.append("line")
        .attr("class", "interactive-line")
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#333")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("visibility", "hidden")
        .style("pointer-events", "none");

    const tbody = d3.select("#value-table_long"); // Targeting the table you want to populate

    overlay
        .on("mouseover", () => {
            verticalLine.style("opacity", 1);
            tooltip.style("visibility", "visible");
        })
        .on("mouseout", () => {
            verticalLine.style("opacity", 0);
            tooltip.style("visibility", "hidden");
        })
        .on("mousemove", function (event) {
            const [mouseX] = d3.pointer(event, this);
            const adjustedX = mouseX - margin.left;
            const weekIndex = Math.floor(adjustedX / xScale.bandwidth());

            const xDomain = xScale.domain();
            if (weekIndex < 0 || weekIndex >= xDomain.length) return;

            const week = xDomain[weekIndex];
            console.log("week hovered: ", week)
            const xPosition = xScale(week) + xScale.bandwidth() / 2;
            verticalLine
                .attr("x1", xPosition)
                .attr("x2", xPosition)
                .attr("y1", margin.top)
                .attr("y2", svg.attr("height") - margin.bottom);

            // Filter data for the selected week
            const weekData = freqData.filter(d => d.weeks === week);
            if (weekData.length > 0) {
                tbody.selectAll("tr").remove(); // Clear existing rows before adding new data

                // Create a new table row for the selected week
                const row = tbody.append("tr");

                // First column: Week value
                row.append("td").text(week).style("border", "1px solid white").style("padding", "5px");

                // Loop through each year range and populate corresponding data
                yearRanges.forEach(year_range => {
                    const dataForYear = weekData.filter(d => d.Jaar >= year_range[0] && d.Jaar <= year_range[1]);

                    // Calculate the total frequency in the selected year range
                    const totalCount = d3.sum(dataForYear, d => d.oldfreq); // Sum the old frequencies to get total

                    // Calculate the frequency in the specific week for the selected year range
                    const thisWeekCount = d3.sum(dataForYear.filter(d => d.weeks === week), d => d.oldfreq);

                    // Add year-specific data in the table
                    row.append("td")
                        .text(`${thisWeekCount} (Total: ${totalCount})`)  // Showing week frequency and total count for the range
                        .style("border", "1px solid white")
                        .style("padding", "5px");
                });
            }
        });
}

// Apply dynamic filters
function createVisualization(freqData, dynamicallyFilteredData, yearRanges, maxWeeks) {
    var width_scatterplot_container = document.getElementById("longevityCharts").clientWidth;
    var height_scatterplot_container = document.getElementById("longevityCharts").clientHeight;

    const svg = d3.select("#longevity_histogram").attr("width", width_scatterplot_container).attr("height", height_scatterplot_container);
    const width_longevityGenre = +svg.attr("width");
    const height_longevityGenre = height_scatterplot_container;
    const margin_longevityGenre = { top: height_scatterplot_container * 0.1, right: width_scatterplot_container * 0.1, bottom: height_scatterplot_container * 0.3, left: width_scatterplot_container * 0.15 };

    console.log("height container", height_longevityGenre)
    // Clear old plot lines and areas, but not the axes
    svg.selectAll(".line-path").transition().duration(500).style("opacity", 0).remove();
    svg.selectAll(".area").transition().duration(500).style("opacity", 0).remove();

    const x = d3.scaleBand()
        .domain(freqData.map((d) => d.weeks))
        .range([margin_longevityGenre.left, width_longevityGenre - margin_longevityGenre.right])
        .padding(0.1);

    let yScale;
        yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([height_longevityGenre - margin_longevityGenre.bottom, margin_longevityGenre.top]);

    if (yearRanges.length === 1) {
        const uniqueSongsCount = new Set(dynamicallyFilteredData.map(row => row.Song_ID)).size;

        // Normalize the frequency
        freqData.forEach(d => {
            d.oldfreq = d.frequency
            d.frequency = d.frequency / uniqueSongsCount;
        });

        const maxFrequency = d3.max(freqData, (d) => d.frequency);
        yScale = d3.scaleLinear()
            .domain([0, Math.max(0.25, maxFrequency)])
            .nice()
            .range([height_longevityGenre - margin_longevityGenre.bottom, margin_longevityGenre.top]);


        singleLinePlot(svg, x, yScale, freqData, viridisScale(1));
    } else {
        let maxFrequency = 0;
        const groupedData = yearRanges.map(([start, end], index) => {
            const rangeKey = `${start}-${end}`;
            const filtered = dynamicallyFilteredData.filter(row => row.Jaar >= start && row.Jaar <= end);
            const uniqueSongsCount = new Set(filtered.map(row => row.Song_ID)).size;

            const groupedBySong = d3.group(filtered, (song) => song.Song_ID);
            const songLongevity = Array.from(groupedBySong, ([Song_ID, appearances]) => {
                const uniqueWeeks = new Set(appearances.map((entry) => entry.Weeknr));
                return { Song_ID, longevity: uniqueWeeks.size };
            });

            const longevityCounts = d3.rollup(
                songLongevity,
                (songs) => songs.length,
                (song) => song.longevity
            );

            const filledData = fillMissingWeeks(
                Array.from(longevityCounts, ([weeks, frequency]) => ({
                    weeks: +weeks,
                    oldfreq: frequency,
                    frequency: frequency / uniqueSongsCount,
                })).sort((a, b) => a.weeks - b.weeks),
                maxWeeks
            );

            maxFrequency = Math.max(maxFrequency, d3.max(filledData, (d) => d.frequency));

            return {
                range: rangeKey,
                data: smoothingEnabled ? smoothData(filledData) : filledData,
                color: viridisScale(index + 1),
            };
        });
        yScale = d3.scaleLinear()
            .domain([0, Math.max(0.25, maxFrequency)])
            .nice()
            .range([height_longevityGenre - margin_longevityGenre.bottom, margin_longevityGenre.top]);

        renderLinePlot(svg, x, yScale, groupedData, viridisScale, width_longevityGenre, height_longevityGenre, margin_longevityGenre);
    }

    // Handle the X-axis transition
    let xAxisGroup = svg.select(".x-axis-group");
    if (xAxisGroup.empty()) {
        xAxisGroup = svg.append("g")
            .attr("class", "x-axis-group")
            .attr("transform", `translate(0,${height_longevityGenre - margin_longevityGenre.bottom})`)
            .call(d3.axisBottom(x).tickSize(-height_longevityGenre + margin_longevityGenre.top + margin_longevityGenre.bottom).ticks(5));

        // Apply consistent styling for ticks
        xAxisGroup.selectAll(".tick line")
            .style("stroke", "#535067")
            .style("stroke-width", 0.6);

        // Remove the domain (top axis line) by setting its tick size to 0
        xAxisGroup.select("path.domain").style("display", "none");

        // Manually draw the bottom axis line (this is the "domain" path, but we manually control it)
        xAxisGroup.append("path")
            .attr("class", "x-axis-line")
            .attr("d", `M${margin_longevityGenre.left},0L${width_longevityGenre - margin_longevityGenre.right},0`)  // Stretches the line to the domain's full length
            .style("stroke", "#9694af")
            .style("stroke-width", 3);
    } else {
        xAxisGroup.transition()
            .duration(1000)
            .ease(d3.easeCubicOut)
            .call(d3.axisBottom(x).tickSize(-height_longevityGenre + margin_longevityGenre.top + margin_longevityGenre.bottom).ticks(5));

        // Apply consistent styling for ticks during transition
        xAxisGroup.selectAll(".tick line")
            .style("stroke", "#535067")
            .style("stroke-width", 0.6);

        // Remove the domain (top axis line) by setting its tick size to 0
        xAxisGroup.select("path.domain").style("display", "none");

        // Manually draw the bottom axis line during transition (matching domain length)
        xAxisGroup.select(".x-axis-line")
            .attr("d", `M${margin_longevityGenre.left},0L${width_longevityGenre - margin_longevityGenre.right},0`)
            .style("stroke", "#9694af")
            .style("stroke-width", 3);
    }

// Handle the Y-axis transition (left axis)
    let yAxisGroup = svg.select(".y-axis-group");
    if (yAxisGroup.empty()) {
        yAxisGroup = svg.append("g")
            .attr("class", "y-axis-group")
            .attr("transform", `translate(${margin_longevityGenre.left},0)`)
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-width_longevityGenre + margin_longevityGenre.left + margin_longevityGenre.right));

        // Apply consistent styling for ticks
        yAxisGroup.selectAll(".tick line")
            .style("stroke", "#65627c")
            .style("stroke-width", 1.5);

        // Remove the domain (right axis line)
        yAxisGroup.select("path.domain").style("display", "none");

        // Manually draw the left axis line (this is the "domain" path, but we manually control it)
        yAxisGroup.append("path")
            .attr("class", "y-axis-line")
            .attr("d", `M0,${margin_longevityGenre.top}L0,${height_longevityGenre - margin_longevityGenre.bottom}`)  // Stretches the line to the domain's full height
            .style("stroke", "#9694af")
            .style("stroke-width", 3);
    } else {
        yAxisGroup.transition()
            .duration(1000)
            .ease(d3.easeCubicOut)
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-width_longevityGenre + margin_longevityGenre.left + margin_longevityGenre.right));

        // Apply consistent styling for ticks during transition
        yAxisGroup.selectAll(".tick line")
            .style("stroke", "#65627c")
            .style("stroke-width", 1.5);

        // Remove the domain (right axis line)
        yAxisGroup.select("path.domain").style("display", "none");

        // Manually draw the left axis line during transition (matching domain height)
        yAxisGroup.select(".y-axis-line")
            .attr("d", `M0,${margin_longevityGenre.top}L0,${height_longevityGenre - margin_longevityGenre.bottom}`)
            .style("stroke", "#9694af")
            .style("stroke-width", 3);
    }

    svg.select(".x-axis-label").remove();

    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width_longevityGenre / 2)
        .attr("y", height_longevityGenre - margin_longevityGenre.bottom * 0.82)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "white")
        .text(`Longevity (Amount of Weeks Song Was Charted in The Top ${window.selectedTop})`);

    svg.select(".y-axis-label").remove();

// Y-axis label
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -height_longevityGenre / 2.4)
        .attr("y", margin_longevityGenre.left * 0.6)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")  // Rotate the text to align with the Y-axis
        .style("font-size", "12px")
        .style("fill", "white")
        .text(`Normalized Song Count`);

    addInteractiveLine(svg, x, yScale, freqData, yearRanges, margin_longevityGenre);
    updateHeader(`${window.selectedGenre} Distribution by Longevity`);
}

// Render line plot with smooth transitions and consistent styles
function renderLinePlot(svg, x, yRight, groupedData) {
    console.log("render lineplot called")
    const line = d3.line()
        .x(d => x(d.weeks) + x.bandwidth() / 2)
        .y(d => yRight(d.frequency));

    groupedData.forEach(({ range, data, color }) => {
        svg.append("path")
            .datum(data)
            .attr("class", "line-path")  // Add class for line paths to easily clear them later
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("opacity", 1)
            .attr("d", line)
            .attr("data-range", range)
            .attr("data-original-color", color)
            .attr("class", "area")
            .attr("fill-opacity", 0.1)
    });
}

// Render single line plot
function singleLinePlot(svg, x, y, data, color) {
    svg.selectAll(".area").remove();

    const area = d3.area()
        .x(d => x(d.weeks) + x.bandwidth() / 2)
        .y0(y(0))
        .y1(d => y(d.frequency));

    svg.append("path")
        .data([data])
        .attr("class", "area")
        .attr("d", area)
        .attr("fill", color)
        .attr("fill-opacity", 1)

}

// Smoothing toggle
function createSmoothingToggle() {
    const container = d3.select("#controls");
    container.append("label").text("Smoothing:");
    container.append("input")
        .attr("type", "checkbox")
        .on("change", function () {
            smoothingEnabled = this.checked;
            applyDynamicFilters();
        });
}

function longevity_genre_yearhighlight(selectedRange) {
    const svg = d3.select("#longevity_histogram");
    if (!selectedRange || !Array.isArray(selectedRange) || selectedRange.length !== 2) {
        svg.selectAll("path")
            .attr("stroke-width", 2)
            .attr("opacity", 0.9)
            .attr("stroke", function () {
                return d3.select(this).attr("data-original-color") || "#ffffff";
            });
        return;
    }

    const rangeKey = `${selectedRange[0]}-${selectedRange[1]}`;

    // Reset all lines (except axes) to their original color and default style
    svg.selectAll("path")
        .attr("stroke-width", 2)
        .attr("opacity", 0.9)
        .attr("stroke", function () {
            // Restore the original stroke color from the data-original-color attribute
            return d3.select(this).attr("data-original-color") || "#ffffff";
        });

    // Highlight the selected range's line by matching the 'data-range' attribute
    const highlightedPath = svg.selectAll("path")
        .filter(function () {
            return d3.select(this).attr("data-range") === rangeKey;
        })
        .attr("stroke-width", 3)
        .attr("opacity", 1.0)
        .attr("stroke", "#ff0000");  // Apply the highlight color

    // Bring the selected path to the front
    highlightedPath.raise();
}