// Define a default value for selectedGenre
window.selectedGenre = "Danceability"; // Set a default feature

// Helper functions
const kernelDensityEstimator = (kernel, X) => V =>
    X.map(x => [x, d3.mean(V, v => kernel(x - v))]);

const kernelEpanechnikov = k => v =>
    Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;

const calculateBandwidth = (values, factor = 8) => {
    const n = values.length;
    const stdDev = d3.deviation(values);
    return factor * stdDev * Math.pow(n, -1 / 5);
};

async function loadAndMergeData() {
    const spotifySongs = await d3.csv("../../data/spotify_songs_with_ids_norm.csv", d3.autoType);
    const top40 = await d3.csv("../../data/top40_with_ids.csv", d3.autoType);

    // Merge data based on Song_ID
    return top40.map(top40Row => {
        const spotifyRow = spotifySongs.find(song => song.Song_ID === top40Row.Song_ID);
        if (!spotifyRow) return null;

        return {
            Song_ID: top40Row.Song_ID,
            Jaar: +top40Row.Jaar,
            Weeknr: +top40Row.Weeknr,
            Longevity: +top40Row.Aantal_weken,
            Deze_week: +top40Row.Deze_week,
            ...spotifyRow,
        };
    }).filter(row => row !== null);
}

function processDensityData(data, selectedYears, selectedTop, features) {
    const filteredData = data.filter(row => row.Deze_week <= selectedTop);

    return features.map(feature => ({
        feature,
        densities: selectedYears.map(([start, end]) => ({
            range: [start, end],
            values: filteredData
                .filter(row => row.Jaar >= start && row.Jaar <= end)
                .map(row => row[feature])
                .filter(v => v !== undefined && v !== null)
        }))
    }));
}

async function updateDetailedView(dataArray) {
    const selectedFeatureData = dataArray.find(d => d.feature === window.selectedGenre);
    if (!selectedFeatureData) return;

    const { densities } = selectedFeatureData;

    const detailedWidth = 500;
    const detailedHeight = 200;
    const detailedMargin = { top: 30, right: 30, bottom: 50, left: 50 };

    let detailedSVG = d3.select("#detailed-plot svg");
    if (detailedSVG.empty()) {
        detailedSVG = d3.select("#detailed-plot")
            .append("svg")
            .attr("width", detailedWidth + detailedMargin.left + detailedMargin.right)
            .attr("height", detailedHeight + detailedMargin.top + detailedMargin.bottom)
            .append("g")
            .attr("transform", `translate(${detailedMargin.left},${detailedMargin.top})`)
            .attr("class", "detailed-plot-content");

        detailedSVG.append("g").attr("class", "x-axis").attr("transform", `translate(0,${detailedHeight})`);
        detailedSVG.append("g").attr("class", "y-axis");
        detailedSVG.append("text")
            .attr("class", "detailed-title")
            .attr("x", detailedWidth / 2)
            .attr("y", -detailedMargin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold");
        detailedSVG.append("text")
            .attr("class", "x-label")
            .attr("x", detailedWidth / 2)
            .attr("y", detailedHeight + detailedMargin.bottom / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Feature Values");
        detailedSVG.append("text")
            .attr("class", "y-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -detailedHeight / 2)
            .attr("y", -detailedMargin.left / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Probability Density");
    }

    const svg = d3.select(".detailed-plot-content");

    const allValues = densities.flatMap(d => d.values);
    const xScale = d3.scaleLinear().range([0, detailedWidth]).domain(d3.extent(allValues));
    const yScale = d3.scaleLinear().range([detailedHeight, 0]).domain([
        0,
        d3.max(densities, d => {
            const bandwidth = calculateBandwidth(d.values, 2);
            const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), xScale.ticks(100));
            return d3.max(kde(d.values), d => d[1]);
        }) * 1.1
    ]);

    svg.select(".x-axis")
        .transition()
        .duration(750)
        .call(d3.axisBottom(xScale).ticks(5));

    svg.select(".y-axis")
        .transition()
        .duration(750)
        .call(d3.axisLeft(yScale).ticks(3));

    const lines = svg.selectAll(".density-line").data(densities);

    lines.enter()
        .append("path")
        .attr("class", "density-line")
        .attr("fill", "none")
        .attr("stroke", (d, i) => d3.schemeCategory10[i % 10])
        .attr("stroke-width", 2)
        .merge(lines)
        .transition()
        .duration(750)
        .attr("d", d => {
            const bandwidth = calculateBandwidth(d.values, 2);
            const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), xScale.ticks(100));
            const density = kde(d.values);
            return d3.line()
                .curve(d3.curveBasis)
                .x(d => xScale(d[0]))
                .y(d => yScale(d[1]))(density);
        });

    lines.exit().remove();

    svg.select(".detailed-title").text(`Detailed View: ${window.selectedGenre}`);
}

function createPDFSubplots(dataArray) {
    const total_plot_width = 500;
    const total_plot_height = 500;

    const width = total_plot_width / 3;
    const height = total_plot_height / 5;
    const margin = { top: 20, right: 20, bottom: 20, left: 25 };

    const container = d3.select("#histogram")
        .append("div")
        .style("display", "grid")
        .style("grid-template-columns", "repeat(3, auto)");

    dataArray.forEach(({ feature, densities }) => {
        const svg = container
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("cursor", "pointer")
            .on("click", () => {
                window.selectedGenre = feature;
                console.log(`Selected genre updated to: ${window.selectedGenre}`);
                updateDetailedView(dataArray);
            });

        const allValues = densities.flatMap(d => d.values);
        const x = d3.scaleLinear()
            .domain(d3.extent(allValues))
            .range([margin.left, width - margin.right]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(densities, d => {
                const bandwidth = calculateBandwidth(d.values);
                const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), x.ticks(100));
                const density = kde(d.values);
                return d3.max(density, d => d[1]);
            }) * 1.1])
            .range([height - margin.bottom, margin.top]);

        svg.append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(3));

        svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(2));

        densities.forEach((d, i) => {
            const bandwidth = calculateBandwidth(d.values);
            const kde = kernelDensityEstimator(kernelEpanechnikov(bandwidth), x.ticks(100));
            const density = kde(d.values);

            svg.append("path")
                .datum(density)
                .attr("fill", "none")
                .attr("stroke", d3.schemeCategory10[i % 10])
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(d => x(d[0]))
                    .y(d => y(d[1]))
                );
        });

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top - 5)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text(feature);
    });

    updateDetailedView(dataArray);
}

async function updateGenrePlot(data, selectedYears) {
    const selectedGenreMapping = genreKeywords;

    const width = 500;
    const height = 500;
    const margin = { top: 50, right: 20, bottom: 50, left: 150 };

    const mapToPossibleGenres = (genres) => {
        for (const [key, keywords] of Object.entries(selectedGenreMapping)) {
            if (keywords.some(keyword => genres.toLowerCase().includes(keyword))) {
                return key;
            }
        }
        return "others";
    };

    const processedData = selectedYears.flatMap(([start, end]) => {
        const rangeLabel = `${start}-${end}`;
        const rangeData = data.filter(row => row.Jaar >= start && row.Jaar <= end);
        const genreCounts = {};

        rangeData.forEach(row => {
            const mappedGenre = mapToPossibleGenres(row.Artist_Genres || "");
            if (!genreCounts[mappedGenre]) genreCounts[mappedGenre] = 0;
            genreCounts[mappedGenre]++;
        });

        return Object.entries(genreCounts).map(([genre, count]) => ({
            range: rangeLabel,
            genre,
            count,
        }));
    });

    const genres = [...Object.keys(selectedGenreMapping), "others"];
    const ranges = Array.from(new Set(processedData.map(d => d.range)));

    const processedDataWithMissingGenres = genres.flatMap(genre => {
        const genreData = processedData.filter(d => d.genre === genre);
        if (genreData.length === 0) {
            return ranges.map(range => ({
                range,
                genre,
                count: 0,
            }));
        }
        return genreData;
    });

    const yGenre = d3.scaleBand()
        .domain(genres)
        .range([0, height])
        .paddingInner(0.2);

    const yRange = d3.scaleBand()
        .domain(ranges)
        .range([0, yGenre.bandwidth()])
        .padding(0.05);

    const x = d3.scaleLinear()
        .domain([0, d3.max(processedDataWithMissingGenres, d => d.count)])
        .range([0, width]);

    const svg = d3.select("#histogram")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.selectAll(".bar")
        .data(processedDataWithMissingGenres)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", 0)
        .attr("y", d => yGenre(d.genre) + yRange(d.range))
        .attr("width", d => x(d.count))
        .attr("height", yRange.bandwidth())
        .attr("fill", d => get_color_yearRange(d.range, ranges))
        .on("click", (event, d) => {
            window.selectedGenre = d.genre;
            console.log(`Selected genre updated to: ${window.selectedGenre}`);
        });

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yGenre))
        .selectAll(".tick text")
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            window.selectedGenre = d;
            console.log(`Selected genre updated to: ${window.selectedGenre}`);
        });

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Number of Songs");

    svg.append("text")
        .attr("x", -margin.left)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "start")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Genres by Year Range");
}

async function updateFeaturePlots() {
    const selectedYears = window.selectedYearRanges;
    const selectedTop = window.selectedTop;
    const selectedType = window.selectedType;
    const data = await loadAndMergeData();

    d3.select("#histogram").html("");

    if (selectedType === "features") {
        const features = [
            "Danceability", "Acousticness", "Energy", "Liveness", "Valence",
            "Speechiness", "Normalized_Loudness", "Normalized_Popularity", "Normalized_Tempo"
        ];
        const processedData = processDensityData(data, selectedYears, selectedTop, features);
        createPDFSubplots(processedData);
    } else if (selectedType === "genres") {
        updateGenrePlot(data, selectedYears);
    }
}

window.addEventListener("yearRangeUpdated", updateFeaturePlots);
window.addEventListener("topUpdated", updateFeaturePlots);
window.addEventListener("typeUpdated", updateFeaturePlots);

updateFeaturePlots();
