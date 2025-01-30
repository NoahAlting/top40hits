// const genreKeywords = {
//     "pop": ["pop"],
//     "hip-hop": ["hip-hop", "rap"],
//     "rock": ["rock", "metal", "punk", "alternative"],
//     "edm": ["edm", "house", "techno", "trance", "dubstep", "drum and bass"],
//     "r&b": ["r&b", "rhythm and blues", "soul", "funk"],
//     "soul": ["soul", "motown"],
//     "country": ["country", "bluegrass", "folk"],
//     "latin": ["latin", "salsa", "reggaeton", "bossa nova"],
//     "jazz": ["jazz", "blues", "fusion"],
//     "classical": ["classical", "opera", "symphony"],
//     "reggae": ["reggae", "ska", "dancehall"]
// };
//
// // Global variables
// let genres = Object.keys(genreKeywords);
// let cachedGenreFilteredData = [];

// let activeYearRange = null;
//
// let cachedSpotifySongs = null;
// let cachedTop40Songs = null;

//
// async function filterByGenre(selectedGenre) {
//     // Ensure data is loaded and cached
//     await loadData();
//
//     const genreKeywordsList = genreKeywords[selectedGenre.toLowerCase()];
//
//     // Filter Spotify songs by genre keywords
//     const genreFilteredSongs = cachedSpotifySongs.filter((row) => {
//         if (row.Artist_Genres && typeof row.Artist_Genres === "string") {
//             return genreKeywordsList.some((keyword) => row.Artist_Genres.toLowerCase().includes(keyword));
//         }
//         return false;
//     });
//
//     // Map the filtered songs to individual appearances in the Top40 dataset
//     cachedGenreFilteredData = genreFilteredSongs.flatMap((spotifyRow) => {
//         // Find all appearances of this song in the Top40 dataset
//         const top40Entries = cachedTop40Songs.filter((song) => song.Song_ID === spotifyRow.Song_ID);
//
//         // Create individual entries for each appearance
//         return top40Entries.map((top40Row) => ({
//             Song_ID: spotifyRow.Song_ID,
//             Jaar: parseInt(top40Row.Jaar),
//             Weeknr: parseInt(top40Row.Weeknr),
//             Deze_week: parseInt(top40Row.Deze_week),
//             ...spotifyRow, // Include other Spotify song data
//         }));
//     });
//
//     console.log("Genre-filtered data cached:", cachedGenreFilteredData);
// }

let smoothingEnabled = false;

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
    function applyDynamicFilters(filtered_data) {
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


    createVisualization(finalData, filtered_data, yearRanges);
}

function createVisualization(freqData, dynamicallyFilteredData, yearRanges) {
    const svg = d3.select("#longevity_histogram").attr("width", 800).attr("height", 400);
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 20, right: 50, bottom: 40, left: 50 };

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

        renderLinePlot(svg, x, yRight, groupedData, colorScale, width, height, margin, yLeft);
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

    // // Create the line element
    // svg.append("path")
    //     .data([data])  // Pass the data as an array
    //     .attr("class", "line")
    //     .attr("d", line)  // Define the path using the line generator
    //     .attr("fill", "none")  // No fill for the line itself
    //     .attr("stroke", color)  // Set the line color
    //     .attr("stroke-width", 2);  // Set the line width

//     svg.selectAll(".point")
//         .data(data)
//         .enter().append("circle")
//         .attr("class", "point")
//         .attr("cx", d => x(d.weeks) + x.bandwidth() / 2)  // Set x position
//         .attr("cy", d => y(d.frequency))  // Set y position
//         .attr("r", 2)  // Set point radius
//         .attr("fill", color)
//         .attr("opacity", 0.8);
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

// Initialize
// (async function initialize() {
//     createSmoothingToggle();
//     applyDynamicFilters();
// })();