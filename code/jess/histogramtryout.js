const genreKeywords = {
    "pop": ["pop"],
    "hip-hop": ["hip-hop", "rap"],
    "rock": ["rock", "metal", "punk", "alternative"],
    "edm": ["edm", "house", "techno", "trance", "dubstep", "drum and bass"],
    "r&b": ["r&b", "rhythm and blues", "soul", "funk"],
    "soul": ["soul", "motown"],
    "country": ["country", "bluegrass", "folk"],
    "latin": ["latin", "salsa", "reggaeton", "bossa nova"],
    "jazz": ["jazz", "blues", "fusion"],
    "classical": ["classical", "opera", "symphony"],
    "reggae": ["reggae", "ska", "dancehall"]
};

// Global variables
let genres = Object.keys(genreKeywords);
let cachedGenreFilteredData = [];
let smoothingEnabled = false;
let activeYearRange = null;

async function filterByGenre(selectedGenre) {
    const data_spotifySongs = await d3.csv("../../data/spotify_songs_with_ids.csv", d3.autoType);
    const data_top40 = await d3.csv("../../data/top40_with_ids.csv", d3.autoType);

    const genreKeywordsList = genreKeywords[selectedGenre.toLowerCase()];

    cachedGenreFilteredData = data_spotifySongs.filter((row) => {
        if (row.Artist_Genres && typeof row.Artist_Genres === "string") {
            return genreKeywordsList.some((keyword) => row.Artist_Genres.toLowerCase().includes(keyword));
        }
        return false;
    }).map((spotifyRow) => {
        const top40Row = data_top40.find((song) => song.Song_ID === spotifyRow.Song_ID);

        if (!top40Row) return null;

        return {
            Song_ID: spotifyRow.Song_ID,
            Jaar: parseInt(top40Row.Jaar),
            Weeknr: parseInt(top40Row.Weeknr),
            Longevity: parseInt(top40Row.Aantal_weken),
            Deze_week: parseInt(top40Row.Deze_week),
            ...spotifyRow,
        };
    }).filter((row) => row !== null);

    console.log("Genre-filtered data cached:", cachedGenreFilteredData);
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
function applyDynamicFilters() {
    const yearRanges = window.selectedYearRanges.sort((a, b) => a[0] - b[0]);
    const weekRange = window.selectedWeekRange;
    const selectedTop = window.selectedTop;

    const dynamicallyFilteredData = cachedGenreFilteredData.filter((row) => {
        const inYearRange = yearRanges.some(([start, end]) => row.Jaar >= start && row.Jaar <= end);
        const inWeekRange = row.Weeknr >= weekRange[0] && row.Weeknr <= weekRange[1];
        const inTopSelection = row.Deze_week <= selectedTop;

        return inYearRange && inWeekRange && inTopSelection;
    });

    console.log("Dynamically filtered data:", dynamicallyFilteredData);

    const histogramData = d3.rollup(
        dynamicallyFilteredData,
        (songs) => songs.length,
        (song) => song.Longevity
    );

    const formattedData = fillMissingWeeks(
        Array.from(histogramData, ([weeks, frequency]) => ({
            weeks: +weeks,
            frequency: +frequency,
        })).sort((a, b) => a.weeks - b.weeks)
    );

    createVisualization(formattedData, dynamicallyFilteredData, yearRanges);
}

// Create combined visualization
function createVisualization(histogramData, dynamicallyFilteredData, yearRanges) {
    const svg = d3.select("#longevity_histogram").attr("width", 800).attr("height", 400);
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 20, right: 50, bottom: 40, left: 50 };

    svg.selectAll("*").remove();

    const x = d3.scaleBand()
        .domain(histogramData.map((d) => d.weeks))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    const yLeft = d3.scaleLinear()
        .domain([0, d3.max(histogramData, (d) => d.frequency)]).nice()
        .range([height - margin.bottom, margin.top]);

    const yRight = d3.scaleLinear()
        .domain([0, 1])
        .range([height - margin.bottom, margin.top]);

    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x));
    svg.append("g").attr("transform", `translate(${margin.left},0)`).call(d3.axisLeft(yLeft));
    svg.append("g").attr("transform", `translate(${width - margin.right},0)`).call(d3.axisRight(yRight));

    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 4]);

    // If only one year range is selected, show the histogram directly
    if (yearRanges.length === 1) {
        renderHistogram(svg, x, yLeft, histogramData, "lightgrey");
    }
    else {
    // Group data for multiple year ranges
    const groupedData = yearRanges.map(([start, end], index) => {
        const rangeKey = `${start}-${end}`;
        const filtered = dynamicallyFilteredData.filter(row => row.Jaar >= start && row.Jaar <= end);

        const longevityCounts = d3.rollup(
            filtered,
            (songs) => songs.length,
            (song) => song.Longevity
        );

        const filledData = fillMissingWeeks(
            Array.from(longevityCounts, ([weeks, frequency]) => ({
                weeks: +weeks,
                frequency: frequency / filtered.length // Normalize
            })).sort((a, b) => a.weeks - b.weeks)
        );

        return {
            range: rangeKey,
            data: smoothingEnabled ? smoothData(filledData) : filledData,
            color: colorScale(index)
        };
    });

    renderLinePlot(svg, x, yRight, groupedData, colorScale, width, height, margin, yLeft, dynamicallyFilteredData);
    }
}


// Render line plot for normalized data
function renderLinePlot(svg, x, yRight, groupedData, width, height, margin, yLeft, dynamicallyFilteredData) {
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
                // Filter the data corresponding to the clicked year range
                const rangeParts = range.split('-');
                const startYear = +rangeParts[0];
                const endYear = +rangeParts[1];

                // Filter the dynamically filtered data based on the selected range
                const filteredDataForRange = dynamicallyFilteredData.filter((row) => {
                    return row.Jaar >= startYear && row.Jaar <= endYear;
                });

                // Create histogram data for the selected range
                const histogramDataForRange = d3.rollup(
                    filteredDataForRange,
                    (songs) => songs.length,
                    (song) => song.Longevity
                );

                // Format the histogram data
                const formattedData = fillMissingWeeks(
                    Array.from(histogramDataForRange, ([weeks, frequency]) => ({
                        weeks: +weeks,
                        frequency: +frequency,
                    })).sort((a, b) => a.weeks - b.weeks)
                );

                renderHistogram(svg, x, yLeft, formattedData, colorScale(range), true);
            });
    });

}

// Render bar plot
function renderHistogram(svg, x, y, data, color,  isFromLinePlot = false) {
    svg.selectAll(".bar").remove();
    svg.selectAll(".bar").data(data).enter().append("rect")
        .attr("x", d => x(d.weeks))
        .attr("y", d => y(d.frequency))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.frequency))
        .attr("fill", color)
        .attr("opacity", function() {
            if (isFromLinePlot) {
                return 0.2
            }
            return 1;
        })
        .attr("class", "bar");
}

// Create genre dropdown menu
function createGenreMenu(genres) {
    const menuContainer = d3.select("#genre_menu");
    menuContainer.selectAll("*").remove();

    const dropdown = menuContainer.append("select")
        .attr("id", "genre_dropdown")
        .on("change", async function () {
            const selectedGenre = d3.select(this).property("value");
            window.selectedGenre = selectedGenre;
            await filterByGenre(selectedGenre);
            applyDynamicFilters();
        });

    dropdown.selectAll("option").data(genres).enter().append("option")
        .attr("value", (d) => d)
        .text((d) => d[0].toUpperCase() + d.slice(1));
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

// Event listeners
window.addEventListener('yearRangeUpdated', applyDynamicFilters);
window.addEventListener('weekRangeUpdated', applyDynamicFilters);
window.addEventListener('topUpdated', applyDynamicFilters);

// Initialize
(async function initialize() {
    createGenreMenu(genres);
    createSmoothingToggle();
    const defaultGenre = genres[0];
    await filterByGenre(defaultGenre);
    applyDynamicFilters();
})();