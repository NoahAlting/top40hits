
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

function radialChart(divId, data, features, title) {
    const svg = d3
        .select(divId)
        .append("svg")
        .attr("width", width + 100)
        .attr("height", height + 100)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    
    svg.append("circle")
        .attr("r", outerRadius)
        .style("fill", "darkgrey");


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
        .range(d3.schemeDark2);

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

  
    const weeks = d3.range(0, 52);
    svg.selectAll(".week-label")
        .data(weeks)
        .enter()
        .append("text")
        .classed("week-label", true)
        .attr("x", d => feature_range(1) * Math.sin(angles(d)))
        .attr("y", d => -feature_range(1) * Math.cos(angles(d)))
        .attr("dy", "0.3em")
        .attr("text-anchor", "middle")
        .text(d => d + 1)
        .style("font-size", "10px")
        .style("fill", "#666");


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
    
        // Draw season start and end lines
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
    
        // Draw season labels
        svg.append("text")
            .attr("x", (outerRadius + 25) * Math.sin(middleAngle))
            .attr("y", -(outerRadius + 25) * Math.cos(middleAngle))
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "black")
            .text(season.name);
    });

    svg.append("circle")
    .attr("r", innerRadius)
    .style("fill", "white");

    // Add title
    svg.append("text")
        .attr("x", 0)
        .attr("y", -outerRadius - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(title);
}



var selectedYearRanges = window.selectedYearRanges; 
var selectedWeekRange = window.selectedWeekRange; 
// TO DO: check welke features we willen
const features = ["Danceability", "Energy", "Valence", "Acousticness"];
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

        // clear previous
        d3.select(`#radial-plot`).html(""); 

        // title
        radialChart(`#radial-plot`, weeklyAverages, features, 
            `Radial Chart: Years ${yearRange[0]} - ${yearRange[1]} Weeks ${selectedWeekRange[0]} - ${selectedWeekRange[1]}`);
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