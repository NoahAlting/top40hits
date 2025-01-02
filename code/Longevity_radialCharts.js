var selected_years = [1990, 1991, 1992];
var selected_weeks = [1, 53];
var max_top = [1]; 
var selected_feature_or_genre = "Acousticness";
var selection_features = true;
var margin_longevity_radialChart = {
    top: 30,
    right: 30,
    bottom: 150,
    left: 60,
  },
  width_longevity_radialChart = 460 - margin_longevity_radialChart.left - margin_longevity_radialChart.right,
  height_longevity_radialChart = 400 - margin_longevity_radialChart.top - margin_longevity_radialChart.bottom;
const innerRadius_longevity_radialChart = 5;
const outerRadius_longevity_radialChart = 100;
const features_songs = ["Danceability", "Acousticness", "Energy", "Liveness", "Valence", "Speechiness"];
var categories = ["Short Hits", "Medium Hits", "Long Hits"];

var threshold_shortHits = 5;
var threshold_mediumHits = 10;

function get_color_longevityRadialChart(category) {
  var colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, 2]);
  let index = categories.indexOf(category);
  return colorScale(index);
}

selected_years.sort((a, b) => a - b);

const longevity_radialChart = d3
  .select("#longevity_radialChart")
  .append("svg")
  .attr(
    "width",
    width_longevity_radialChart +
      margin_longevity_radialChart.left +
      margin_longevity_radialChart.right
  )
  .attr(
    "height",
    height_longevity_radialChart +
      margin_longevity_radialChart.top +
      margin_longevity_radialChart.bottom
  )
  .attr("viewBox", [
    -width_longevity_radialChart / 2,
    -height_longevity_radialChart / 2,
    width_longevity_radialChart,
    height_longevity_radialChart,
  ])
  .append("g")
  .attr("stroke-linejoin", "round")
  .attr("stroke-linecap", "round");

function get_color_longevity_radialChart(year) {
  var colorScale = d3
    .scaleSequential(d3.interpolateViridis)
    .domain([0, selected_years.length - 1]);
  let index = selected_years.indexOf(year);
  return colorScale(index);
}

function loadData_and_Create_longevityRadialChart() {
  d3.csv("../data/spotify_songs_with_ids.csv").then(function (
    data_spotifySongs
  ) {
    data_spotifySongs.forEach((row) => {
      row[selected_feature_or_genre] = +row[selected_feature_or_genre];
    });

    d3.csv("../data/top40_with_ids.csv").then(function (data_top40) {
      if (selection_features == true) {
        const data_processed = loadAndProcess_FeaturesData_longevityRadialChart(
          data_spotifySongs,
          data_top40
        );
        createInteractiveGraph_Features_longevityRadialChart(
          data_processed,
          categories
        );
      } else {
        const data_processed = loadAndProcess_GenresData_longevityRadialChart(
          data_spotifySongs,
          data_top40
        );
        createInteractiveGraph_Genres_longevityRadialChart(data_processed);
      }
    });
  });
}

function loadAndProcess_FeaturesData_longevityRadialChart(spotifySongs, top40) {
    const mergedData = top40
        .filter((row) => selected_years.includes(+row.Jaar))
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
    console.log([songs_shortHits, songs_mediumHits, songs_longHits]);
    return stats_all;
}

function loadAndProcess_GenresData_longevityRadialChart(spotifySongs, top40) {}

function createInteractiveGraph_Features_longevityRadialChart(data) {
    const radiusScale = d3
        .scaleLinear()
        .domain([0, 1])
        .range([
        innerRadius_longevity_radialChart,
        outerRadius_longevity_radialChart,
        ]);
    const radialGrid = d3.range(
        innerRadius_longevity_radialChart,
        outerRadius_longevity_radialChart,
        (outerRadius_longevity_radialChart - innerRadius_longevity_radialChart) / 5
    );
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
        .attr(
        "x",
        (d) => (outerRadius_longevity_radialChart + 10) * Math.sin(d.angle)
        )
        .attr(
        "y",
        (d) => -(outerRadius_longevity_radialChart + 10) * Math.cos(d.angle)
        )
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
    const radialArea = d3
        .areaRadial()
        .angle((d) => d.angle)
        .innerRadius((d) => radiusScale(d.min))
        .outerRadius((d) => radiusScale(d.max))
        .curve(d3.curveCardinalClosed);
    longevity_radialChart
        .append("path")
        .datum(filteredStats)
        .attr("d", radialArea)
        .attr("fill", get_color_longevityRadialChart(category))
        .attr("opacity", 0.2);
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

function createInteractiveGraph_GenresData_longevityRadialChart(data) {}

loadData_and_Create_longevityRadialChart();
