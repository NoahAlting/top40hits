// Genre keywords mapping
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

        // Check if histogramData is non-empty before proceeding
        if (histogramData.length > 0) {
            console.log("Histogram data loaded:", histogramData);  // Log data for debugging
            createHistogram(histogramData);
        } else {
            console.error("No data available to create a histogram.");
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
            console.warn(`No valid Artist_Genres for Song_ID: ${row.Song_ID}`);
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

    const y = d3.scaleLinear()
        .domain([0, d3.max(histogramData, (d) => d.frequency)]).nice()
        .range([height - margin.bottom, margin.top]);

    // Check if the data is being properly scaled
    console.log("X Domain:", x.domain(), "Y Domain:", y.domain());

    // Create axes
    svg_genrehis.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat((d) => `${d} weeks`));

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

// Execute the Function
loadData_create_histogram();