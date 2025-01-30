// Creating the radial plot: Weekly Scores All Features Averaged over a range

// Define the feature you want to display
const features = ["Danceability", "Acousticness", "Energy", "Valence", "Loudness", "Tempo"];
// Define the size of the circle
const innerRadius = 100;
const outerRadius = 250;

var selectedYearRanges = window.selectedYearRanges;
var selectedWeekRange = window.selectedWeekRange;
let globalData = [];

let global_data = []
const sortedYearRanges = window.selectedYearRanges.sort((a, b) => a[0] - b[0]);

// Plot size
var width_radialplot_container = document.getElementById("radial_plots").clientWidth / 0.6;
var height_radialplot_container = document.getElementById("radial_plots").clientHeight / 1.6;
var margin_radialplot = { top: height_radialplot_container * 0.2, right: width_radialplot_container * 0.1, bottom: height_radialplot_container * 0.1, left: width_radialplot_container * 0.1 };
var width_radialplot = width_radialplot_container - margin_radialplot.left - margin_radialplot.right;
var height_radialplot = height_radialplot_container - margin_radialplot.top - margin_radialplot.bottom;


// =================================================================================================================================

// Create info button
function createinfobutton_radial() {
    createInfoButtonWithTooltip(
        "radial_plots",
        "Feature Values During the Year",
        "This radial plot shows the average feature value of the songs in the top 40 for each week of the year.",
        "Distance from center: feature value, between 0 and 1",
        "Circumference: week of the year",
        "Points, Lines",
        "Position, Colour hue",
        "The plot updates based on the year and week range.",
        "right"
    );
}

let infoButtonExists_radial = true;
createinfobutton_radial();

window.addEventListener("typeUpdated", function () {
    if (window.selectedType == "features") {
        if (!infoButtonExists_radial) {
            createinfobutton_radial();
            infoButtonExists_radial = true;
        }
    } else {
        if (infoButtonExists_radial) {
            removeButtonByContainerId("radial_plots");
            infoButtonExists_radial = false;
        }
    }
});



// Process the input data and add the weekly average feature values
function loadAndProcess_FeaturesData_radial(filtered_data_input, range_years, selectedGenre, possible_features_songs) {
    const plotData = [];

    possible_features_songs.forEach(feature => {

        // Filter and map the data for the given year range
        const mergedData = filtered_data_input
            .filter(row => +row.Jaar >= range_years[0] && +row.Jaar <= range_years[1])
            .map(row => {
                return {
                    Song_ID: row.Song_ID,
                    Jaar: +row.Jaar,
                    Weeknr: +row.Weeknr,
                    feature_value: row[feature],
                    feature: feature
                };
            });

        // calculate the weekly averages 
        const weeklyAverages = d3.rollup(
            mergedData,
            values => {
                const mean = d3.mean(values, v => v.feature_value);
                return { mean_week: mean };
            },
            d => d.Weeknr
        );

        weeklyAverages.forEach((values, week) => {
            plotData.push({
                year_range: range_years,
                week: week,
                avgValue: values.mean_week,
                feature: feature
            });
        });
    });

    plotData.sort((a, b) => {
        if (a.year_range[0] !== b.year_range[0]) {
            return a.year_range[0] - b.year_range[0];
        }
        if (a.feature !== b.feature) {
            return a.feature.localeCompare(b.feature);
        }
        return a.week - b.week;
    });
    return plotData;
}


// Update the plot 
function update_radial_features(filtered_data_input) {
    console.log("update", window.selectedYearRanges, window.selectedRange, window.lastAdded);
    global_data = filtered_data_input;
    const selectedYearRanges = window.selectedYearRanges.sort((a, b) => a[0] - b[0]);
    const header_linegraph = d3.select("#heading-container-radial-year");

    var currentYearRange = window.lastAdded;
    if (selectedYearRanges.length != 0){
        if (currentYearRange.length == 0){
            currentYearRange = selectedYearRanges[0];
        }
        else if (!selectedYearRanges.includes(currentYearRange)){
            console.log("update2", currentYearRange, selectedYearRanges);
            currentYearRange = selectedYearRanges[0];
        }
        header_linegraph.html(`Weekly Scores All Features Averaged over <br> ${currentYearRange[0]} - ${currentYearRange[1]}`);
    }
    else{
        header_linegraph.html(`No year ranges selected.`);
    }
    const selectedGenre = window.selectedGenre;
    const data = loadAndProcess_FeaturesData_radial(filtered_data_input, currentYearRange, selectedGenre, possible_features_songs);

    d3.select("#radial-plot").html("");
    createInteractiveGraph_Features_radial("#radial-plot", data, possible_features_songs);

}

// Update the plot based on the new range
window.addEventListener("selectedRangeUpdated", function () {
    var currentYearRange = window.lastAdded;
    if (window.selectedType == "features") {
        const header_linegraph = d3.select("#heading-container-radial-year");
        if (window.selectedRange.length == 0) {
            if (currentYearRange.length == 0){
                currentYearRange = selectedYearRanges[0];
            }
            if (currentYearRange.length != 0){
                header_linegraph.html(`Weekly Scores All Features Averaged over <br> ${currentYearRange[0]} - ${currentYearRange[1]}`);
            }
            else{
                header_linegraph.html(`No year ranges selected.`);
            }
        }
        else{  
            const selectedRange = window.selectedRange;
            currentYearRange = selectedRange;
            if (window.selectedRange[0] == window.selectedRange[1]) {
                header_linegraph.html(`Weekly Scores All Features Averaged over <br> ${window.selectedRange[0]}`);
            }
            else if (window.selectedRange.length == 2) {
                header_linegraph.html(`Weekly Scores All Features Averaged over <br> ${window.selectedRange[0]} - ${window.selectedRange[1]}`);
            }
        } 
        const selectedGenre = window.selectedGenre;
        const data = loadAndProcess_FeaturesData_radial(global_data, currentYearRange, selectedGenre, possible_features_songs);
        d3.select("#radial-plot").html("");
        createInteractiveGraph_Features_radial("#radial-plot", data, possible_features_songs);
    }
});


// Create the plot
function createInteractiveGraph_Features_radial(divId, data, features) {
    const svg = d3
        .select(divId)
        .append("svg")
        .attr("width", width_radialplot)
        .attr("height", height_radialplot * 4)
        .append("g")
        .attr("transform", `translate(${margin_radialplot.left * 4}, ${margin_radialplot.top * 4.5})`);


    svg.append("circle")
        .attr("r", outerRadius)
        .style("fill", "darkslategray");


    const angles = d3
        .scaleLinear()
        .domain([0, 53])
        .range([0, 2 * Math.PI]);

    const feature_range = d3
        .scaleLinear()
        .domain([0, 1])
        .range([innerRadius, outerRadius]);

    const colorScale = d3
        .scaleOrdinal()
        .domain(features)
        .range(d3.schemeTableau10);

    // Background grid
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

    // Axis label
    svg.selectAll(".grid-label")
        .data(grid)
        .enter()
        .append("text")
        .classed("grid-label", true)
        .attr("x", 0)
        .attr("y", d => -feature_range(d)) 
        .attr("dy", "-0.3em")
        .attr("dx", "-2.0em")
        .attr("text-anchor", "left")
        .text(d => d.toFixed(1)) 
        .style("font-size", "12px")
        .style("fill", "#c4c4c4");

    features.forEach(feature => {

        // Create the lines and dots per feature
        const featureData = data.filter(d => d.feature === feature);

        const featureLines = d3
            .lineRadial()
            .angle(d => angles(d.week - 1))
            .radius(d => feature_range(d.avgValue))
            .curve(d3.curveCardinal);

        svg.append("path")
            .datum(featureData)
            .attr("fill", "none")
            .attr("stroke", colorScale(feature))
            .attr("stroke-width", 2)
            .attr("d", featureLines);

        svg.selectAll(`.dot-${feature}`)
            .data(featureData)
            .enter()
            .append("circle")
            .attr("class", `dot dot-${feature}`)
            .attr("cx", d => feature_range(d.avgValue) * Math.sin(angles(d.week - 1)))
            .attr("cy", d => -feature_range(d.avgValue) * Math.cos(angles(d.week - 1)))
            .attr("r", 3)
            .attr("fill", colorScale(feature))
            // Tooltip
            .on("mouseover", function (event, d) {
                tooltip
                    .style("opacity", 1)
                    .html(`<strong>Feature:</strong> ${d.feature}<br><strong>Week:</strong> ${d.week}<br><strong>Value:</strong> ${d.avgValue.toFixed(2)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);
            });
    });

    // Week labels
    const weeks = d3.range(0, 53);
    svg.selectAll(".week-label")
        .data(weeks)
        .enter()
        .append("text")
        .classed("week-label", true)
        .attr("x", d => 1.07 * feature_range(1) * Math.sin(angles(d)))
        .attr("y", d => -1.07 * feature_range(1) * Math.cos(angles(d)))
        .attr("dy", "0.3em")
        .attr("text-anchor", "middle")
        .text(d => (d === 52 ? "" : d + 1))
        .style("font-size", "10px")
        .style("fill", "#c4c4c4");

        // axis label
        const arcPath = svg.append("path")
        .attr("id", "week-label-arc")
        .attr("d", d3.arc()({
            innerRadius: feature_range(1) + 15, 
            outerRadius: feature_range(1) + 35,
            startAngle: -Math.PI / 2, 
            endAngle: Math.PI / 2 
        }))
        .style("fill", "none")
        .style("stroke", "none");
    
    
    svg.append("text")
        .append("textPath")
        .attr("href", "#week-label-arc")
        .attr("startOffset", "30%") 
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#c4c4c4")
        .text("Week number");
        
    // season lines and labels
    const seasons = [
        { name: "Spring", start: 0, end: 12.5 },
        { name: "Summer", start: 12.5, end: 25.5 },
        { name: "Autumn", start: 25.5, end: 38.5 },
        { name: "Winter", start: 38.5, end: 52 }
    ];

    seasons.forEach(season => {
        const startAngle = angles(season.start % 52);
        const endAngle = angles(season.end % 52);
        let middleAngle;

        if (season.name === "Summer") {
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
                .attr("stroke", "#ccc")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "5,5");
        });

        svg.append("text")
            .attr("x", (1.1 * outerRadius + 25) * Math.sin(middleAngle))
            .attr("y", -(1.1 * outerRadius + 25) * Math.cos(middleAngle))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("fill", "#c4c4c4")
            .text(season.name);
    });


    svg.append("circle")
        .attr("r", innerRadius)
        .style("fill", "#2c2c3c");

    features = ["Danceability", "Acousticness", "Energy", "Valence", "Loudness", "Tempo"]

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("text-align", "left")
        .style("padding", "8px")
        .style("font-size", "12px")
        .style("background", "rgba(0, 0, 0, 0.7)")
        .style("color", "#fff")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Create the legend
    const legend = svg.append("g")
        .attr("transform", `translate(${-width_radialplot / 15}, ${-height_radialplot * 0.25})`);

    features.forEach((feature, index) => {
        const legendItem = legend.append("g")
            .attr("transform", `translate(0, ${index * 20})`);

        legendItem.append("circle")
            .attr("r", 8)
            .attr("fill", colorScale(feature));

        legendItem.append("text")
            .attr("class", "legend-text")
            .attr("x", 10)
            .attr("y", 5)
            .text(feature)
            .style("font-size", "15px")
    });

}
