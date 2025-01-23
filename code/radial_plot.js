var width_radialplot_container = document.getElementById("radial_plots").clientWidth;
var height_radialplot_container = document.getElementById("radial_plots").clientHeight;
var margin_radialplot = {top: height_radialplot_container*0.55, right: width_radialplot_container*0.1, bottom: height_radialplot_container*0.1, left: width_radialplot_container*0.1};
var width_radialplot = width_radialplot_container - margin_radialplot.left - margin_radialplot.right;
var height_radialplot = height_radialplot_container - margin_radialplot.top - margin_radialplot.bottom;

// var linegraph_containerWidth = document.getElementById("lineGraphContainer").clientWidth;
// var linegraph_containerHeight = document.getElementById("lineGraphContainer").clientHeight;
// var margin_lineGraph = {top: linegraph_containerHeight*0.1, right: linegraph_containerWidth*0.1, bottom: linegraph_containerHeight*0.2, left: linegraph_containerWidth*0.1};
// var width_lineGraph = linegraph_containerWidth - margin_lineGraph.left - margin_lineGraph.right;
// var height_lineGraph = linegraph_containerHeight - margin_lineGraph.top - margin_lineGraph.bottom;

function calculateWeeklyAverages(data) {
    const groupedByWeek = d3.group(data, d => d.Weeknr);

    const weeklyAverages = [];
    groupedByWeek.forEach((values, week) => {
        const averages = { Weeknr: week };
        features.forEach(feature => {
            const featureValues = values.map(d => d[feature]);
            const avg = d3.mean(featureValues);
            averages[feature] = avg;
        });
        weeklyAverages.push(averages);
    });
    return weeklyAverages;
}

function radialChart(divId, data, features) {
    const svg = d3
        .select(divId)
        .append("svg")
        .attr("width", width_radialplot)
        .attr("height", height_radialplot * 2.5)
        .attr("viewBox", "0 0 800 600")
        .append("g")
        .attr("transform", `translate(${width_radialplot / 1.5}, ${height_radialplot / 1.2})`);

    
    svg.append("circle")
        .attr("r", outerRadius)
        .style("fill", "darkslategrey");


    const angles = d3
        .scaleLinear()
        .domain([0, 51])
        .range([0, 2 * Math.PI]);

    const feature_range = d3
        .scaleLinear()
        .domain([0, 1])
        .range([innerRadius, outerRadius]);

    const colorScale = d3
        .scaleOrdinal()
        .domain(features)
        .range(d3.schemeTableau10);

        const grid = feature_range.ticks(5);
    svg.selectAll(".grid-circle")
        .data(grid)
        .enter()
        .append("circle")
        .classed("grid-circle", true)
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", d => feature_range(d))
        .attr("fill", "none")
        .attr("stroke", "#ccc")
        .attr("stroke-dasharray", "2,2");

    features.forEach(feature => {
        const featureLines = d3
            .lineRadial()
            .angle(d => angles(d.Weeknr - 1))
            .radius(d => feature_range(d[feature]))
            .curve(d3.curveCardinal);

        svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", colorScale(feature))
            .attr("stroke-width", 2)
            .attr("d", featureLines);

        svg.selectAll(`.dot-${feature}`)
            .data(data)
            .enter()
            .append("circle")
            .attr("class", `dot dot-${feature}`)
            .attr("cx", d => feature_range(d[feature]) * Math.sin(angles(d.Weeknr - 1)))
            .attr("cy", d => -feature_range(d[feature]) * Math.cos(angles(d.Weeknr - 1)))
            .attr("r", 3)
            .attr("fill", colorScale(feature));
    });



    const weeks = d3.range(0, 52);
    svg.selectAll(".week-label")
        .data(weeks)
        .enter()
        .append("text")
        .classed("week-label", true)
        .attr("x", d => 1.05 *feature_range(1) * Math.sin(angles(d)))
        .attr("y", d => -1.05 *feature_range(1) * Math.cos(angles(d)))
        .attr("dy", "0.3em")
        .attr("text-anchor", "middle")
        .text(d => d + 1)
        .style("font-size", "10px")
        .style("fill", "#666");


    // season lines and labels
    const seasons = [
        { name: "Spring", start: 11.5, end: 21.5 },
        { name: "Summer", start: 21.5, end: 35.5 },
        { name: "Autumn", start: 35.5, end: 49.5 },
        { name: "Winter", start: 49.5, end: 11.5 }
    ];

    seasons.forEach(season => {
        const startAngle = angles(season.start % 52);
        const endAngle = angles(season.end % 52);
        let middleAngle;
    
        // Special handling for Winter to ensure correct positioning
        if (season.name === "Winter") {
            middleAngle = angles((season.start + 52 + season.end) / 2 % 52);
        } else {
            middleAngle = (startAngle + endAngle) / 2;
        }
    
        [startAngle, endAngle].forEach(angle => {
            svg.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", outerRadius * Math.sin(angle))
                .attr("y2", -outerRadius * Math.cos(angle))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "5,5");
        });
    
        svg.append("text")
            .attr("x", (1.08*outerRadius + 25) * Math.sin(middleAngle))
            .attr("y", -(1.08*outerRadius + 25) * Math.cos(middleAngle))
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "black")
            .text(season.name);
    });


    svg.append("circle")
    .attr("r", innerRadius)
    .style("fill", "white");

    
    const legend = svg.append("g")
        .attr("transform", `translate(${-width_radialplot / 14}, ${-height_radialplot / 6 })`);

    features.forEach((feature, index) => {
        const legendItem = legend.append("g")
            .attr("transform", `translate(0, ${index * 20})`);

        legendItem.append("circle")
            .attr("r", 8)
            .attr("fill", colorScale(feature));

        legendItem.append("text")
            .attr("x", 10)
            .attr("y", 5)
            .text(feature)
            .style("font-size", "16px")
            .attr("alignment-baseline", "middle");
    });

}



var selectedYearRanges = window.selectedYearRanges; 
var selectedWeekRange = window.selectedWeekRange; 

// TO DO: check welke features we willen
const features = ["Danceability", "Energy", "Valence", "Acousticness", "Liveness"];
const innerRadius = 100;
const outerRadius = 250;

let globalData = [];

function loadData() {
    Promise.all([
        d3.csv('../data/top40_with_ids.csv'),
        d3.csv('../data/spotify_songs_with_ids.csv')
    ]).then(function([data_top40, data_spotifySongs]) {

        let spotifyMap = new Map();
        data_spotifySongs.forEach(d => {
            features.forEach(feature => {
                d[feature] = +d[feature];
            });
            spotifyMap.set(d.Song_ID, d);
        });

        data_top40.forEach(row => {
            row.Weeknr = +row.Weeknr;
            features.forEach(feature => {
                let spotifySong = spotifyMap.get(row.Song_ID);
                if (spotifySong) {
                    row[feature] = +spotifySong[feature];
                } else {
                    row[feature] = NaN;
                }
            });
        });

        globalData = [...data_spotifySongs, ...data_top40];
        globalData.sort((a, b) => a.Jaar - b.Jaar || a.Weeknr - b.Weeknr);

        updatePlot();
    });
}

function updatePlot() {
    selectedYearRanges.forEach((yearRange, idx) => {
        const filteredDataYears = globalData.filter(d =>
            d.Weeknr >= selectedWeekRange[0] && 
            d.Weeknr <= selectedWeekRange[1] && 
            d.Jaar >= yearRange[0] && 
            d.Jaar <= yearRange[1]
        );

        const weeklyAverages = calculateWeeklyAverages(filteredDataYears);

        d3.select(`#radial-plot`).html(""); 

        radialChart(`#radial-plot`, weeklyAverages, features);
        const yearRangeText = `${yearRange[0]} - ${yearRange[1]}`;
        d3.select("#year-range-display-radial").text(`Year Range: ${yearRangeText}`);
    });
}

// update when editing year & weeks
window.addEventListener('yearRangeUpdated', function () {
    document.getElementById("selectedYearRangesValue").innerText = JSON.stringify(window.selectedYearRanges);
    updatePlot();
});

window.addEventListener('weekRangeUpdated', function () {
    document.getElementById("selectedWeekRangeValue").innerText = JSON.stringify(window.selectedWeekRange);
    updatePlot();
});

d3.select("#next-radial").on("click", () => {
    window.selectedYearRanges.push(window.selectedYearRanges.shift()); 
    updatePlot();
});

d3.select("#prev-radial").on("click", () => {
    window.selectedYearRanges.unshift(window.selectedYearRanges.pop()); 
    updatePlot();
});

loadData();