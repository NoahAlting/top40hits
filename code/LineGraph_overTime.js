var selected_years = [1990, 1994, 2020]; 
var selected_feature = "Danceability"; 
var selected_weeks = [1, 53];
var colorScale = d3.scaleOrdinal(d3.schemeCategory10);

var margin_lineGraph = {top: 30, right: 30, bottom: 70, left: 60},
    width_lineGraph = 460 - margin_lineGraph.left - margin_lineGraph.right,
    height_lineGraph = 400 - margin_lineGraph.top - margin_lineGraph.bottom;

const linePlot = d3.select("#lineGraph_overTime")
    .append("svg")
        .attr("width", width_lineGraph + margin_lineGraph.left + margin_lineGraph.right)
        .attr("height", height_lineGraph + margin_lineGraph.top + margin_lineGraph.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin_lineGraph.left + "," + margin_lineGraph.top + ")");

d3.csv("../data/spotify_songs_with_ids.csv").then(function(data_spotifySongs) {
    data_spotifySongs.forEach(row => {
        row[selected_feature] = +row[selected_feature];
    });

    d3.csv("../data/top40_with_ids.csv").then(function(data_top40) {

        // Merge the datasets by Song_ID
        const mergedData = data_top40.filter(row => selected_years.includes(+row.Jaar))
            .map(top40 => {
                const songData = data_spotifySongs.find(song => song.Song_ID === top40.Song_ID);
                if (songData) {
                    return {
                        Song_ID: top40.Song_ID,
                        Jaar: +top40.Jaar,
                        Weeknr: +top40.Weeknr,
                        selected_feature_value: songData[selected_feature]
                    };
                }
                return null;
            }).filter(row => row !== null);

        // Calculate stddev and mean per week for the specified years
        const weeklyAverages = d3.rollup(mergedData, 
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

        // Set domain and ranges for axis
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
            .attr("text-anchor", "end")
            .attr("x", width_lineGraph * 0.6)
            .attr("y", 35)
            .text("Weeknumber")
            .style("fill", "black");
        
        // Label y-axis
        linePlot.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("text-anchor", "end")
            .attr("x", - height_lineGraph * 0.4)
            .attr("y", -35)
            .attr("transform", "rotate(-90)")
            .text(selected_feature)
            .style("fill", "black");

        selected_years.forEach(year => {
            const yearData = plotData.filter(d => d.year === year);
            
            // Average line
            linePlot.append("path")
                .datum(yearData)
                .attr("fill", "none")
                .attr("stroke", colorScale(year))
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => x(d.week))
                    .y(d => y(d.avgValue))
                );
                
            // Confidence interval line (stddev)
            linePlot.append("path")
                .datum(yearData)
                .attr("fill", colorScale(year)) 
                .attr("fill-opacity", 0.2)
                .attr("stroke", "none")
                .attr("d", d3.area()
                    .x(function(d) { return x(d.week) })
                    .y0(function(d) { return y(d.avgValue - d.stdDev) })
                    .y1(function(d) { return y(d.avgValue + d.stdDev) })
                    );
            
            // Add label
            linePlot.append("text")
                .attr("x", width_lineGraph * 0.9)
                .attr("y", 0 + 20 * selected_years.indexOf(year))
                .attr("fill", colorScale(year)) 
                .text(year);
        });
    });
});
