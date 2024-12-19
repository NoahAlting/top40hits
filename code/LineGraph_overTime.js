genre_options = ["pop", "hip-hop", "rock", "edm", "r&b", "soul", "country", "latin", "jazz", "classical", "reggae", "other"];

var selected_years = [1976, 1999, 2023]; 
var selected_feature_or_genre = 'Danceability'; 
var selected_weeks = [1, 53];
var selection_features = true;
var margin_lineGraph = {top: 30, right: 30, bottom: 150, left: 60},
    width_lineGraph = 460 - margin_lineGraph.left - margin_lineGraph.right,
    height_lineGraph = 400 - margin_lineGraph.top - margin_lineGraph.bottom;

selected_years.sort((a, b) => a - b);

function get_color(year) {
    var colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, selected_years.length - 1]); 
    let index = selected_years.indexOf(year); 
    return colorScale(index);    
}

const linePlot = d3.select("#lineGraph_overTime")
    .append("svg")
    .attr("width", width_lineGraph + margin_lineGraph.left + margin_lineGraph.right)
    .attr("height", height_lineGraph + margin_lineGraph.top + margin_lineGraph.bottom)
    .append("g")
    .attr("transform", "translate(" + margin_lineGraph.left + "," + margin_lineGraph.top + ")");

    

if (selection_features == true){
    d3.csv("../data/spotify_songs_with_ids.csv").then(function(data_spotifySongs) {
        data_spotifySongs.forEach(row => {
            row[selected_feature_or_genre] = +row[selected_feature_or_genre];
        });
    
        d3.csv("../data/top40_with_ids.csv").then(function(data_top40) {
    
            // Merge the datasets by Song_ID, sort the data and calculate stddev and mean per week for the specified years
            const mergedData = data_top40.filter(row => selected_years.includes(+row.Jaar))
                .map(top40 => {
                    const songData = data_spotifySongs.find(song => song.Song_ID === top40.Song_ID);
                    if (songData) {
                        return {
                            Song_ID: top40.Song_ID,
                            Jaar: +top40.Jaar,
                            Weeknr: +top40.Weeknr,
                            selected_feature_value: songData[selected_feature_or_genre]
                        };
                    }
                    return null;
                }).filter(row => row !== null);
            const sortedData = mergedData.sort((a, b) => {
                if (a.Jaar !== b.Jaar) {
                    return a.Jaar - b.Jaar; 
                }
                return a.Weeknr - b.Weeknr; 
            });
            const weeklyAverages = d3.rollup(sortedData, 
                values => {
                    const mean_week = d3.mean(values, v => v.selected_feature_value);
                    const std_week = d3.deviation(values, v => v.selected_feature_value);
                    return {
                        mean_week: mean_week,
                        std_week: std_week
                    };
                },
                d => d.Jaar,
                d => d.Weeknr
            );
            const plotData = [];
            selected_years.forEach(year => {
                const yearData = weeklyAverages.get(year) || new Map();
                yearData.forEach((values, week) => {
                    plotData.push({
                        year: year,
                        week: week,
                        avgValue: values.mean_week,
                        stdDev: values.std_week
                    });
                });
            });
    
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
            
            // Makes mouseline possible
            linePlot.append("path")
                .attr("class", "mouseLine")
                .attr("fill", "none")
                .attr("stroke", "black")
                .style("stroke-width", "1px")
                .style("opacity", 0);

            selected_years.forEach(year => {
                const yearData = plotData.filter(d => d.year === year);
    
                // Average line
                var line = linePlot.append("path")
                    .datum(yearData)
                    .attr("fill", "none")
                    .attr("stroke", get_color(year))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => x(d.week))
                        .y(d => y(d.avgValue))
                    );
            });

            // Area
            // https://d3-graph-gallery.com/graph/line_cursor.html
            var areaGenerator = d3.area()
                .x(function(d) { return x(d.week); })
                .y0(function(d) { return y(Math.max(0, d.avgValue - d.stdDev)); }) 
                .y1(function(d) { return y(Math.min(d.avgValue + d.stdDev, 1)); }); 
            var area_std = linePlot.append("path")
                .join("path")
                .attr("class", "area")
                .attr("fill-opacity", 0.2)
                .attr("stroke", "none");

            // Add legend
            var legendGroup = linePlot.append("g")
                .attr("class", "legendGroup");
            var legendItems = legendGroup.selectAll(".legendItem")
                .data(selected_years)
                .enter()
                .append("g")
                .attr("class", "legendItem")
                .attr("transform", (d, i) => `translate(${i * (margin_lineGraph.bottom / 2)}, 0)`);
            legendItems.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", d => get_color(d))
                .attr("x", 0)
                .attr("y", 0);
            legendItems.append("text")
                .attr("x", 15) 
                .attr("y", 10)
                .text(d => d);
            var legendWidth = legendItems.size() * 75; 
            legendGroup.attr("transform", `translate(${(width_lineGraph - legendWidth) * 0.6}, ${height_lineGraph * 1.25})`);

            // Create interactivity: mouse line (vertical line) + Table to display the values below the legend
            // https://stackoverflow.com/questions/29440455/how-to-as-mouseover-to-line-graph-interactive-in-d3
            var tableContainer = d3.select("#lineGraph_overTime").append("div")
                .attr("class", "table-container")
                .style("margin-top", `${-margin_lineGraph.bottom/2}px`)
                .style("margin-bottom", "0px");
            var table = tableContainer.append("table")
                .attr("class", "value-table")
                .style("width", "100%")
                .style("border-collapse", "collapse");
            var header = table.append("thead").append("tr");
            header.append("th").text("Week").style("border", "1px solid black").style("padding", "5px");
            selected_years.forEach(year => {
                header.append("th").text(year).style("border", "1px solid black").style("padding", "5px");
            });
            var tbody = table.append("tbody");

            linePlot.append('svg:rect')
                .attr('width', width_lineGraph)
                .attr('height', height_lineGraph)
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
                .on('mouseout', function() {
                    d3.select(".mouseLine")
                        .style("opacity", "0");
                    table.style("visibility", "hidden");
                    area_std.style("visibility", "hidden");

                })
                .on('mouseover', function() {
                    d3.select(".mouseLine")
                        .style("opacity", "1")
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
                    selected_years.forEach(year => {
                        var dataForYear = weekData.filter(d => d.year === year);
                        if (dataForYear.length > 0){
                            var distance = Math.abs(yDate - dataForYear[0].avgValue); 
                            if (distance < Math.abs(yDate - closest_value)) {
                                closest_value = dataForYear[0].avgValue; 
                                closest_year = year;  
                            }
                        }

                    });
                    if (closest_year != 0){
                        linePlot.selectAll(".area")
                            .data(selected_years.map(year => plotData.filter(d => d.year === closest_year)))
                            .attr("fill", d => get_color(d[0]?.year))
                            .attr("d", d => areaGenerator(d))
                            .style("visibility", function(d) {
                                return d[0]?.year === closest_year ? "visible" : "hidden";
                            }); 
                    }
                    else{
                        area_std.style("visibility", "hidden");
                    }

                    // Make navigating vertical line interactive
                    d3.select(".mouseLine")
                        .attr("d", function() {
                            var yRange = y.range();
                            return `M${xCoor},${yRange[0]}L${xCoor},${yRange[1]}`;
                        });

                    // Updating table with position mouse
                    if (weekData.length > 0) {
                        var rowData = weekData[0];
                        tbody.selectAll("tr").remove();
                        var row = tbody.append("tr");
                        row.append("td").text(rowData.week).style("border", "1px solid black").style("padding", "5px");
                        selected_years.forEach(year => {
                            var dataForYear = weekData.filter(d => d.year === year);
                            row.append("td").text(dataForYear.length > 0 ? 
                                `${dataForYear[0].avgValue.toFixed(2)} ± ${dataForYear[0].stdDev.toFixed(2)}` 
                                : "No data")
                                .style("border", "1px solid black").style("padding", "5px");
                        });
                    }
                });
        });
    });
};



if (selection_features == false) {
    // Make function that calculates for one week the popularity per genre
    const genres_normalize = function(lst_genres_week) {
        let genreCounts = {
            "pop": 0,
            "hip-hop": 0,
            "rock": 0,
            "edm": 0,
            "r&b": 0,
            "soul": 0,
            "country": 0,
            "latin": 0,
            "jazz": 0,
            "classical": 0,
            "reggae": 0,
            "other": 0
        };
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
        lst_genres_week.forEach(genre => {
            genre = genre.toLowerCase();
            let genreMatched = false;
            for (const [broadGenre, keywords] of Object.entries(genreKeywords)) {
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
        let genres_Normalized = {};
        for (const [genre, count] of Object.entries(genreCounts)) {
            if (totalGenres > 0) {
                genres_Normalized[genre] = ((count / totalGenres) * 100).toFixed(2); 
            } else {
                genres_Normalized[genre] = 0; 
            }
        }
        return genres_Normalized;
    };

    d3.csv("../data/spotify_songs_with_ids.csv").then(function(data_spotifySongs) {
        data_spotifySongs.forEach(row => {
            row[selected_feature_or_genre] = +row[selected_feature_or_genre];
        });

        d3.csv("../data/top40_with_ids.csv").then(function(data_top40) {

            // Merge the datasets by Song_ID, sort the data and calculate stddev and mean per week for the specified years
            const mergedData = data_top40.filter(row => selected_years.includes(+row.Jaar))
                .map(top40 => {
                    const songData = data_spotifySongs.find(song => song.Song_ID === top40.Song_ID);
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
            const genres = genres_normalize(mergedData.map(data => data.genres).flat());
            const sortedData = mergedData.sort((a, b) => {
                if (a.Jaar !== b.Jaar) {
                    return a.Jaar - b.Jaar; 
                }
                return a.Weeknr - b.Weeknr; 
            });
            const weeklyAverages = d3.rollup(sortedData, 
                values => {
                    const genres = genres_normalize(values.map(data => data.genres).flat());
                    return {
                        week_genres: genres
                    };
                },
                d => d.Jaar,
                d => d.Weeknr
            );
            const plotData = [];
            selected_years.forEach(year => {    
                const yearData = weeklyAverages.get(year) || new Map();
                yearData.forEach((values, week) => {
                    plotData.push({
                        year: year,
                        week: week,
                        genre_percentage: values.week_genres[selected_feature_or_genre]
                    });
                });
            });

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

            selected_years.forEach(year => {
                const yearData = plotData.filter(d => d.year === year);

                // Average line
                var line = linePlot.append("path")
                    .datum(yearData)
                    .attr("fill", "none")
                    .attr("stroke", get_color(year))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => x(d.week))
                        .y(d => y(d.genre_percentage))
                    );
            });

            // Add legend
            var legendGroup = linePlot.append("g")
                .attr("class", "legendGroup");
            var legendItems = legendGroup.selectAll(".legendItem")
                .data(selected_years)
                .enter()
                .append("g")
                .attr("class", "legendItem")
                .attr("transform", (d, i) => `translate(${i * (margin_lineGraph.bottom / 2)}, 0)`);
            legendItems.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", d => get_color(d))
                .attr("x", 0)
                .attr("y", 0);
            legendItems.append("text")
                .attr("x", 15) 
                .attr("y", 10)
                .text(d => d);
            var legendWidth = legendItems.size() * 75; 
            legendGroup.attr("transform", `translate(${(width_lineGraph - legendWidth) * 0.6}, ${height_lineGraph * 1.25})`);

            // Create interactivity: mouse line (vertical line) + Table to display the values below the legend
            // https://stackoverflow.com/questions/29440455/how-to-as-mouseover-to-line-graph-interactive-in-d3
            var tableContainer = d3.select("#lineGraph_overTime").append("div")
                .attr("class", "table-container")
                .style("margin-top", `${-margin_lineGraph.bottom/2}px`)
                .style("margin-bottom", "0px");
            var table = tableContainer.append("table")
                .attr("class", "value-table")
                .style("width", "100%")
                .style("border-collapse", "collapse");
            var header = table.append("thead").append("tr");
            header.append("th").text("Week").style("border", "1px solid black").style("padding", "5px");
            selected_years.forEach(year => {
                header.append("th").text(year).style("border", "1px solid black").style("padding", "5px");
            });
            var tbody = table.append("tbody");
            linePlot.append("path")
                .attr("class", "mouseLine")
                .attr("fill", "none")
                .attr("stroke", "black")
                .style("stroke-width", "1px")
                .style("opacity", 0);
            linePlot.append('svg:rect')
                .attr('width', width_lineGraph)
                .attr('height', height_lineGraph)
                .attr('fill', 'none')
                .attr('pointer-events', 'all')
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
                        selected_years.forEach(year => {
                            var dataForYear = weekData.filter(d => d.year === year);
                            row.append("td").text(dataForYear.length > 0 ? 
                                `${dataForYear[0].genre_percentage}` 
                                : "No data")
                                .style("border", "1px solid black").style("padding", "5px");
                        });
                    }
                });
        });
    });

}
