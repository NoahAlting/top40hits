var selected_weeks = [1, 53];
var selection_features = true;
const features = ["Danceability", "Energy", "Valence", "Acousticness"];

const width = 600;
const height = 600;
const innerRadius = 100;
const outerRadius = 250;

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
  
      const combinedData = [...data_spotifySongs, ...data_top40];
      console.log(combinedData);
  
      if (selection_features) {
        const weeklyAverages = calculateWeeklyAverages(combinedData);
        radialChart(weeklyAverages, features);
      }
    });
  }

function calculateWeeklyAverages(data) {
  const groupedByWeek = d3.group(data, d => d.Weeknr);
  console.log(groupedByWeek)
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
  console.log(weeklyAverages)
  return weeklyAverages;
}

function radialChart(data, features) {
    const svg = d3.select("#radial-plot") // Select the #radial-plot container
      .append("svg") // Append an SVG element
      .attr("width", width) // Set the width of the SVG
      .attr("height", height); // Set the height of the SVG
  
    const angles = d3
      .scaleLinear()
      .domain(selected_weeks)
      .range([0, 2 * Math.PI]);
  
    const feature_range = d3
      .scaleLinear()
      .domain([0, 1])
      .range([innerRadius, outerRadius]);
  
    const colorScale = d3
      .scaleOrdinal()
      .domain(features)
      .range(d3.schemeDark2);
  
    data = data.filter(d => d.Weeknr && !isNaN(d.Weeknr));
  
    features.forEach(feature => {
      const featureLines = d3
        .lineRadial()
        .angle(d => angles(d.Weeknr))
        .radius(d => feature_range(d[feature]))
        .curve(d3.curveCardinal); 
  
      svg
        .append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", colorScale(feature))
        .attr("stroke-width", 2)
        .attr("d", featureLines);
  
      svg
        .selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => feature_range(d[feature]) * Math.sin(angles(d.Weeknr)))
        .attr("cy", d => -feature_range(d[feature]) * Math.cos(angles(d.Weeknr)))
        .attr("r", 3)
        .attr("fill", colorScale(feature));
    });
  
    const grid = feature_range.ticks(5);
    svg
      .selectAll(".grid-circle")
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
  
    const weeks = d3.range(1, 53);
    svg
      .selectAll(".week-label")
      .data(weeks)
      .enter()
      .append("text")
      .classed("week-label", true)
      .attr("x", d => feature_range(1) * Math.sin(angles(d)))
      .attr("y", d => -feature_range(1) * Math.cos(angles(d)))
      .attr("dy", "0.3em")
      .attr("text-anchor", "middle")
      .text(d => d)
      .style("font-size", "10px")
      .style("fill", "#666");
  }
  


loadData();
