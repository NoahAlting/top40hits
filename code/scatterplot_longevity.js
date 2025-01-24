
function hideAllElements() {
    const elementsToHide = document.querySelectorAll('#barchart, #scatterplot, #feature-selector, #tooltip, #prev, #next, #year-range-display, #clip, #h1');
    elementsToHide.forEach(element => {
        element.style.display = 'none';
    });
}

function updateLongevityChartContent() {
    const selectedFeatureElement = document.getElementById('selected_feature_long');
    const selectedGenreElement = document.getElementById('selected_genre_long');

    if (window.selectedType === 'features') {
        selectedFeatureElement.style.display = 'block';
        selectedGenreElement.style.display = 'none';

        let headerElement = document.getElementById('longevityHeader_2');
        if (!headerElement) {
            headerElement = document.createElement("h1");
            headerElement.id = "longevityHeader_2";
            headerElement.textContent = "Longevity vs Features";
            const longevityChartsContainer = document.getElementById("longevityCharts");
            longevityChartsContainer.insertBefore(headerElement, longevityChartsContainer.firstChild);
        }

        const elementsToHide = document.querySelectorAll('#barchart, #scatterplot, #feature-selector, #tooltip, #prev, #next, #year-range-display, #clip');
        elementsToHide.forEach(element => {
            element.style.display = 'block';
        });

    } else if (window.selectedType === 'genres') {
        selectedFeatureElement.style.display = 'none';
        selectedGenreElement.style.display = 'block';
        hideAllElements();

        const headerElement = document.getElementById('longevityHeader_2');
        if (headerElement) {
            headerElement.remove();
        }
    }
}

const header = document.createElement("h1");
header.textContent = "Longevity vs Features";
header.id = "longevityHeader_2";  
const longevityChartsContainer = document.getElementById("longevityCharts");
longevityChartsContainer.insertBefore(header, longevityChartsContainer.firstChild);

const allWeeks = [];

const week_ranges = window.selectedWeekRange;

function loadAndProcess_FeaturesData_scat(filtered_data_input, range_years, selectedGenre, possible_features_songs) {
    const plotData = [];

    const filteredData = filtered_data_input
        .filter(row => +row.Jaar >= range_years[0] && +row.Jaar <= range_years[1]);

    const songMap = new Map();

    filteredData.forEach(row => {
        const songId = row.Song_ID;
        const currentLongevity = +row.Aantal_weken;

        // Keep the song with the highest longevity
        if (!songMap.has(songId) || songMap.get(songId).Longevity < currentLongevity) {
            songMap.set(songId, {
                Song_ID: songId,
                Longevity: currentLongevity,
                Aantal_weken: +row.Aantal_weken,
                Artist: row.Artist,
                Title: row.Titel,
                Danceability: row.Danceability,
                Liveness: row.Liveness,
                Speechiness: row.Speechiness,
                Acousticness: row.Acousticness,
                Energy: row.Energy,
                Valence: row.Valence,
            });
        }
    });

    songMap.forEach((song, songId) => {
        plotData.push({
            Song_ID: song.Song_ID,
            Artist: song.Artist,
            Title: song.Title,
            Longevity: song.Longevity,
            Danceability: song.Danceability,
            Liveness: song.Liveness,
            Speechiness: song.Speechiness,
            Acousticness: song.Acousticness,
            Energy: song.Energy,
            Valence: song.Valence,
        });
    });

    return plotData;
}

    function showBarChart(year_range, colour, song, selectedFeature) {
        const barChart = d3
    .select("#barchart")
    .append("svg")
    .attr("width", width_scatterplot)
    .attr("height", height_scatterplot);

        var width_scatterplot_container = document.getElementById("longevityCharts").clientWidth;
        var height_scatterplot_container = document.getElementById("longevityCharts").clientHeight;
        var margin_scatterplot = {
            top: height_scatterplot_container * 0.1,
            right: width_scatterplot_container * 0.1,
            bottom: height_scatterplot_container * 0.3,
            left: width_scatterplot_container * 0.2
        };
        var width_scatterplot = width_scatterplot_container - margin_scatterplot.left - margin_scatterplot.right;
        var height_scatterplot = height_scatterplot_container - margin_scatterplot.top - margin_scatterplot.bottom;

        

        const selectedFeatures = ['Danceability', 'Acousticness', 'Energy', 'Liveness', 'Valence', 'Speechiness'];
        const featureData = selectedFeatures
            .map(feature => ({ feature, value: song[feature] }))
            .filter(d => d.value != null && d.value != undefined);
    
        const xScale = d3.scaleBand()
            .domain(featureData.map(d => d.feature))
            .range([margin_scatterplot.left, width_scatterplot - margin_scatterplot.right])
            .padding(0.1);
    
        const increasedHeight = height_scatterplot * 1.5;
    
        const yScale = d3.scaleLinear()
            .domain([0, 1])
            .range([increasedHeight - margin_scatterplot.bottom, margin_scatterplot.top]);
    
        barChart.selectAll("*").remove();
    
        const chartGroup = barChart.append("g")
            .attr("transform", "translate(0, -50)"); 
    
        chartGroup.append("g")
            .attr("transform", `translate(0, ${increasedHeight - margin_scatterplot.bottom})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    
        chartGroup.append("g")
            .attr("transform", `translate(${margin_scatterplot.left}, 0)`)
            .call(d3.axisLeft(yScale));
    
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
var height_scatterplot_container = document.getElementById("longevityCharts").clientHeight;
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
        .attr("height", height_scatterplot + margin_scatterplot.top + margin_scatterplot.bottom)
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
            d3.select(event.target).attr("r", 8);
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
    const yearRangeText = `${currentYearRange[0]} - ${currentYearRange[1]}`;
    const yearRangeColor = get_color_yearRange(currentYearRange, selectedYearRanges_scat);
    const data = loadAndProcess_FeaturesData_scat(filtered_data_input, currentYearRange, selectedGenre_scat, possible_features_songs, selectedYearRanges_scat);

    d3.select("#year-range-display")
        .text(`Year Range: ${yearRangeText}`)
        .style("background-color", yearRangeColor)
    d3.select("#scatterplot").html("");
    createInteractiveGraph_Features_scat("#scatterplot", data, possible_features_songs, selected_genre, currentYearRange, yearRangeColor);

}

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
    console.log('render genre plot', filtered_data)

    const genreData = filtered_data[selectedType] || [];

    console.log(genreData)
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

    const frequencyData = fillMissingWeeks(
        Array.from(longevityCounts, ([weeks, frequency]) => ({
            weeks: +weeks,
            frequency: +frequency,
        })).sort((a, b) => a.weeks - b.weeks)
    );


    const finalData = smoothingEnabled ? smoothData(frequencyData) : frequencyData;


    createVisualization(finalData, genreData, yearRanges);
}

function fillMissingWeeks(data, maxWeeks = 20) {
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

// Apply dynamic filters

function createVisualization(freqData, dynamicallyFilteredData, yearRanges) {
    const svg = d3.select("#longevity_histogram").attr("width", width_scatterplot_container).attr("height", height_scatterplot_container);
    const width_longevityHistogram = +svg.attr("width");
    const height_longevityHistogram = +svg.attr("height");
    const margin_longevityHistogram = { top: height_scatterplot_container*0.1, right: width_scatterplot_container*0.1, bottom: height_scatterplot_container*0.3, left: width_scatterplot_container*0.1 };

    svg.selectAll("*").remove();

    const x = d3.scaleBand()
        .domain(freqData.map((d) => d.weeks))
        .range([margin_longevityHistogram.left, width_longevityHistogram - margin_longevityHistogram.right])
        .padding(0.1);

    const yLeft = d3.scaleLinear()
        .domain([0, d3.max(freqData, (d) => d.frequency)]).nice()
        .range([height_longevityHistogram - margin_longevityHistogram.bottom, margin_longevityHistogram.top]);

    const yRight = d3.scaleLinear()
        .domain([0, 1])
        .range([height_longevityHistogram - margin_longevityHistogram.bottom, margin_longevityHistogram.top]);

    svg.append("g").attr("transform", `translate(0,${height_longevityHistogram - margin_longevityHistogram.bottom})`).call(d3.axisBottom(x));
    svg.append("g").attr("transform", `translate(${margin_longevityHistogram.left},0)`).call(d3.axisLeft(yLeft));
    svg.append("g").attr("transform", `translate(${width_longevityHistogram - margin_longevityHistogram.right},0)`).call(d3.axisRight(yRight));

    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, yearRanges.length]);

    if (yearRanges.length === 1) {
        singleLinePlot(svg, x, yLeft, freqData, colorScale(0));
    } else {
        const groupedData = yearRanges.map(([start, end], index) => {
            const rangeKey = `${start}-${end}`;
            const filtered = dynamicallyFilteredData.filter(row => row.Jaar >= start && row.Jaar <= end);

            // Get the count of unique songs in the filtered data
            const uniqueSongsCount = new Set(filtered.map(row => row.Song_ID)).size;

            // Group by Song_ID and calculate longevity (number of unique weeks)
            const groupedBySong = d3.group(filtered, (song) => song.Song_ID);
            const songLongevity = Array.from(groupedBySong, ([Song_ID, appearances]) => {
                const uniqueWeeks = new Set(appearances.map((entry) => entry.Weeknr));
                return { Song_ID, longevity: uniqueWeeks.size };
            });

            // Count the frequency of each longevity value
            const longevityCounts = d3.rollup(
                songLongevity,
                (songs) => songs.length,
                (song) => song.longevity
            );

            // Normalize by the unique song count in the filtered data
            const filledData = fillMissingWeeks(
                Array.from(longevityCounts, ([weeks, frequency]) => ({
                    weeks: +weeks,
                    frequency: frequency / uniqueSongsCount, // Normalize by the unique song count
                })).sort((a, b) => a.weeks - b.weeks)
            );

            return {
                range: rangeKey,
                data: smoothingEnabled ? smoothData(filledData) : filledData,
                color: colorScale(index),
            };
        });

        renderLinePlot(svg, x, yRight, groupedData, colorScale, width_longevityHistogram, height_longevityHistogram, margin_longevityHistogram, yLeft);
    }
}


// Render line plot for normalized data
function renderLinePlot(svg, x, yRight, groupedData, width_longevityHistogram, height_longevityHistogram, margin_longevityHistogram, yLeft, dynamicallyFilteredData) {
    const line = d3.line()
        .x(d => x(d.weeks) + x.bandwidth() / 2)
        .y(d => yRight(d.frequency)); // Use the right y-axis for normalized values

    groupedData.forEach(({ range, data, color }, index) => {
        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("d", line)
            .on("click", function () {
            });
    });

}

// Render bar plot
function singleLinePlot(svg, x, y, data, color) {
    // svg.selectAll(".line").remove();
    svg.selectAll(".area").remove();
    svg.selectAll(".point").remove();

    // Define the line generator function
    const line = d3.line()
        .x(d => x(d.weeks))  // Mapping x axis data
        .y(d => y(d.frequency));  // Mapping y axis data

    // Define the area generator function
    const area = d3.area()
        .x(d => x(d.weeks) + x.bandwidth() / 2)  // Mapping x axis data
        .y0(y(0))  // The bottom of the area (on the x-axis)
        .y1(d => y(d.frequency));  // The top of the area (based on the frequency)

    // Append the area element (filled beneath the line)
    svg.append("path")
        .data([data])  // Pass the data as an array
        .attr("class", "area")
        .attr("d", area)  // Define the area using the area generator
        .attr("fill", color)  // Set the area fill color
        .attr("fill-opacity", 0.8);  // Set the opacity to 40%
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
