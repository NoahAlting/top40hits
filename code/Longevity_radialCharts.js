var selected_years = [1980, 1996];
var selected_weeks = [1, 53];
var selected_feature_or_genre = 'Acousticness'; 
var selection_features = true;
var margin_longevity_radialChart = {top: 30, right: 30, bottom: 150, left: 60},
    width_longevity_radialChart = 460 - margin_longevity_radialChart.left - margin_longevity_radialChart.right,
    height_longevity_radialChart = 400 - margin_longevity_radialChart.top - margin_longevity_radialChart.bottom;
const innerRadius = 30;
const outerRadius = 100;
const features_songs = ["Danceability", "Acousticness", "Energy", "Liveness", "Valence", "Speechiness"];
    
var threshold_shortHits = 5;
var threshold_mediumHits = 10;

selected_years.sort((a, b) => a - b);

const longevity_radialChart = d3.select("#longevity_radialChart")
    .append("svg")
    .attr("width", width_longevity_radialChart + margin_longevity_radialChart.left + margin_longevity_radialChart.right)
    .attr("height", height_longevity_radialChart + margin_longevity_radialChart.top + margin_longevity_radialChart.bottom)
    .attr("viewBox", [-width_longevity_radialChart / 2, -height_longevity_radialChart / 2, width_longevity_radialChart, height_longevity_radialChart])
    .append("g")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

function get_color_longevity_radialChart(year) {
    var colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain([0, selected_years.length - 1]); 
    let index = selected_years.indexOf(year); 
    return colorScale(index);    
};

function loadData_longevityRadialChart() {
    
    d3.csv("../data/spotify_songs_with_ids.csv").then(function(data_spotifySongs) {
        data_spotifySongs.forEach(row => {
            row[selected_feature_or_genre] = +row[selected_feature_or_genre];
        });

        d3.csv("../data/top40_with_ids.csv").then(function(data_top40) {
            if (selection_features == true){
                const stats_all = processFeaturesData(data_spotifySongs, data_top40);
                createInteractiveGraphFeatures(stats_all);
            }
            else {
                const stats_all = processGenresData(data_spotifySongs, data_top40);
                createInteractiveGraphGenres(stats_all);
            }
        });
    });
}

function processFeaturesData(spotifySongs, top40) {
    const mergedData = top40.filter(row => selected_years.includes(+row.Jaar))
        .map(top40Row => {
            const spotifyData = spotifySongs.find(song => song.Song_ID === top40Row.Song_ID);
            if (spotifyData) {
                let featureData = {};
                features_songs.forEach(feature => {
                    featureData[feature] = parseFloat(spotifyData[feature]) || null;
                });
                return {
                    Song_ID: top40Row.Song_ID,
                    Jaar: parseInt(top40Row.Jaar),
                    Weeknr: parseInt(top40Row.Weeknr),
                    Aantal_weken: parseInt(top40Row.Aantal_weken),
                    ...featureData
                };
            }
            return {
                Song_ID: top40Row.Song_ID,
                Jaar: parseInt(top40Row.Jaar),
                Weeknr: parseInt(top40Row.Weeknr),
                Aantal_weken: parseInt(top40Row.Aantal_weken),
                ...Object.fromEntries(features_songs.map(feature => [feature, null]))
            };
        });
    mergedData.sort((a, b) => {
            if (a.Jaar !== b.Jaar) {
                return a.Jaar - b.Jaar; 
            }
            return a.Weeknr - b.Weeknr; 
        });
    const longevity_information = d3.rollup(mergedData,
        values => ({
            maximum_amount_of_weeks: d3.max(values, v => v.Aantal_weken),
            features: Object.fromEntries(features_songs.map(feature => [feature, values.length > 0 ? values[0][feature] : null]))
        }),
        d => d.Song_ID
    );

    function calculateStats(songs_inCategories) {
        var categories = ["Short Hits", "Medium Hits", "Long hits"];
        var category_index = 0;
        const plotData = [];

        songs_inCategories.forEach(songs_inCategory => {
            var category_name = categories[category_index];
            const featureStats = {};
            features_songs.forEach(feature => {
                featureStats[feature] = {
                    sum: 0,
                    sumOfSquares: 0,
                    count: 0
                };
            });
            songs_inCategory.forEach(song => {
                features_songs.forEach(feature => {
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
                        value: mean,
                        min: mean - stdDev,
                        max: mean + stdDev,
                        angle: 2 * Math.PI * (index / features_songs.length)
                    });
                } else {
                    plotData.push({
                        feature: feature,
                        value: null,
                        min: null,
                        max: null,
                        angle: null
                    });
                }
            });

            plotData.push({
                categrort: category_name,
                featureName: "total_songs",
                amount: songs_inCategory.length
            });
            category_index += 1;
        })

    
        return plotData;
    }

    const songs_shortHits = Array.from(longevity_information.entries())
        .filter(([Song_ID, data]) => data.maximum_amount_of_weeks < threshold_shortHits)
        .map(([Song_ID, data]) => ({ Song_ID, ...data }));
    const songs_mediumHits = Array.from(longevity_information.entries())
        .filter(([Song_ID, data]) => data.maximum_amount_of_weeks >= threshold_shortHits && data.maximum_amount_of_weeks < threshold_mediumHits)
        .map(([Song_ID, data]) => ({ Song_ID, ...data }));
    const songs_longHits = Array.from(longevity_information.entries())
        .filter(([Song_ID, data]) => data.maximum_amount_of_weeks >= threshold_mediumHits)
        .map(([Song_ID, data]) => ({ Song_ID, ...data }));
    let stats_all = calculateStats([songs_shortHits, songs_mediumHits, songs_longHits]);
    return stats_all;
}

function processGenresData(spotifySongs, top40) {
    
}

function createInteractiveGraphFeatures(stats_all) {
    const filteredStats = stats_all.filter(d => 
        d.category === 'Short Hits'
    );
    filteredStats.forEach(d => {
        d.avgValue = +d.avgValue;
        d.min = +d.min;
        d.max = +d.max;
    });
    const radiusScale = d3.scaleLinear()
        .domain([0, 1])
        .range([innerRadius, outerRadius]);
    const radialArea = d3.areaRadial()
        .angle(d => d.angle)
        .innerRadius(innerRadius)
        .outerRadius(d => radiusScale(d.value))
        .curve(d3.curveCardinalClosed);
    longevity_radialChart.append("path")
        .datum(filteredStats)
        .attr("d", radialArea)
        .attr("fill", "steelblue")
        .attr("opacity", 0.7);
    const radialGrid = d3.range(innerRadius, outerRadius, (outerRadius- innerRadius)/5);
    longevity_radialChart.selectAll(".grid")
        .data(radialGrid)
        .enter()
        .append("circle")
        .attr("class", "grid")
        .attr("r", d => d)
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("opacity", 0.3);
    const radialAxis = longevity_radialChart.selectAll(".axis")
        .data(filteredStats)
        .enter()
        .append("line")
        .attr("class", "axis")
        .attr("x1", d => radiusScale(0) * Math.sin(d.angle))  
        .attr("y1", d => -radiusScale(0) * Math.cos(d.angle)) 
        .attr("x2", d => radiusScale(1) * Math.sin(d.angle))  
        .attr("y2", d => -radiusScale(1) * Math.cos(d.angle))
        .attr("stroke", "#999")
        .attr("opacity", 0.3);
    longevity_radialChart.selectAll(".label")
        .data(filteredStats)
        .enter()
        .append("text")
        .attr("class", "label")
        .attr("x", d => (outerRadius + 10) * Math.sin(d.angle))
        .attr("y", d => -(outerRadius + 10) * Math.cos(d.angle))
        .attr("text-anchor", d => {
            if (d.angle == 0 || d.angle == Math.PI) {
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
        .text(d => d.feature);
    }

function createInteractiveGraphGenres(plotData){
    /// Graph settings
    // Set domain and ranges for axes
    var x = d3.scaleLinear()
        .domain([selected_weeks[0], selected_weeks[1]])
        .range([0, width_longevity_radialChart]);
    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([height_longevity_radialChart, 0]);
    // Label x-axis
    longevity_radialChart.append("g")
        .attr("transform", "translate(0," + height_longevity_radialChart + ")")
        .call(d3.axisBottom(x))
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", width_longevity_radialChart * 0.5)
        .attr("y", 35)
        .text("Weeknumber")
        .style("fill", "black")
        .style("font-size", "12px");
    // Label y-axis
    longevity_radialChart.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", - height_longevity_radialChart * 0.5)
        .attr("y", -35)
        .attr("transform", "rotate(-90)")
        .text("Percentage " + selected_feature_or_genre + " (%)" )
        .style("fill", "black")
        .style("font-size", "12px");
    // Add legend
    var legendGroup = longevity_radialChart.append("g")
        .attr("class", "legendGroup");
    var legendItems = legendGroup.selectAll(".legendItem")
        .data(selected_years)
        .enter()
        .append("g")
        .attr("class", "legendItem")
        .attr("transform", (d, i) => `translate(${i * (margin_longevity_radialChart.bottom / 2)}, 0)`);
    legendItems.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => get_color_longevity_radialChart(d))
        .attr("x", 0)
        .attr("y", 0);
    legendItems.append("text")
        .attr("x", 15) 
        .attr("y", 10)
        .text(d => d);
    var legendWidth = legendItems.size() * 75; 
    legendGroup.attr("transform", `translate(${(width_longevity_radialChart - legendWidth) * 0.6}, ${height_longevity_radialChart * 1.25})`);
    
    /// Create all graphs/ parts
    // Average line in graph
    selected_years.forEach(year => {
        const yearData = plotData.filter(d => d.year === year);
        var line = longevity_radialChart.append("path")
            .datum(yearData)
            .attr("fill", "none")
            .attr("stroke", get_color_longevity_radialChart(year))
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(d => x(d.week))
                .y(d => y(d.genre_percentage))
            );
    });
    // Table below linegraph
    var tableContainer = d3.select("#longevity_radialChart").append("div")
        .attr("class", "table-container")
        .style("margin-top", `${-margin_longevity_radialChart.bottom/2}px`)
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
    // Navigation vertical line in graph
    // https://d3-graph-gallery.com/graph/line_cursor.html  
    var navigationLine = longevity_radialChart.append('svg:rect')
        .attr('width', width_longevity_radialChart)
        .attr('height', height_longevity_radialChart)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')

    /// Create interactivity: mouse line (vertical line) + Table to display the values below the legend
    // https://stackoverflow.com/questions/29440455/how-to-as-mouseover-to-line-graph-interactive-in-d3
    longevity_radialChart.append("path")
        .attr("class", "navigationLine")
        .attr("fill", "none")
        .attr("stroke", "black")
        .style("stroke-width", "1px")
        .style("opacity", 0);
    longevity_radialChart
        .on('mouseout', function() {
            d3.select(".navigationLine")
                .style("opacity", "0");
            table.style("visibility", "hidden");
        })
        .on('mouseover', function() {
            d3.select(".navigationLine")
                .style("opacity", "1");
            table.style("visibility", "visible");
        })
        .on('mousemove', function(event) {
            var xCoor = d3.pointer(event, this)[0];
            var xDate = x.invert(xCoor);
            d3.select(".navigationLine")
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
}

loadData_longevityRadialChart();