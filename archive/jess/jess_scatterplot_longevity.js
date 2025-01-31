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

// Apply dynamic filters


function createVisualization(freqData, dynamicallyFilteredData, yearRanges, maxWeeks) {
    const svg = d3.select("#longevity_histogram").attr("width", width_scatterplot_container).attr("height", height_scatterplot_container);
    const width_longevityHistogram = +svg.attr("width");
    const height_longevityHistogram = +svg.attr("height");
    const margin_longevityHistogram = { top: height_scatterplot_container * 0.1, right: width_scatterplot_container * 0.1, bottom: height_scatterplot_container * 0.3, left: width_scatterplot_container * 0.1 };
    let groupedData = [];
    // Clear old plot lines and areas, but not the axes
    svg.selectAll(".line-path").transition().duration(500).style("opacity", 0).remove();  // Fade out old lines before removing
    svg.selectAll(".area").transition().duration(500).style("opacity", 0).remove();  // Fade out old areas before removing

    const x = d3.scaleBand()
        .domain(freqData.map((d) => d.weeks))
        .range([margin_longevityHistogram.left, width_longevityHistogram - margin_longevityHistogram.right])
        .padding(0.1);

    let yScale;
    if (yearRanges.length === 1) {
        yScale = d3.scaleLinear()
            .domain([0, d3.max(freqData, (d) => d.frequency)]).nice()
            .range([height_longevityHistogram - margin_longevityHistogram.bottom, margin_longevityHistogram.top]);
    } else {
        const maxNormalized = d3.max(freqData, (d) => d.frequency);
        yScale = d3.scaleLinear()
            .domain([0, Math.min(maxNormalized, 0.25)])
            .range([height_longevityHistogram - margin_longevityHistogram.bottom, margin_longevityHistogram.top]);
    }

    // Handle the X-axis transition
    let xAxisGroup = svg.select(".x-axis-group");
    if (xAxisGroup.empty()) {
        xAxisGroup = svg.append("g")
            .attr("class", "x-axis-group")
            .attr("transform", `translate(0,${height_longevityHistogram - margin_longevityHistogram.bottom})`)
            .call(d3.axisBottom(x).tickSize(-height_longevityHistogram + margin_longevityHistogram.top + margin_longevityHistogram.bottom));

        // Apply consistent styling for ticks
        xAxisGroup.selectAll(".tick line")
            .style("stroke", "#535067")
            .style("stroke-width", 0.6);
    } else {
        xAxisGroup.transition()
            .duration(1000)
            .ease(d3.easeCubicOut)
            .call(d3.axisBottom(x).tickSize(-height_longevityHistogram + margin_longevityHistogram.top + margin_longevityHistogram.bottom));

        // Apply consistent styling for ticks during transition
        xAxisGroup.selectAll(".tick line")
            .style("stroke", "#535067")
            .style("stroke-width", 0.6);
    }

    // Handle the Y-axis transition
    let yAxisGroup = svg.select(".y-axis-group");
    if (yAxisGroup.empty()) {
        yAxisGroup = svg.append("g")
            .attr("class", "y-axis-group")
            .attr("transform", `translate(${margin_longevityHistogram.left},0)`)
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-width_longevityHistogram + margin_longevityHistogram.left + margin_longevityHistogram.right));

        // Apply consistent styling for ticks
        yAxisGroup.selectAll(".tick line")
            .style("stroke", "#65627c")
            .style("stroke-width", 1.5);
    } else {
        yAxisGroup.transition()
            .duration(1000)
            .ease(d3.easeCubicOut)
            .call(d3.axisLeft(yScale).ticks(5).tickSize(-width_longevityHistogram + margin_longevityHistogram.left + margin_longevityHistogram.right));

        // Apply consistent styling for ticks during transition
        yAxisGroup.selectAll(".tick line")
            .style("stroke", "#65627c")
            .style("stroke-width", 1.5);
    }

    // Plotting based on year range count (other parts remain unchanged)
    if (yearRanges.length === 1) {
        singleLinePlot(svg, x, yScale, freqData, viridisScale(1));
    } else {
        groupedData = yearRanges.map(([start, end], index) => {
            const rangeKey = `${start}-${end}`;
            const filtered = dynamicallyFilteredData.filter(row => row.Jaar >= start && row.Jaar <= end);
            const uniqueSongsCount = new Set(filtered.map(row => row.Song_ID)).size;

            const groupedBySong = d3.group(filtered, (song) => song.Song_ID);
            const songLongevity = Array.from(groupedBySong, ([Song_ID, appearances]) => {
                const uniqueWeeks = new Set(appearances.map((entry) => entry.Weeknr));
                return {Song_ID, longevity: uniqueWeeks.size};
            });

            const longevityCounts = d3.rollup(
                songLongevity,
                (songs) => songs.length,
                (song) => song.longevity
            );

            const filledData = fillMissingWeeks(
                Array.from(longevityCounts, ([weeks, frequency]) => ({
                    weeks: +weeks,
                    frequency: frequency / uniqueSongsCount, // Normalize by the unique song count
                })).sort((a, b) => a.weeks - b.weeks),
                maxWeeks
            );

            return {
                range: rangeKey,
                data: smoothingEnabled ? smoothData(filledData) : filledData,
                color: viridisScale(index + 1),
            };
        });

        renderLinePlot(svg, x, yScale, groupedData, viridisScale, width_longevityHistogram, height_longevityHistogram, margin_longevityHistogram);
    }
}

// Render line plot with smooth transitions and consistent styles
function renderLinePlot(svg, x, yRight, groupedData, colorScale, width_longevityHistogram, height_longevityHistogram, margin_longevityHistogram) {
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
            .attr("opacity", 0)
            .attr("d", line)
            .attr("data-range", range)
            .attr("data-original-color", color)
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