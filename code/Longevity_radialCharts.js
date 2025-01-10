const features_songs = ["Danceability", "Acousticness", "Energy", "Liveness", "Valence", "Speechiness"];

// const genreKeywords = {
//     "pop": ["pop"],
//     "hip-hop": ["hip-hop", "rap"],
//     "rock": ["rock", "metal", "punk", "alternative"],
//     "edm": ["edm", "house", "techno", "trance", "dubstep", "drum and bass"],
//     "r&b": ["r&b", "rhythm and blues", "soul", "funk"],
//     "country": ["country", "bluegrass", "folk"],
//     "latin": ["latin", "salsa", "reggaeton", "bossa nova"],
//     "jazz": ["jazz", "blues", "fusion"],
//     "classical": ["classical", "opera", "symphony"],
//     "reggae": ["reggae", "ska", "dancehall"]
// };    
// let genres = Object.keys(genreKeywords);

var categories = ["Short Hits", "Medium Hits", "Long Hits"];

var margin_longevity_radialChart = {top: 30, right: 30, bottom: 150, left: 60},
  width_longevity_radialChart = 460 - margin_longevity_radialChart.left - margin_longevity_radialChart.right,
  height_longevity_radialChart = 400 - margin_longevity_radialChart.top - margin_longevity_radialChart.bottom;
const innerRadius_longevity_radialChart = 5;
const outerRadius_longevity_radialChart = 100;

const longevity_radialChart = d3
    .select("#longevity_radialChart")
    .append("svg")
    .attr("width", width_longevity_radialChart + margin_longevity_radialChart.left + margin_longevity_radialChart.right)
    .attr("height", height_longevity_radialChart + margin_longevity_radialChart.top + margin_longevity_radialChart.bottom)
    .attr("viewBox", [-width_longevity_radialChart / 2, -height_longevity_radialChart / 2, width_longevity_radialChart, height_longevity_radialChart])
    .append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

function get_color_longevityRadialChart(category) {
    var colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 2]);
    let index = categories.indexOf(category);
    return colorScale(index);
}

function loadAndProcess_FeaturesData_longevityRadialChart(spotifySongs, top40, selected_years, selected_weeks, max_top, selected_feature_or_genre) {
    const all_years = [];
    selected_years.forEach(range_years=>{
        all_years.push(range_years[0]);
        for (let i = range_years[0] + 1; i <= range_years[1]; i++){
            all_years.push(i)
        }
    });
    const all_years_unique = [...new Set(all_years)];
    const mergedData = top40
        .filter((row) => all_years_unique.includes(+row.Jaar))
        .filter((row) => +row.Deze_week <= max_top)
        .filter((row) => +row.Weeknr >= selected_weeks[0] && +row.Weeknr <= selected_weeks[1])
        .map((top40Row) => {
            const spotifyData = spotifySongs.find(
                (song) => song.Song_ID === top40Row.Song_ID
        );
        if (spotifyData) {
            let featureData = {};
            features_songs.forEach((feature) => {
                featureData[feature] = parseFloat(spotifyData[feature]) || null;
            });
            return {
                Song_ID: top40Row.Song_ID,
                Jaar: parseInt(top40Row.Jaar),
                Weeknr: parseInt(top40Row.Weeknr),
                ...featureData,
            };
        }
        return {
            Song_ID: top40Row.Song_ID,
            Jaar: parseInt(top40Row.Jaar),
            Weeknr: parseInt(top40Row.Weeknr),
            ...Object.fromEntries(features_songs.map((feature) => [feature, null])),
            };
    });
    mergedData.sort((a, b) => {
        if (a.Jaar !== b.Jaar) {
        return a.Jaar - b.Jaar;
        }
        return a.Weeknr - b.Weeknr;
    });
    const longevity_information = d3.rollup(
        mergedData,
        (values) => ({
            maximum_amount_of_weeks: values.length,
            features: Object.fromEntries(
                features_songs.map((feature) => [
                    feature,
                    values.length > 0 ? values[0][feature] : null,
                ])
            ),
        }),
        (d) => d.Song_ID
    );

    function calculateStats(songs_inCategories) {
        var category_index = 0;
        const plotData = [];
        songs_inCategories.forEach((songs_inCategory) => {
            var category_name = categories[category_index];
            const featureStats = {};
            features_songs.forEach((feature) => {
                featureStats[feature] = {
                sum: 0,
                sumOfSquares: 0,
                count: 0,
                };
            });
            songs_inCategory.forEach((song) => {
                features_songs.forEach((feature) => {
                const value = song.features[feature];
                if (value !== null && value !== undefined) {
                    featureStats[feature].sum += value;
                    featureStats[feature].sumOfSquares += value * value;
                    featureStats[feature].count += 1;
                }
                });
            });
            Object.keys(featureStats).forEach((feature, index) => {
                const { sum, sumOfSquares, count } = featureStats[feature];
                if (count > 0) {
                const mean = sum / count;
                const variance = sumOfSquares / count - mean * mean;
                const stdDev = Math.sqrt(variance);

                plotData.push({
                    category: category_name,
                    feature: feature,
                    avg: mean,
                    min: Math.max(0, mean - stdDev),
                    max: Math.min(1, mean + stdDev),
                    angle: 2 * Math.PI * (index / features_songs.length),
                });
                } else {
                plotData.push({
                    feature: feature,
                    avg: null,
                    min: null,
                    max: null,
                    angle: null,
                });
                }
            });
            plotData.push({
                categrort: category_name,
                featureName: "total_songs",
                amount: songs_inCategory.length,
            });
            category_index += 1;
        });
    return plotData;
  }
  const groupedByLongevity = d3.rollup(
    Array.from(longevity_information.entries())
        .map(([Song_ID, data]) => ({ Song_ID, ...data })),
            group => group, 
            d => d.maximum_amount_of_weeks
    );
    const sortedGroups = Array.from(groupedByLongevity.entries())
        .sort((a, b) => a[0] - b[0]); 
    const songs_shortHits = [];
    const songs_mediumHits = [];
    const songs_longHits = [];
    let totalSongs = 0;
    sortedGroups.forEach(group => {
        totalSongs += group[1].length;
    });
    const maxWeeks = d3.max(sortedGroups, ([weeks]) => weeks);
    let targetSize = Math.ceil(totalSongs / 3);
    let currentCategory = songs_shortHits;
    sortedGroups.forEach(([weeks, group]) => {
        if (currentCategory.length > targetSize && currentCategory !== songs_longHits) {
            if (currentCategory === songs_shortHits) {
                currentCategory = songs_mediumHits;
                targetSize = Math.ceil((totalSongs - songs_shortHits.length) / 2);
            } 
            else {
                currentCategory = songs_longHits;
            }
        }
        if (currentCategory == songs_shortHits && weeks == maxWeeks -1) {
            currentCategory = songs_mediumHits;
        }
        if (currentCategory == songs_mediumHits && weeks == maxWeeks) {
            currentCategory = songs_longHits;
        }
        currentCategory.push(...group);
    });
    let stats_all = calculateStats([songs_shortHits, songs_mediumHits, songs_longHits]);
    return stats_all;
}

function loadAndProcess_GenresData_longevityRadialChart(spotifySongs, top40, selected_years, selected_weeks, max_top, selected_feature_or_genre) {
    const all_years = [];
    selected_years.forEach(range_years=>{
        all_years.push(range_years[0]);
        for (let i = range_years[0] + 1; i <= range_years[1]; i++){
            all_years.push(i)
        }
    });
    const mergedData = top40
        .filter((row) => all_years.includes(+row.Jaar))
        .filter((row) => +row.Deze_week <= max_top)
        .filter((row) => +row.Weeknr >= selected_weeks[0] && +row.Weeknr <= selected_weeks[1])
        .map((top40Row) => {
            const spotifyData = spotifySongs.find(
                (song) => song.Song_ID === top40Row.Song_ID
        );
        if (spotifyData) {
            return {
                Song_ID: top40Row.Song_ID,
                Jaar: parseInt(top40Row.Jaar),
                Weeknr: parseInt(top40Row.Weeknr),
                genres: spotifyData["Artist_Genres"] || null,
            };
        }
        return {
            Song_ID: top40Row.Song_ID,
            Jaar: parseInt(top40Row.Jaar),
            Weeknr: parseInt(top40Row.Weeknr),
            genres: null,
            };
        });
    mergedData.sort((a, b) => {
        if (a.Jaar !== b.Jaar) {
        return a.Jaar - b.Jaar;
        }
        return a.Weeknr - b.Weeknr;
    });
    const longevity_information = d3.rollup(
        mergedData,
        (values) => ({
            maximum_amount_of_weeks: values.length,
            genres: values[0].genres
        }),
        (d) => d.Song_ID
    );

    function calculateStats(songs_inCategories) {
        var category_index = 0;
        const plotData = [];
        songs_inCategories.forEach((songs_inCategory) => {
            var category_name = categories[category_index];
            let genreStats = {};
            var total_genres_divided = 0;
            for (const [broadGenre, keywords] of Object.entries(genreKeywords)) {
                genreStats[broadGenre] = 0; 
            }
            genreStats["other"] = 0;

            songs_inCategory.forEach((song) => {
                if (song.genres == null) {
                    genreStats["other"] += 1;
                    total_genres_divided += 1;
                    return;  
                }
                let genre_oneSong = song.genres.toLowerCase();
                let genreMatched = false;
                for (const [broadGenre, keywords] of Object.entries(genreKeywords)) {
                    if (keywords.some(keyword => genre_oneSong.includes(keyword))) {
                        genreStats[broadGenre] += 1; 
                        genreMatched = true;
                        total_genres_divided += 1;
                    }
                    }
                if (!genreMatched) {
                    genreStats["other"] += 1;
                    total_genres_divided += 1;
                }
            });

            Object.keys(genreStats).forEach((genre, index) => {
                plotData.push({
                    category: category_name,
                    genre: genre,
                    count: genreStats[genre]/ total_genres_divided,
                    angle: 2 * Math.PI * (index / (Object.keys(genreKeywords).length + 1)),
                });
            });
            plotData.push({
                categrory: category_name,
                featureName: "total_songs",
                amount: songs_inCategory.length,
            });
            category_index += 1;
        });
    return plotData;
  }
  const groupedByLongevity = d3.rollup(
    Array.from(longevity_information.entries())
        .map(([Song_ID, data]) => ({ Song_ID, ...data })),
            group => group, 
            d => d.maximum_amount_of_weeks
    );
    const sortedGroups = Array.from(groupedByLongevity.entries())
        .sort((a, b) => a[0] - b[0]); 
    const songs_shortHits = [];
    const songs_mediumHits = [];
    const songs_longHits = [];
    let totalSongs = 0;
    sortedGroups.forEach(group => {
        totalSongs += group[1].length;
    });
    const maxWeeks = d3.max(sortedGroups, ([weeks]) => weeks);
    let targetSize = Math.ceil(totalSongs / 3);
    let currentCategory = songs_shortHits;
    sortedGroups.forEach(([weeks, group]) => {
        if (currentCategory.length > targetSize && currentCategory !== songs_longHits) {
            if (currentCategory === songs_shortHits) {
                currentCategory = songs_mediumHits;
                targetSize = Math.ceil((totalSongs - songs_shortHits.length) / 2);
            } 
            else {
                currentCategory = songs_longHits;
            }
        }
        if (currentCategory == songs_shortHits && weeks == maxWeeks -1) {
            currentCategory = songs_mediumHits;
        }
        if (currentCategory == songs_mediumHits && weeks == maxWeeks) {
            currentCategory = songs_longHits;
        }
        currentCategory.push(...group);
    });
    let stats_all = calculateStats([songs_shortHits, songs_mediumHits, songs_longHits]);
    return stats_all;
}

function createInteractiveGraph_Features_longevityRadialChart(data) {
    console.log(data);
    const radiusScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([innerRadius_longevity_radialChart,outerRadius_longevity_radialChart]);
    const radialGrid = d3.range(innerRadius_longevity_radialChart, outerRadius_longevity_radialChart,
        (outerRadius_longevity_radialChart - innerRadius_longevity_radialChart) / 5);
    longevity_radialChart
        .selectAll(".grid")
        .data(radialGrid)
        .enter()
        .append("circle_radialChart")
        .attr("class", "grid")
        .attr("r", (d) => d)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("opacity", 0.3);
    longevity_radialChart
        .selectAll(".axis")
        .data(data.filter((d) => d.category === categories[0]))
        .enter()
        .append("line")
        .attr("class", "axis")
        .attr("x1", (d) => radiusScale(0) * Math.sin(d.angle))
        .attr("y1", (d) => -radiusScale(0) * Math.cos(d.angle))
        .attr("x2", (d) => radiusScale(1) * Math.sin(d.angle))
        .attr("y2", (d) => -radiusScale(1) * Math.cos(d.angle))
        .attr("stroke", "#999")
        .attr("opacity", 0.3);
    longevity_radialChart
        .selectAll(".label")
        .data(data.filter((d) => d.category === categories[0]))
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d) => (outerRadius_longevity_radialChart + 10) * Math.sin(d.angle))
        .attr("y", (d) => -(outerRadius_longevity_radialChart + 10) * Math.cos(d.angle))
        .attr("text-anchor", (d) => {
        if (d.angle === 0 || d.angle === Math.PI) {
            return "middle";
        } else if (d.angle > Math.PI) {
            return "end";
        } else {
            return "start";
        }
        })
        .attr("alignment-baseline", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text((d) => d.feature);
    
    categories.forEach((category) => {
        const filteredStats = data.filter((d) => d.category === category);
        const radialLine = d3
        .lineRadial()
        .angle((d) => d.angle)
        .radius((d) => radiusScale(d.avg))
        .curve(d3.curveLinearClosed);
    longevity_radialChart
        .append("path")
        .datum(filteredStats)
        .attr("d", radialLine)
        .attr("stroke", get_color_longevityRadialChart(category))
        .attr("fill", "none")
        .attr("opacity", 0.8)
        .attr("stroke-width", 2);
    });

    function activateStdArea(event){
        const isChecked = event.target.checked;
        categories.forEach((category) => {
            const filteredStats = data.filter((d) => d.category === category);
            var areaGenerator_raidalchart = d3
                .areaRadial()
                .angle((d) => d.angle)
                .innerRadius((d) => radiusScale(d.min))
                .outerRadius((d) => radiusScale(d.max))
                .curve(d3.curveCardinalClosed);
            var std_radialArea = longevity_radialChart
                .append("path")
                .attr("class", "area_radial");
            if (isChecked) {
                std_radialArea
                    .datum(filteredStats)
                    .attr("d", areaGenerator_raidalchart)
                    .attr("opacity", 0.2)
                    .attr("fill", get_color_longevityRadialChart(category));
            } else {
                longevity_radialChart.selectAll(".area_radial")
                    .remove();
            }
        });

    }
    d3.select("#myCheckbox").on("change", activateStdArea);


    var legendGroup = longevity_radialChart
        .append("g")
        .attr("class", "legendGroup");

    var legendItems = legendGroup
        .selectAll(".legendItem")
        .data(categories)
        .enter()
        .append("g")
        .attr("class", "legendItem")
        .attr("transform", (d, i) => `translate(${i * 110}, 0)`);

    legendItems
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", (d) => get_color_longevityRadialChart(d))
        .attr("x", 0)
        .attr("y", 0)
        .attr("stroke", "black");

    legendItems
        .append("text")
        .attr("x", 15)
        .attr("y", 10)
        .text((d) => d);
    var legendWidth = legendItems.size() * 110;
    legendGroup.attr(
        "transform",
        `translate(${-(width_longevity_radialChart - legendWidth) * 4} , ${
            height_longevity_radialChart * 0.6
        })`
    );
}

function createInteractiveGraph_GenresData_longevityRadialChart(data) {
    const maxCount = Math.max(...data.map(item => {
        return typeof item.count === 'number' && !isNaN(item.count) ? item.count : -Infinity;
    }));
    const radiusScale = d3
        .scaleLinear()
        .domain([0, maxCount * 1.1])
        .range([innerRadius_longevity_radialChart,outerRadius_longevity_radialChart]);
    const radialGrid = d3.range(innerRadius_longevity_radialChart, outerRadius_longevity_radialChart,
        (outerRadius_longevity_radialChart - innerRadius_longevity_radialChart) / 5);
    longevity_radialChart
        .selectAll(".grid")
        .data(radialGrid)
        .enter()
        .append("circle_radialChart")
        .attr("class", "grid")
        .attr("r", (d) => d)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("opacity", 0.3);
    longevity_radialChart
        .selectAll(".axis")
        .data(data.filter((d) => d.category === categories[0]))
        .enter()
        .append("line")
        .attr("class", "axis")
        .attr("x1", (d) => radiusScale(0) * Math.sin(d.angle))
        .attr("y1", (d) => -radiusScale(0) * Math.cos(d.angle))
        .attr("x2", (d) => radiusScale(maxCount * 1.1) * Math.sin(d.angle))
        .attr("y2", (d) => -radiusScale(maxCount * 1.1) * Math.cos(d.angle))
        .attr("stroke", "#999")
        .attr("opacity", 0.3);
    longevity_radialChart
        .selectAll(".label")
        .data(data.filter((d) => d.category === categories[0]))
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", (d) => (outerRadius_longevity_radialChart + 10) * Math.sin(d.angle))
        .attr("y", (d) => -(outerRadius_longevity_radialChart + 10) * Math.cos(d.angle))
        .attr("text-anchor", (d) => {
        if (d.angle === 0 || d.angle === Math.PI) {
            return "middle";
        } else if (d.angle > Math.PI) {
            return "end";
        } else {
            return "start";
        }
        })
        .attr("alignment-baseline", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text((d) => d.genre);
    
    categories.forEach((category) => {
        const filteredStats = data.filter((d) => d.category === category);
        const radialLine = d3
            .lineRadial()
            .angle((d) => d.angle)
            .radius((d) => radiusScale(d.count))
            .curve(d3.curveLinearClosed);
        longevity_radialChart
            .append("path")
            .datum(filteredStats)
            .attr("d", radialLine)
            .attr("stroke", get_color_longevityRadialChart(category))
            .attr("fill", "none")
            .attr("opacity", 0.8)
            .attr("stroke-width", 2);
    });

    var legendGroup = longevity_radialChart
        .append("g")
        .attr("class", "legendGroup");

    var legendItems = legendGroup
        .selectAll(".legendItem")
        .data(categories)
        .enter()
        .append("g")
        .attr("class", "legendItem")
        .attr("transform", (d, i) => `translate(${i * 110}, 0)`);

    legendItems
        .append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", (d) => get_color_longevityRadialChart(d))
        .attr("x", 0)
        .attr("y", 0)
        .attr("stroke", "black");

    legendItems
        .append("text")
        .attr("x", 15)
        .attr("y", 10)
        .text((d) => d);
    var legendWidth = legendItems.size() * 110;
    legendGroup.attr(
        "transform",
        `translate(${-(width_longevity_radialChart - legendWidth) * 4} , ${
            height_longevity_radialChart * 0.6
        })`
    );
}

function updateGraph() {
    console.log("Longevity");
    longevity_radialChart.selectAll(".area_radial").remove();
    longevity_radialChart.selectAll("path")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();
    d3.select("#std_button_id").select("label").remove(); 

    const selected_years = window.selectedYearRanges
        .sort((a, b) => a[0] - b[0])
        .map(range => range[0] === range[1] ? [range[0]] : range);
    const selected_weeks = window.selectedWeekRange;
    const max_top = window.selectedTop;
    const selection_features = window.selectedType;
    const selected_feature_or_genre = "Energy";

    d3.csv("../data/spotify_songs_with_ids.csv").then(function(data_spotifySongs) {
        data_spotifySongs.forEach(row => {
            row[selected_feature_or_genre] = +row[selected_feature_or_genre];
        });

        d3.csv("../data/top40_with_ids.csv").then(function(data_top40) {
            if (selection_features == "features") {
                const std_button = d3
                    .select("#std_button_id")
                    .append("label")
                    .text("add standard deviation area")
                    .append("input")
                    .attr("type", "checkbox")
                    .attr("id", "myCheckbox"); 

                const data = loadAndProcess_FeaturesData_longevityRadialChart(data_spotifySongs, data_top40, selected_years, selected_weeks, max_top, selected_feature_or_genre);
                createInteractiveGraph_Features_longevityRadialChart(data);
            } else {
                const data = loadAndProcess_GenresData_longevityRadialChart(data_spotifySongs, data_top40, selected_years, selected_weeks, max_top, selected_feature_or_genre);
                createInteractiveGraph_GenresData_longevityRadialChart(data);
            }
        });
    });
}


window.addEventListener('yearRangeUpdated', function () {
    document.getElementById("selectedYearRangesValue").innerText = JSON.stringify(window.selectedYearRanges);
    updateGraph();
});

window.addEventListener('weekRangeUpdated', function () {
    document.getElementById("selectedWeekRangeValue").innerText = JSON.stringify(window.selectedWeekRange);
    updateGraph();
});

window.addEventListener('typeUpdated', function () {
    document.getElementById("selectedTypeValue").innerText = window.selectedType;
    updateGraph();
});

window.addEventListener('topUpdated', function () {
    document.getElementById("selectedTopValue").innerText = window.selectedTop;
    updateGraph();
});

const get_genre_stats_per_week = function(lst_genres_week, genre_Keywords) {
    let genreCounts = {};
    for (const [broadGenre, keywords] of Object.entries(genre_Keywords)) {
        genreCounts[broadGenre] = 0; 
    }
    genreCounts["other"] = 0;

    lst_genres_week.forEach(genre => {
        genre = genre.toLowerCase();
        let genreMatched = false;
        for (const [broadGenre, keywords] of Object.entries(genre_Keywords)) {
            if (keywords.some(keyword => genre.includes(keyword))) {
                genreCounts[broadGenre] += 1; 
                genreMatched = true;
                break; 
            }
        }
        if (!genreMatched) {
            genreCounts["other"] += 1;
        }
    });
    const totalGenres = Object.values(genreCounts).reduce((acc, count) => acc + count, 0);
    let genres_stats_week = {};
    for (const [genre, count] of Object.entries(genreCounts)) {
        if (totalGenres > 0) {
            genres_stats_week[genre] = ((count / totalGenres) * 100).toFixed(2); 
        } else {
            genres_stats_week[genre] = 0; 
        }
    }
    return genres_stats_week;
};
