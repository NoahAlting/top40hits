function updateLongevityChartContent() {
    const selectedFeatureElement = document.getElementById('selected_feature_long');
    const selectedGenreElement = document.getElementById('selected_genre_long');

    // Check the selectedType and show the appropriate element
    if (window.selectedType === 'features') {
        selectedFeatureElement.style.display = 'block';
        selectedGenreElement.style.display = 'none';
    } else if (window.selectedType === 'genres') {
        selectedFeatureElement.style.display = 'none';
        selectedGenreElement.style.display = 'block';
    }
}
const margin = {top: 20, right: 20, bottom: 50, left: 50};
const width = 800 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const week_ranges = window.selectedWeekRange;

const allWeeks = [];

function renderFeaturePlot() {

// all weeks
    week_ranges.forEach(range => {
        for (let i = range[0]; i <= range[1]; i++) {
            if (!allWeeks.includes(i)) {
                allWeeks.push(i);
            }
        }
    });

    last = allWeeks[allWeeks.length - 1];

    let current_year_index = 0;

    const barChart = d3
        .select("#barchart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);


    Promise.all([
        d3.csv("../data/spotify_songs.csv", d3.autoType),
        d3.tsv("../data/top40-noteringen.csv", d3.autoType)
    ]).then(([spotifyData, top40Data]) => {
        let mergedData = top40Data.map(song => {
            const spotifyMatch = spotifyData.find(
                spotify =>
                    spotify.Title === song.Titel &&
                    spotify.Artist === song.Artiest
            );
            return {
                // return the song
                ...song,
                ...spotifyMatch,
                // and properties from the top 40
                Longevity: song.Aantal_weken,
                Jaar: song.Jaar
            };
        });

        // get the maximum longevity per song
        const maxLongevity = Array.from(
            // group by unique song (title + artist)
            d3.group(mergedData, d => `${d.Titel}_${d.Artiest}`),
            ([key, group]) => {
                const maxLong = group.reduce((max, song) =>
                    song.Longevity > max.Longevity ? song : max
                );
                return maxLong;
            }
        );

        // filter out features that dont have numerical data
        const features = Object.keys(spotifyData[0]).filter(
            key => typeof spotifyData[0][key] === "number"
        );


        // set the range of longevity to its max
        const longevityRange = [0, d3.max(maxLongevity, d => d.Longevity)];
        // range for features is the max of the songs of that feature, or 0
        const featureRanges = features.reduce((acc, feature) => {
            acc[feature] = [
                0,
                d3.max(maxLongevity, d => (d[feature] ? d[feature] : 0))
            ];
            return acc;
        }, {});

        dropdown_features = ['Danceability', 'Acousticness', 'Energy', 'Liveness', 'Valence', 'Speechiness'];

        // menu
        const dropdown = d3
            .select("#feature-selector")
            .append("select");


        dropdown
            .selectAll("option")
            .data(dropdown_features)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        function showBarChart(song, selectedFeature) {
            // Only show these features (they are within 0-1 range)
            const selectedFeatures = ['Danceability', 'Acousticness', 'Energy', 'Liveness', 'Valence', 'Speechiness'];
            const featureData = selectedFeatures
                .map(feature => ({feature, value: song[feature]}))
                .filter(d => d.value != null && d.value != undefined);

            // Update the chart
            const xScale = d3.scaleBand()
                .domain(featureData.map(d => d.feature))
                .range([margin.left, width - margin.right])
                .padding(0.1);

            const yScale = d3.scaleLinear()
                .domain([0, 1])
                .range([height - margin.bottom, margin.top]);

            barChart.selectAll("*").remove();

            barChart.append("g")
                .attr("transform", `translate(0, ${height - margin.bottom})`)
                .call(d3.axisBottom(xScale))
                .selectAll("text")
                .attr("transform", "rotate(-45)")
                .style("text-anchor", "end");

            barChart.append("g")
                .attr("transform", `translate(${margin.left}, 0)`)
                .call(d3.axisLeft(yScale));

            // Add bars for the selected song
            barChart.selectAll("rect")
                .data(featureData)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.feature))
                .attr("y", yScale(0))  // Start from 0 for animation
                .attr("width", xScale.bandwidth())
                .attr("height", 0)  // Start with 0 height for animation
                .attr("fill", d => d.feature === selectedFeature ? "steelblue" : "darkgrey")
                .transition()
                .duration(500)
                .attr("y", d => yScale(d.value))
                .attr("height", d => height - margin.bottom - yScale(d.value));
        }


        function showScatterplot(feature, year_range, week_range) {
            console.log("showScatterplot", feature, year_range, week_range);
            var filteredSongs = maxLongevity.filter(d =>
                d.Jaar >= year_range[0] &&
                d.Jaar <= year_range[1] &&
                d[feature] !== null &&
                d[feature] !== undefined &&
                d.Weeknr >= week_range[0] &&
                d.Weeknr <= week_range[1]
            );

            d3.select("#scatterplot").html("");

            const svg = d3
                .select("#scatterplot")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);


            const xScale = d3.scaleLinear().domain(longevityRange).range([margin.left, width - margin.right]);
            const yScale = d3.scaleLinear().domain([0, 1]).range([height, 0]);

            const xAxis = d3.axisBottom(xScale)
                .ticks(null)
                .tickFormat(d => (d % 1 === 0 ? d : ''));
            const yAxis = d3.axisLeft(yScale);


            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height})`)
                .call(xAxis);

            svg.append("g")
                .attr("class", "y-axis")
                .call(yAxis);


            const contours = d3.contourDensity()
                .x(d => xScale(d.Longevity))
                .y(d => yScale(d[feature]))
                .size([width, height])
                .bandwidth(30)
                .thresholds(12)
                (filteredSongs);


            svg.append("g")
                .attr("fill", "steelblue")
                .attr("fill-opacity", 0.3)
                .attr("stroke", "steelblue")
                .attr("stroke-linejoin", "round")
                .selectAll("path")
                .data(contours)
                .join("path")
                .attr("class", "contour-path")
                .attr("stroke-width", (d, i) => i % 5 ? 0.25 : 1)
                .attr("d", d3.geoPath());


// Clip path so that the labels don't go outside the plot
            const dotGroup = svg.append("g")
                .attr("clip-path", "url(#clip)");


            const dots = dotGroup
                .selectAll(".dot-scatter")
                .data(filteredSongs)
                .enter()
                .append("circle")
                .attr("class", "dot-scatter")
                .attr("cx", d => xScale(d.Longevity))
                .attr("cy", d => yScale(d[feature]))
                .attr("r", 8)
                .attr("opacity", 0)
                .style("fill", "steelblue")
                .on("click", (event, d) => {
                    const dot = d3.select(event.target);

                    // Animate the dot to drop to the x-axis
                    dot.transition()
                        .duration(500)
                        .attr("cy", height) // Move the dot to the x-axis position
                        .attr("opacity", 1)
                        .on("end", function () {
                            dot.attr("opacity", 0);
                            // Once the dot reaches the x-axis, trigger the bar chart
                            showBarChart(d, feature);

                        });
                })
                .on("mouseover", (event, d) => {
                    d3.select(event.target)
                        .attr("r", 10)
                        .transition()
                        .duration(200);
                })
                .on("mouseout", (event, d) => {
                    if (!d3.select(event.target).classed("selected")) {
                        d3.select(event.target).attr("r", 8);
                    }
                });

            const labels = dotGroup
                .selectAll(".label")
                .data(filteredSongs)
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("x", d => xScale(d.Longevity))
                .attr("y", d => yScale(d[feature]))
                .attr("dy", "-1em")
                .attr("text-anchor", "middle")
                .attr("opacity", 0)
                .style("font-size", "12px")
                .style("clip-path", "url(#clip)")
                .text(d => `${d.Artist}: ${d.Title}`)

            const background = svg.append("rect")
                .attr("width", width)
                .attr("height", height)
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
                .on("zoom", (event) => {
                    const newXScale = event.transform.rescaleX(xScale).clamp(true);
                    const newYScale = event.transform.rescaleY(yScale).clamp(true);

                    const xDomain = newXScale.domain().map(d => Math.max(d, 0));
                    newXScale.domain(xDomain);

                    svg.select(".x-axis").call(xAxis.scale(newXScale));
                    svg.select(".y-axis").call(yAxis.scale(newYScale));

                    // only allow zooming on the dots & labels if there are less than 1000 songs
                    if (filteredSongs.length < 5000) {
                        dots
                            .attr("cx", d => newXScale(d.Longevity))
                            .attr("cy", d => newYScale(d[feature]))
                            .attr("r", d => Math.max(10 - event.transform.k, 8))
                            .attr("opacity", d => Math.min(1, (event.transform.k - 1) / 5))
                            .attr("visibility", d => {
                                return (d.Longevity >= newXScale.domain()[0] && d.Longevity <= newXScale.domain()[1] &&
                                    d[feature] >= newYScale.domain()[0] && d[feature] <= newYScale.domain()[1])
                                    ? "visible" : "hidden";
                            });
                    }

                    if (filteredSongs.length < 5000) {
                        labels
                            .attr("x", d => newXScale(d.Longevity))
                            .attr("y", d => newYScale(d[feature]) - 6 / event.transform.k)
                            .attr("opacity", d => {
                                const inBounds =
                                    d.Longevity >= newXScale.domain()[0] &&
                                    d.Longevity <= newXScale.domain()[1] &&
                                    d[feature] >= newYScale.domain()[0] &&
                                    d[feature] <= newYScale.domain()[1];
                                return inBounds && event.transform.k > 6 ? 1 : 0;
                            });
                    }

                    svg.selectAll(".contour-path")
                        .attr("transform", event.transform.toString())
                        .attr("fill-opacity", 0.3 / event.transform.k);
                });


            background.call(zoom);
            svg.call(zoom);
        }


        function updatePlot() {
            // const selectedFeature = window.selectedType;
            const selectedFeature = dropdown.node().value;
            const selectedYearRange = window.selectedYearRanges;
            const selectedWeekRange = window.selectedWeekRange;
            const selectedTop = window.selectedTop;
            console.log("updatePlot", selectedFeature, selectedYearRange, selectedWeekRange);


            const yearRange = selectedYearRange[current_year_index];
            showScatterplot(selectedFeature, yearRange, selectedWeekRange);
            const yearRangeText = `${yearRange[0]} - ${yearRange[1]}`;
            d3.select("#year-range-display").text(`Year Range: ${yearRangeText}`);
        }

        function nextYearRange(selectedYearRange) {
            console.log("nextYearRange", selectedYearRange);
            current_year_index = (current_year_index + 1) % selectedYearRange.length;
            updatePlot();
        }

        function prevYearRange(selectedYearRange) {
            current_year_index = (current_year_index - 1 + selectedYearRange.length) % selectedYearRange.length;
            updatePlot();
        }

        // Pass the selectedYearRange when attaching event handlers
        d3.select("#next").on("click", () => nextYearRange(window.selectedYearRanges));
        d3.select("#prev").on("click", () => prevYearRange(window.selectedYearRanges));

        updatePlot();

        dropdown.on("change", updatePlot);

        window.addEventListener('yearRangeUpdated', function () {
            updatePlot();
        });

        window.addEventListener('weekRangeUpdated', function () {
            updatePlot();
        });

        window.addEventListener('typeUpdated', function () {
            updatePlot();
        });

        window.addEventListener('topUpdated', function () {
            updatePlot();
        });

    });
}

// =========================================== Genre Selected ========================================================
let smoothingEnabled = false;

function renderGenrePlot(filtered_data) {
    console.log(filtered_data)
    const yearRanges = window.selectedYearRanges.sort((a, b) => a[0] - b[0]);

    // Calculate longevity (number of unique weeks) for each song
    const groupedBySong = d3.group(filtered_data, (song) => song.Song_ID);

    const songLongevity = Array.from(groupedBySong, ([Song_ID, appearances]) => {
        const uniqueWeeks = new Set(appearances.map((entry) => entry.Weeknr));
        return {
            Song_ID,
            longevity: uniqueWeeks.size,
        };
    });

    console.log("Song longevity (dynamically calculated):", songLongevity);

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

    console.log("frequency data:", frequencyData);

    const finalData = smoothingEnabled ? smoothData(frequencyData) : frequencyData;


    createVisualization(finalData, filtered_data, yearRanges);
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
        return {...d, frequency: average};
    });
}

// Apply dynamic filters

function createVisualization(freqData, dynamicallyFilteredData, yearRanges) {
    const svg = d3.select("#longevity_histogram").attr("width", 800).attr("height", 400);
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = {top: 20, right: 50, bottom: 40, left: 50};

    svg.selectAll("*").remove();

    const x = d3.scaleBand()
        .domain(freqData.map((d) => d.weeks))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const yLeft = d3.scaleLinear()
        .domain([0, d3.max(freqData, (d) => d.frequency)]).nice()
        .range([height - margin.bottom, margin.top]);

    const yRight = d3.scaleLinear()
        .domain([0, 1])
        .range([height - margin.bottom, margin.top]);

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yLeft));
    svg.append("g").attr("transform", `translate(${width - margin.right},0)`).call(d3.axisRight(yRight));

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
                return {Song_ID, longevity: uniqueWeeks.size};
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

        renderLinePlot(svg, x, yRight, groupedData, colorScale, width, height, margin, yLeft);
    }
}


// Render line plot for normalized data
function renderLinePlot(svg, x, yRight, groupedData, width, height, margin, yLeft, dynamicallyFilteredData) {
    const line = d3.line()
        .x(d => x(d.weeks) + x.bandwidth() / 2)
        .y(d => yRight(d.frequency)); // Use the right y-axis for normalized values

    groupedData.forEach(({range, data, color}, index) => {
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
