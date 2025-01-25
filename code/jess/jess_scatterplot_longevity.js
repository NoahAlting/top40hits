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

    if (yearRanges.length === 1) {
        singleLinePlot(svg, x, yLeft, freqData, viridisScale(1));
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
                color: viridisScale(index + 1),
            };
        });

        renderLinePlot(svg, x, yRight, groupedData, viridisScale, width_longevityHistogram, height_longevityHistogram, margin_longevityHistogram, yLeft);
    }
}


// Render line plot for normalized data
function renderLinePlot(svg, x, yRight, groupedData, colorScale, width_longevityHistogram, height_longevityHistogram, margin_longevityHistogram, yLeft) {
    const line = d3.line()
        .x(d => x(d.weeks) + x.bandwidth() / 2)
        .y(d => yRight(d.frequency));

    groupedData.forEach(({ range, data, color }, index) => {
        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("opacity", 0.9)
            .attr("d", line)
            .attr("data-range", range)
            .attr("data-original-color", color);
    });
}

// Render bar plot
function singleLinePlot(svg, x, y, data, color) {
    svg.selectAll(".area").remove();
    svg.selectAll(".point").remove();

    const area = d3.area()
        .x(d => x(d.weeks) + x.bandwidth() / 2)
        .y0(y(0))
        .y1(d => y(d.frequency));

    svg.append("path")
        .data([data])
        .attr("class", "area")
        .attr("d", area)
        .attr("fill", color)
        .attr("fill-opacity", 0.8);
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