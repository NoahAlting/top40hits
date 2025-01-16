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

function createFeatureGenreMenu(options_drop_down) {
    const menuContainer = d3.select("#genre_feature_menu");
    menuContainer.selectAll("*").remove(); // Clear previous menu

    // Initialize the global variable with the first option as default
    if (!options_drop_down || options_drop_down.length === 0) {
        console.error("Error: No options provided for the dropdown.");
        return;
    }
    window.selected_feature_or_genre = options_drop_down[0];

    // Create the dropdown menu
    const dropdown = menuContainer.append("select")
        .attr("id", "genre_feature_dropdown")
        .on("change", function () {
            const selected_feature_or_genre = d3.select(this).property("value");
            window.selected_feature_or_genre = selected_feature_or_genre;
            updateLineGraph(); // Trigger the graph update
        });

    // Populate the dropdown options
    dropdown.selectAll("option")
        .data(options_drop_down)
        .enter()
        .append("option")
        .attr("value", (d) => d)
        .text((d) => d[0].toUpperCase() + d.slice(1));
}

var margin_lineGraph = {top: 30, right: 30, bottom: 150, left: 60},
    width_lineGraph = 460 - margin_lineGraph.left - margin_lineGraph.right,
    height_lineGraph = 400 - margin_lineGraph.top - margin_lineGraph.bottom;

const linePlot = d3.select("#lineGraph_overTime")
    .append("svg")
    .attr("width", width_lineGraph + margin_lineGraph.left + margin_lineGraph.right)
    .attr("height", height_lineGraph + margin_lineGraph.top + margin_lineGraph.bottom)
    .append("g")
    .attr("transform", "translate(" + margin_lineGraph.left + "," + margin_lineGraph.top + ")");

var tableContainer = d3.select("#lineGraph_overTime")
    .append("div")
    .attr("class", "table-container")
    .style("margin-top", `${-margin_lineGraph.bottom/2}px`)
    .style("margin-bottom", "0px");
var table = tableContainer.append("table")
    .attr("class", "value-table")
    .style("width", "100%")
    .style("border-collapse", "collapse")
    .style("visibility", "hidden");

function loadAndProcess_FeaturesData_LineGraph(spotifySongs, top40, selected_years, selected_weeks, max_top, selected_feature_or_genre) {
    const plotData = [];
    selected_years.forEach(range_years=>{
        const mergedData = top40
            .filter((row) => +row.Jaar >= range_years[0] && +row.Jaar <= range_years[1] || +row.Jaar == range_years[0])   
            .filter((row) => +row.Weeknr >= selected_weeks[0] && +row.Weeknr <= selected_weeks[1]) 
            .filter((row) => +row.Deze_week <= max_top)
            .map(top40 => {
                const songData = spotifySongs.find(song => song.Song_ID === top40.Song_ID);
                return songData ? {
                    Song_ID: top40.Song_ID,
                    Jaar: +top40.Jaar,
                    Weeknr: +top40.Weeknr,
                    selected_feature_value: songData[selected_feature_or_genre]
                } : null;
            }).filter(row => row !== null);
            const weeklyAverages = d3.rollup(
                mergedData, 
                values => {
                    const mean = d3.mean(values, v => v.selected_feature_value);
                    let std = d3.deviation(values, v => v.selected_feature_value);
                    std = Math.min(std || 0, max_top); 
                    return {
                        mean_week: mean,
                        std_week: std
                    };
                },
                d => d.Weeknr
            );
        weeklyAverages.forEach((values, week) => {
            plotData.push({
                year_range: range_years,
                week: week,
                avgValue: values.mean_week,
                stdDev: values.std_week
                });
            });
    });
    plotData.sort((a, b) => {
        if (a.year_range[0] !== b.year_range[0]) {
            return a.year_range[0] - b.year_range[0];
        }
        return a.week - b.week;
    });

    return plotData;
}

function loadAndProcess_GenresData_LineGraph(spotifySongs, top40, selected_years, selected_weeks, max_top, selected_feature_or_genre) {
    const plotData = [];
    selected_years.forEach(range_years=>{
        const mergedData = top40
        .filter((row) => +row.Jaar >= range_years[0] && +row.Jaar <= range_years[1] || +row.Jaar == range_years[0])            
        .filter((row) => +row.Deze_week <= max_top)
        .filter((row) => +row.Weeknr >= selected_weeks[0] && +row.Weeknr <= selected_weeks[1]) 
            .map(top40 => {
                const songData = spotifySongs.find(song => song.Song_ID === top40.Song_ID);
                if (songData) {
                    return {
                        Song_ID: top40.Song_ID,
                        Jaar: +top40.Jaar,
                        Weeknr: +top40.Weeknr,
                        genres: songData['Artist_Genres'].split(', ')
                    };
                }
                return null;
            }).filter(row => row !== null);
        const genres = get_genre_stats_per_week(mergedData.map(data => data.genres).flat(), genreKeywords);
        const weeklyAverages = d3.rollup(mergedData, 
            values => {
                const genres = get_genre_stats_per_week(values.map(data => data.genres).flat(), genreKeywords);
                return {
                    week_genres: genres
                };
            },
            d => d.Weeknr
        );  
        weeklyAverages.forEach((values, week) => {
            plotData.push({
                year_range: range_years,
                week: week,
                genre_percentage: values.week_genres[selected_feature_or_genre]
            });
        });
    });
    plotData.sort((a, b) => {
        if (a.year_range[0] !== b.year_range[0]) {
            return a.year_range[0] - b.year_range[0];
        }
        return a.week - b.week;
    });
    return plotData;
}

function createInteractiveGraph_Features_LineGraph(plotData, selected_years, selected_weeks, max_top, selected_feature_or_genre) {
    // Set domain and ranges for axes
    var x = d3.scaleLinear()
        .domain([selected_weeks[0], selected_weeks[1]])
        .range([0, width_lineGraph]);
    var y = d3.scaleLinear()
        .domain([0, 1])
        .range([height_lineGraph, 0]);
    // Label x-axis
    linePlot.append("g")
        .attr("transform", "translate(0," + height_lineGraph + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", width_lineGraph * 0.5)
        .attr("y", 35)
        .text("Weeknumber")
        .style("fill", "black")
        .style("font-size", "12px");
    // Label y-axis
    linePlot.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", - height_lineGraph * 0.5)
        .attr("y", -35)
        .attr("transform", "rotate(-90)")
        .text(selected_feature_or_genre)
        .style("fill", "black")
        .style("font-size", "12px");
    // Add legend
    const legendLabels = selected_years.map(range => 
        range.length > 1
            ? `${range[0]}-${range[1]}` 
            : `${range[0]}` 
    );
    const numLegendItems = legendLabels.length;
    const legendItemSpacing = width_lineGraph * 0.2; 
    const totalLegendWidth = numLegendItems * legendItemSpacing;
    const centerPosition = (width_lineGraph - totalLegendWidth) / 2;
    var legendGroup = linePlot.append("g")
        .attr("class", "legendGroup");
    var legendItems = legendGroup.selectAll(".legendItem")
        .data(legendLabels)
        .enter()
        .append("g")
        .attr("class", "legendItem")
        .attr("transform", (d, i) => `translate(${i * legendItemSpacing}, 0)`);
    legendItems.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", (d, i) => get_color_yearRange(selected_years[i], selected_years))
        .attr("x", 0)
        .attr("y", 0);
    legendItems.append("text")
        .attr("x", 12)
        .attr("y", 9)
        .text(d => d)
        .style("font-size", "12px");
    legendGroup.attr("transform", `translate(${centerPosition}, ${height_lineGraph * 1.25})`);
    /// Create all graphs/ parts
    // Average line in graph
    selected_years.forEach(year_range => {
        const yearData = plotData.filter(d => d.year_range === year_range);
        var line = linePlot.append("path")
            .datum(yearData)
            .attr("fill", "none")
            .attr("stroke", get_color_yearRange(year_range, selected_years))
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(d => x(d.week))
                .y(d => y(d.avgValue))
            );
    });
    // Area standard deviation
    var areaGenerator = d3.area()
        .x(function(d) { return x(d.week); })
        .y0(function(d) { return y(Math.max(0, d.avgValue - d.stdDev)); }) 
        .y1(function(d) { return y(Math.min(d.avgValue + d.stdDev, 1)); }); 
    var area_std = linePlot.append("path")
        .join("path")
        .attr("class", "area")
        .attr("fill-opacity", 0.2)
        .attr("stroke", "none");
    // Table below linegraph
    table.style("border-collapse", "collapse");
    var header = table.append("thead").append("tr");
    header.append("th").text("Week").style("border", "1px solid black").style("padding", "5px");
    legendLabels.forEach(year_range => {
        header.append("th").text(year_range).style("border", "1px solid black").style("padding", "5px");
    });
    var tbody = table.append("tbody");
    // Navigation vertical line in graph
    // https://d3-graph-gallery.com/graph/line_cursor.html  
    var navigationLine = linePlot.append('svg:rect')
        .attr('width', width_lineGraph)
        .attr('height', height_lineGraph)
        .attr('fill', 'none')
        .attr('pointer-events', 'all');

    /// Interactivity hoovering over graph: vertical navigation line appears, table generated and standard deviation area shown
    // https://stackoverflow.com/questions/29440455/how-to-as-mouseover-to-line-graph-interactive-in-d3
    linePlot.append("path")
        .attr("class", "mouseLine")
        .attr("fill", "none")
        .attr("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", 0);         
    linePlot
        .on('mouseout', function() {
            d3.select(".mouseLine").style("opacity", "0");
            table.style("visibility", "hidden");
            area_std.style("visibility", "hidden");
        })
        .on('mouseover', function() {
            d3.select(".mouseLine").style("opacity", "1");
            table.style("visibility", "visible");
            area_std.style("visibility", "visible");
        })
        .on('mousemove', function(event) {
            var xCoor = d3.pointer(event, this)[0]; 
            var xDate = x.invert(xCoor); 
            var weekData = plotData.filter(d => Math.abs(d.week - xDate) < 0.5); 

            var yCoor = d3.pointer(event, this)[1]; 
            var yDate = y.invert(yCoor); 

            // Make standard deviation area interactive
            var closest_value = Infinity;
            var closest_year = 0;
            selected_years.forEach(year_range => {
                var dataForYear = weekData.filter(d => d.year_range === year_range);
                if (dataForYear.length > 0) {
                    var distance = Math.abs(yDate - dataForYear[0].avgValue); 
                    if (distance < Math.abs(yDate - closest_value)) {
                        closest_value = dataForYear[0].avgValue;
                        closest_year = year_range; 
                    }
                }
            });
            if (closest_year != 0) {
                linePlot.selectAll(".area")
                    .data(selected_years.map(year => plotData.filter(d => d.year_range === closest_year)))
                    .attr("fill", d => get_color_yearRange(d[0]?.year_range, selected_years))
                    .attr("d", d => areaGenerator(d))
                    .style("visibility", function(d) {
                        return d[0]?.year_range === closest_year ? "visible" : "hidden";
                    });
            } else {
                area_std.style("visibility", "hidden"); 
            }
            d3.select(".mouseLine")
                .attr("d", function() {
                    var yRange = y.range(); 
                    return `M${xCoor},${yRange[0]}L${xCoor},${yRange[1]}`; 
                });
            if (weekData.length > 0) {
                var rowData = weekData[0]; 
                tbody.selectAll("tr").remove();
                var row = tbody.append("tr");
                row.append("td").text(rowData.week).style("border", "1px solid black").style("padding", "5px");
                selected_years.forEach(year_range => {
                    var dataForYear = weekData.filter(d => d.year_range === year_range);
                    row.append("td").text(dataForYear.length > 0 ? 
                        `${dataForYear[0].avgValue.toFixed(2)} ± ${dataForYear[0].stdDev.toFixed(2)}` 
                        : "No data")
                        .style("border", "1px solid black").style("padding", "5px");
                });
            }
        });
}

function createInteractiveGraph_Genress_LineGraph(plotData, selected_years, selected_weeks, max_top, selected_feature_or_genre){
    /// Graph settings
    // Set domain and ranges for axes
    var x = d3.scaleLinear()
        .domain([selected_weeks[0], selected_weeks[1]])
        .range([0, width_lineGraph]);
    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([height_lineGraph, 0]);
    // Label x-axis
    linePlot.append("g")
        .attr("transform", "translate(0," + height_lineGraph + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", width_lineGraph * 0.5)
        .attr("y", 35)
        .text("Weeknumber")
        .style("fill", "black")
        .style("font-size", "12px");
    // Label y-axis
    linePlot.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", - height_lineGraph * 0.5)
        .attr("y", -35)
        .attr("transform", "rotate(-90)")
        .text("Percentage " + selected_feature_or_genre + " (%)" )
        .style("fill", "black")
        .style("font-size", "12px");
    // Add legend
    const legendLabels = selected_years.map(range => 
        range.length > 1
            ? `${range[0]}-${range[1]}` 
            : `${range[0]}` 
    );
    const numLegendItems = legendLabels.length;
    const legendItemSpacing = width_lineGraph * 0.2; 
    const totalLegendWidth = numLegendItems * legendItemSpacing;
    const centerPosition = (width_lineGraph - totalLegendWidth) / 2;
    var legendGroup = linePlot.append("g")
        .attr("class", "legendGroup");
    var legendItems = legendGroup.selectAll(".legendItem")
        .data(legendLabels)
        .enter()
        .append("g")
        .attr("class", "legendItem")
        .attr("transform", (d, i) => `translate(${i * legendItemSpacing}, 0)`);
    legendItems.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", (d, i) => get_color_yearRange(selected_years[i], selected_years))
        .attr("x", 0)
        .attr("y", 0);
    legendItems.append("text")
        .attr("x", 12)
        .attr("y", 9)
        .text(d => d)
        .style("font-size", "12px");
    legendGroup.attr("transform", `translate(${centerPosition}, ${height_lineGraph * 1.25})`);
    /// Create all graphs/ parts
    // Average line in graph
    selected_years.forEach(year_range => {
        const yearData = plotData.filter(d => d.year_range === year_range);
        var line = linePlot.append("path")
            .datum(yearData)
            .attr("fill", "none")
            .attr("stroke", get_color_yearRange(year_range, selected_years))
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(d => x(d.week))
                .y(d => y(d.genre_percentage))
            );
    });
    // Table below linegraph
    table.style("border-collapse", "collapse");
    var header = table.append("thead").append("tr");
    header.append("th").text("Week").style("border", "1px solid black").style("padding", "5px");
    legendLabels.forEach(year_range => {
        header.append("th").text(year_range).style("border", "1px solid black").style("padding", "5px");
    });
    var tbody = table.append("tbody");
    // Navigation vertical line in graph
    // https://d3-graph-gallery.com/graph/line_cursor.html  
    var navigationLine = linePlot.append('svg:rect')
        .attr('width', width_lineGraph)
        .attr('height', height_lineGraph)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')

    /// Create interactivity: mouse line (vertical line) + Table to display the values below the legend
    // https://stackoverflow.com/questions/29440455/how-to-as-mouseover-to-line-graph-interactive-in-d3
    linePlot.append("path")
        .attr("class", "mouseLine")
        .attr("fill", "none")
        .attr("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", 0);
    linePlot
        .on('mouseout', function() {
            d3.select(".mouseLine")
                .style("opacity", "0");
            table.style("visibility", "hidden");
        })
        .on('mouseover', function() {
            d3.select(".mouseLine")
                .style("opacity", "1");
            table.style("visibility", "visible");
        })
        .on('mousemove', function(event) {
            var xCoor = d3.pointer(event, this)[0];
            var xDate = x.invert(xCoor);
            d3.select(".mouseLine")
                .attr("d", function() {
                    var yRange = y.range();
                    return `M${xCoor},${yRange[0]}L${xCoor},${yRange[1]}`;
                });
            var weekData = plotData.filter(d => Math.abs(d.week - xDate) < 0.5);
            if (weekData.length > 0) {
                var rowData = weekData[0];
                tbody.selectAll("tr").remove();
                var row = tbody.append("tr");
                row.append("td").text(rowData.week).style("border", "1px solid black").style("padding", "5px");
                selected_years.forEach(year_range => {
                    var dataForYear = weekData.filter(d => d.year_range === year_range);
                    row.append("td").text(dataForYear.length > 0 ? 
                        `${dataForYear[0].genre_percentage} %` 
                        : "No data")
                        .style("border", "1px solid black").style("padding", "5px");
                });
            }
        });
}

function updateLineGraph() {
    linePlot.selectAll("*")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();
    table.selectAll("*")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();
    const selected_years = window.selectedYearRanges.sort((a, b) => a[0] - b[0])
        .map(range => range[0] === range[1] ? [range[0]] : range);
    
    const selected_weeks = window.selectedWeekRange;
    const max_top = window.selectedTop;
    const selectedType = window.selectedType;
    const selected_feature_or_genre = window.selected_feature_or_genre;
    d3.csv("../data/spotify_songs_with_ids.csv").then(function(data_spotifySongs) {
        d3.csv("../data/top40_with_ids.csv").then(function(data_top40) {
            console.log("feature", selected_feature_or_genre);
            data_spotifySongs.forEach(row => {
                row[selected_feature_or_genre] = +row[selected_feature_or_genre];
            });
            if (selectedType == "features"){
                const data = loadAndProcess_FeaturesData_LineGraph(data_spotifySongs, data_top40, selected_years, selected_weeks, max_top, selected_feature_or_genre);
                createInteractiveGraph_Features_LineGraph(data, selected_years, selected_weeks, max_top, selected_feature_or_genre);
            }
            else {
                const data = loadAndProcess_GenresData_LineGraph(data_spotifySongs, data_top40, selected_years, selected_weeks, max_top, selected_feature_or_genre);
                createInteractiveGraph_Genress_LineGraph(data, selected_years, selected_weeks, max_top, selected_feature_or_genre);
            }
        });
    });
}

window.addEventListener('yearRangeUpdated', function () {
    document.getElementById("selectedYearRangesValue").innerText = JSON.stringify(window.selectedYearRanges);
    updateLineGraph();
});

window.addEventListener('weekRangeUpdated', function () {
    document.getElementById("selectedWeekRangeValue").innerText = JSON.stringify(window.selectedWeekRange);
    updateLineGraph();
});

window.addEventListener('typeUpdated', function () {
    document.getElementById("selectedTypeValue").innerText = window.selectedType;
    if (window.selectedType == "features"){
        createFeatureGenreMenu(possible_features_songs);
    }
    else{
        createFeatureGenreMenu(possible_genres);
    }
    updateLineGraph();
});

window.addEventListener('topUpdated', function () {
    document.getElementById("selectedTopValue").innerText = window.selectedTop;
    updateLineGraph();
});

document.addEventListener("DOMContentLoaded", function () {
    createFeatureGenreMenu(possible_features_songs);
});
