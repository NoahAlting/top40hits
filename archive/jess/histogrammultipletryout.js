// Genre keywords mapping
const yearRanges = window.selectedYearRanges || [[1970, 1980], [1990, 2000]];
const weekRange = window.selectedWeekRange || [1, 52];

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

let genres = Object.keys(genreKeywords);

// Load Data and Create Histogram
async function loadData_create_histogram() {
    try {
        // Load both datasets asynchronously
        const data_spotifySongs = await d3.csv("../../data/spotify_songs_with_ids.csv", d3.autoType);
        const data_top40 = await d3.csv("../../data/top40_with_ids.csv", d3.autoType);

        const genre = "pop"; // Replace with selected genre

        // Process data to generate histogram data
        const histogramData = loadAndProcess_HistogramData_byGenre(data_spotifySongs, data_top40, genre);

        if (yearRanges.length > 1) {
            createKDE(histogramData);
        } else {
            createHistogram(histogramData);
        }
    } catch (error) {
        console.error("Error loading or processing data:", error);
    }
}

// Process Data for Histogram
function loadAndProcess_HistogramData_byGenre(spotifySongs, top40, selectedGenre) {
    // Get the genre keywords for the selected genre
    const genreKeywordsList = genreKeywords[selectedGenre.toLowerCase()];

    // Step 1: Filter Spotify data based on the selected genre
    const filteredSpotifySongs = spotifySongs.filter((row) => {
        if (row.Artist_Genres && typeof row.Artist_Genres === "string") {
            return genreKeywordsList.some((keyword) => row.Artist_Genres.toLowerCase().includes(keyword));
        } else {
            return false;
        }
    });

    if (filteredSpotifySongs.length === 0) {
        console.warn(`No songs found for genre: ${selectedGenre}`);
        return [];
    }

    // Step 2: Merge filtered Spotify data with Top 40 data
    const mergedData = filteredSpotifySongs.map((spotifyRow) => {
        const top40Row = top40.find((song) => song.Song_ID === spotifyRow.Song_ID);

        if (!top40Row) {
            console.warn(`No matching top40 data found for Song_ID: ${spotifyRow.Song_ID}`);
            return null;
        }

        return {
            Song_ID: spotifyRow.Song_ID,
            Jaar: parseInt(top40Row.Jaar),
            Longevity: parseInt(top40Row.Aantal_weken),
            ...spotifyRow,
        };
    }).filter((row) => row !== null); // Remove any null entries

    // Step 3: Group by longevity (weeks) and count frequencies
    const longevityCounts = d3.rollup(
        mergedData,
        (songs) => songs.length,
        (song) => song.Longevity
    );

    // Step 4: Convert the Map into an array for plotting
    const histogramData = Array.from(longevityCounts, ([weeks, frequency]) => ({
        weeks: +weeks, // Ensure weeks is treated as a number
        frequency: +frequency, // Ensure frequency is treated as a number
    }));

    // Step 5: Sort data by longevity (weeks)
    histogramData.sort((a, b) => a.weeks - b.weeks);

    console.log("Processed histogram data:", histogramData);
    return histogramData;
}

// Create Histogram Visualization
function createHistogram(histogramData) {
    const svg_genrehis = d3.select("#longevity_histogram")
        .attr("width", 800)
        .attr("height", 400);

    const width = +svg_genrehis.attr("width");
    const height = +svg_genrehis.attr("height");
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    // Check if the SVG container has valid dimensions
    console.log("SVG Width:", width, "SVG Height:", height);

    // Clear previous content (if any)
    svg_genrehis.selectAll("*").remove();

    // Set up scales
    const x = d3.scaleBand()
        .domain(histogramData.map((d) => d.weeks))
        .range([margin.left, width - margin.right])
        .padding(0.1);

    console.log(x.domain)

    const y = d3.scaleLinear()
        .domain([0, d3.max(histogramData, (d) => d.frequency)]).nice()
        .range([height - margin.bottom, margin.top]);

    // Check if the data is being properly scaled
    console.log("X Domain:", x.domain(), "Y Domain:", y.domain());

    // Create axes
    svg_genrehis.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat((d) => `${d}`));

    svg_genrehis.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Draw bars
    svg_genrehis.selectAll(".bar")
        .data(histogramData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.weeks))
        .attr("y", (d) => y(d.frequency))
        .attr("width", x.bandwidth())
        .attr("height", (d) => y(0) - y(d.frequency))
        .attr("fill", "steelblue");

    // Add labels
    svg_genrehis.append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .text("Maximum Longevity (Weeks)");

    svg_genrehis.append("text")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Frequency");
}

// Create Genre Dropdown Menu
function createGenreMenu(genres) {
    const menuContainer = d3.select("#genre_menu");

    // Clear any existing menu
    menuContainer.selectAll("*").remove();

    // Add a dropdown menu
    const dropdown = menuContainer.append("select")
        .attr("id", "genre_dropdown")
        .on("change", function () {
            const selectedGenre = d3.select(this).property("value");
            console.log("Selected Genre:", selectedGenre);
            updateHistogram(selectedGenre);
        });

    // Populate dropdown options
    dropdown.selectAll("option")
        .data(genres)
        .enter()
        .append("option")
        .attr("value", (d) => d)
        .text((d) => d[0].toUpperCase() + d.slice(1)); // Capitalize the first letter
}

// Update Histogram when a Genre is Selected
async function updateHistogram(selectedGenre) {
    try {
        // Load data
        const data_spotifySongs = await d3.csv("../../data/spotify_songs_with_ids.csv", d3.autoType);
        const data_top40 = await d3.csv("../../data/top40_with_ids.csv", d3.autoType);

        // Process data for the selected genre
        const histogramData = loadAndProcess_HistogramData_byGenre(data_spotifySongs, data_top40, selectedGenre);

        // Check if histogramData is non-empty before rendering
        if (histogramData.length > 0) {
            createHistogram(histogramData);
        } else {
            console.error(`No data available for genre: ${selectedGenre}`);
        }
    } catch (error) {
        console.error("Error updating histogram:", error);
    }
}

// function to call the genre menu and load
(async function initialize() {
    createGenreMenu(genres);

    const defaultGenre = genres[0];
    await updateHistogram(defaultGenre);
})();

// Utility function for kernel density estimation
function kernelDensityEstimator(kernel, X) {
    return function (V) {
        return X.map((x) => [
            x,
            d3.mean(V, (v) => kernel(x - v)),
        ]);
    };
}

function kernelEpanechnikov(k) {
    return function (v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
}

// Filter Data Based on Year and Week Ranges
function filterDataByYearAndWeek(data, yearRanges, weekRange) {
    return data.filter((d) => {
        const yearInRange = yearRanges.some(
            ([start, end]) => d.Jaar >= start && d.Jaar <= end
        );
        const weekInRange = d.Longevity >= weekRange[0] && d.Longevity <= weekRange[1];
        return yearInRange && weekInRange;
    });
}

// Update Histogram or KDE based on Filters
async function updateVisualization(selectedGenre) {
    try {
        const data_spotifySongs = await d3.csv("../../data/spotify_songs_with_ids.csv", d3.autoType);
        const data_top40 = await d3.csv("../../data/top40_with_ids.csv", d3.autoType);


        // Process data for the selected genre
        let processedData = loadAndProcess_HistogramData_byGenre(data_spotifySongs, data_top40, selectedGenre);

        // Filter data based on year and week ranges
        processedData = filterDataByYearAndWeek(processedData, yearRanges, weekRange);

        // Check if multiple year ranges are selected
        if (yearRanges.length > 1) {
            createKDE(processedData);
        } else {
            createHistogram(processedData);
        }
    } catch (error) {
        console.error("Error updating visualization:", error);
    }
}

// Create KDE Plot
function createKDE(filteredData) {
    const svg = d3.select("#longevity_histogram")
        .attr("width", 800)
        .attr("height", 400);

    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    svg.selectAll("*").remove(); // Clear previous content

    // Set up scales
    const x = d3.scaleLinear()
        .domain(d3.extent(filteredData, (d) => d.Longevity))
        .range([margin.left, width - margin.right]);

    const kde = kernelDensityEstimator(
        kernelEpanechnikov(7),
        d3.range(x.domain()[0], x.domain()[1], 1)
    );

    const density = kde(filteredData.map((d) => d.Longevity));

    const y = d3.scaleLinear()
        .domain([0, d3.max(density, (d) => d[1])])
        .range([height - margin.bottom, margin.top]);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Add KDE line
    const line = d3.line()
        .curve(d3.curveBasis)
        .x((d) => x(d[0]))
        .y((d) => y(d[1]));

    svg.append("path")
        .datum(density)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);

    // Add labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 5)
        .attr("text-anchor", "middle")
        .text("Longevity (Weeks)");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", 15)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Density");
}

// Add Event Listeners for Filters
window.addEventListener("yearRangeUpdated", function () {
    const genre = d3.select("#genre_dropdown").property("value");
    updateVisualization(genre);
});

window.addEventListener("weekRangeUpdated", function () {
    const genre = d3.select("#genre_dropdown").property("value");
    updateVisualization(genre);
});

// Call Update on Genre Selection
d3.select("#genre_dropdown").on("change", function () {
    const genre = d3.select(this).property("value");
    updateVisualization(genre);
});

// Initialize with Default Values
(async function initialize() {
    createGenreMenu(genres);

    const defaultGenre = genres[0];
    await updateVisualization(defaultGenre);
})();


loadData_create_histogram();