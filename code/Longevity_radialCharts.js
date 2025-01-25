var longevity_radialChart_container = document.getElementById("longevityradialPlotContainer");
var width_longevity_radialChartContainer = longevity_radialChart_container.clientWidth;
var height_longevity_radialChartContainer = longevity_radialChart_container.clientHeight;
var margin_longevity_radialChart = {top: height_longevity_radialChartContainer*0.1, right: width_longevity_radialChartContainer*0.1, bottom: height_longevity_radialChartContainer*0.1, left: width_longevity_radialChartContainer*0.1,}
var width_longevity_radialChart = width_longevity_radialChartContainer - margin_longevity_radialChart.left - margin_longevity_radialChart.right;
var height_longevity_radialChart = height_longevity_radialChartContainer - margin_longevity_radialChart.top - margin_longevity_radialChart.bottom;

const innerRadius_longevity_radialChart = 5;
const outerRadius_longevity_radialChart = 100;

var categories = ["Short Hits", "Medium Hits", "Long Hits"];
function get_color_categories(label, labels) {
  var colorScale = d3
    .scaleSequential(d3.interpolateWarm)
    .domain([0, labels.length]);
  let index = labels.indexOf(label) + 1;
  return colorScale(index);
}

function loadAndProcess_FeaturesData_longevityRadialChart(filtered_data_input, selected_years) {
  const all_stats = [];
  selected_years.forEach((range_years) => {
    const mergedData = filtered_data_input
      .filter((row) => (+row.Jaar >= range_years[0] && +row.Jaar <= range_years[1]) || +row.Jaar == range_years[0])
      .map((row) => {
          let featureData = {};
          possible_features_songs.forEach((feature) => {
            const featureValue = row[feature];
            featureData[feature] = featureValue !== undefined ? parseFloat(featureValue) || null : null;
          });
          return {
            Song_ID: row.Song_ID,
            Jaar: parseInt(row.Jaar),
            Weeknr: parseInt(row.Weeknr),
            featureData: featureData,
          };
        });
    const longevity_information = d3.rollup(
      mergedData,
      (values) => ({
        maximum_amount_of_weeks: values.length,
        features: Object.fromEntries(
          possible_features_songs.map((feature) => [
            feature,
            values.length > 0 ? values[0].featureData[feature] : null, 
          ])
        ),
      }),
      (d) => d.Song_ID
    );
    
    function calculateStats(songs_inCategory, category_name) {
      const featureStats = {};
      possible_features_songs.forEach((feature) => {
        featureStats[feature] = {
          sum: 0,
          sumOfSquares: 0,
          count: 0,
        };
      });
      songs_inCategory.forEach((song) => {
        possible_features_songs.forEach((feature) => {
          const value = song.features[feature];
          if (value !== null && value !== undefined) {
            featureStats[feature].sum += value;
            featureStats[feature].sumOfSquares += value * value;
            featureStats[feature].count += 1;
          }
        });
      });

      const stats = [];
      Object.keys(featureStats).forEach((feature, index) => {
        const { sum, sumOfSquares, count } = featureStats[feature];
        if (count > 0) {
          const mean = sum / count;
          const variance = sumOfSquares / count - mean * mean;
          const stdDev = Math.sqrt(variance);

          stats.push({
            category: category_name,
            feature: feature,
            avg: mean,
            min: Math.max(0, mean - stdDev),
            max: Math.min(1, mean + stdDev),
            angle: 2 * Math.PI * (index / possible_features_songs.length),
          });
        }
      });
      return stats;
    }

    const groupedByLongevity = d3.rollup(
      Array.from(longevity_information.entries()).map(([Song_ID, data]) => ({
        Song_ID,
        ...data,
      })),
      (group) => group,
      (d) => d.maximum_amount_of_weeks
    );

    const sortedGroups = Array.from(groupedByLongevity.entries()).sort(
      (a, b) => a[0] - b[0]
    );
    const songs_shortHits = [];
    const songs_mediumHits = [];
    const songs_longHits = [];
    let totalSongs = 0;
    sortedGroups.forEach((group) => {
      totalSongs += group[1].length;
    });
    let targetSize = Math.ceil(totalSongs / 3);
    let currentCategory = songs_shortHits;
    sortedGroups.forEach(([weeks, group]) => {
      if (
        currentCategory.length > targetSize &&
        currentCategory !== songs_longHits
      ) {
        if (currentCategory === songs_shortHits) {
          currentCategory = songs_mediumHits;
          targetSize = Math.ceil((totalSongs - songs_shortHits.length) / 2);
        } else {
          currentCategory = songs_longHits;
        }
      }
      currentCategory.push(...group);
    });

    const stats_short = calculateStats(songs_shortHits, "Short Hits");
    const stats_medium = calculateStats(songs_mediumHits, "Medium Hits");
    const stats_long = calculateStats(songs_longHits, "Long Hits");

    all_stats.push({
      range: range_years,
      [categories[0]]: stats_short,
      [categories[1]]: stats_medium,
      [categories[2]]: stats_long,
    });
  });
  return all_stats;
}

function loadAndProcess_GenresData_longevityRadialChart(
  filtered_data_input,
  selected_years
) {
  const stats_all = [];
  selected_years.forEach((range_years) => {
    let range_year_data = [];
    possible_genres.concat(remaining_genres).forEach((genre) => {
      let genre_data = filtered_data_input[genre];
      let genre_data_year_range = genre_data.filter(obj => 
          (+obj.Jaar >= range_years[0] && +obj.Jaar <= range_years[1]) || +obj.Jaar == range_years[0]
      );
      
      let songCounts = {};
      genre_data_year_range.forEach(song => {
          let songID = song.Song_ID;
          if (!songCounts[songID]) {
              songCounts[songID] = {songID, maximum_amount_of_weeks: 0, genre };
          }
          songCounts[songID].maximum_amount_of_weeks++;
      });
  
      range_year_data.push(...Object.values(songCounts));
  });   
    function calculateStats(songs_inCategories, category_name) {
      var stats = [];
      let total_songs_in_category = songs_inCategories.length;
      possible_genres.concat(remaining_genres).forEach((genre, index) => {
        let genre_songs = songs_inCategories.filter(obj => obj.genre === genre);
        let percentage = genre_songs.length / total_songs_in_category * 100;
        if (genre_songs.length != 0){
          stats.push({
            category: category_name,
            genre: genre,
            count: percentage,
            angle: 2 * Math.PI * (index / (possible_genres.concat(remaining_genres).length)),
          });
        }
        else{
          stats.push({
            category: category_name,
            genre: genre,
            count: 0,
            angle: 2 * Math.PI * (index / (possible_genres.concat(remaining_genres).length)),
          });
        }

      })
      return stats;
    }
    
    const groupedByLongevity = d3.rollup(
      range_year_data, 
      (group) => group, 
      (d) => d.maximum_amount_of_weeks 
    );

    const sortedGroups = Array.from(groupedByLongevity.entries()).sort(
      (a, b) => a[0] - b[0]
    );
    const songs_shortHits = [];
    const songs_mediumHits = [];
    const songs_longHits = [];
    let totalSongs = 0;
    sortedGroups.forEach((group) => {
      totalSongs += group[1].length;
    });
    let targetSize = Math.ceil(totalSongs / 3);
    let currentCategory = songs_shortHits;
    sortedGroups.forEach(([weeks, group]) => {
      if (
        currentCategory.length > targetSize &&
        currentCategory !== songs_longHits
      ) {
        if (currentCategory === songs_shortHits) {
          currentCategory = songs_mediumHits;
          targetSize = Math.ceil((totalSongs - songs_shortHits.length) / 2);
        } else {
          currentCategory = songs_longHits;
        }
      }
      currentCategory.push(...group);
    });

    const stats_short = calculateStats(songs_shortHits, "Short Hits");
    const stats_medium = calculateStats(songs_mediumHits, "Medium Hits");
    const stats_long = calculateStats(songs_longHits, "Long Hits");

    stats_all.push({
      range: range_years,
      [categories[0]]: stats_short,
      [categories[1]]: stats_medium,
      [categories[2]]: stats_long,
    });
  });
  return stats_all;
}

function createInteractiveGraph_Features_longevityRadialChart(
  data,
  chartContainer,
  labels,
  radiusScale,
  function_colors,
  font_size
) {
  const radialGrid = d3.range(
    innerRadius_longevity_radialChart,
    outerRadius_longevity_radialChart,
    (outerRadius_longevity_radialChart - innerRadius_longevity_radialChart) / 5
  );
  chartContainer
    .selectAll(".grid")
    .data(radialGrid)
    .enter()
    .append("circle_radialChart")
    .attr("class", "grid")
    .attr("r", (d) => d)
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.3);
  chartContainer
    .selectAll(".axis")
    .data(data[labels[0]])
    .enter()
    .append("line")
    .attr("class", "graph-axis")
    .attr("x1", (d) => radiusScale(0) * Math.sin(d.angle))
    .attr("y1", (d) => -radiusScale(0) * Math.cos(d.angle))
    .attr("x2", (d) => radiusScale(1) * Math.sin(d.angle))
    .attr("y2", (d) => -radiusScale(1) * Math.cos(d.angle));
  chartContainer
    .selectAll(".label")
    .data(data[labels[0]])
    .enter()
    .append("text")
    .attr("class", "label-text")
    .style("font-size", `${14 + font_size}px`)
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
    .text((d) => d.feature);

  labels.forEach((label) => {
    const filteredStats = data[label];
    const radialLine = d3
      .lineRadial()
      .angle((d) => d.angle)
      .radius((d) => radiusScale(d.avg))
      .curve(d3.curveLinearClosed);
    chartContainer
      .append("path")
      .datum(filteredStats)
      .attr("d", radialLine)
      .attr("stroke", function_colors(label, labels))
      .attr("fill", "none")
      .attr("opacity", 0.8)
      .attr("stroke-width", 4);
  });

  function activateStdArea(event) {
    const isChecked = event.target.checked;
    labels.forEach((label) => {
      const filteredStats = data[label];
      var areaGenerator_raidalchart = d3
        .areaRadial()
        .angle((d) => d.angle)
        .innerRadius((d) => radiusScale(d.min))
        .outerRadius((d) => radiusScale(d.max))
        .curve(d3.curveCardinalClosed);
      var std_radialArea = chartContainer
        .append("path")
        .attr("class", "area_radial");
      if (isChecked) {
        std_radialArea
          .datum(filteredStats)
          .attr("d", areaGenerator_raidalchart)
          .attr("opacity", 0.2)
          .attr("fill", function_colors(label, labels));
      } else {
        chartContainer.selectAll(".area_radial").remove();
      }
    });
  }
  d3.select("#myCheckbox").on("change", activateStdArea);
}

function createInteractiveGraph_GenresData_longevityRadialChart(
  data,
  chartContainer,
  labels,
  radiusScale,
  function_colors,
  maxCount,
  font_size
  ) {
  const radialGrid = d3.range(
    innerRadius_longevity_radialChart,
    outerRadius_longevity_radialChart,
    (outerRadius_longevity_radialChart - innerRadius_longevity_radialChart) / 5
  );

  chartContainer
    .selectAll(".grid")
    .data(radialGrid)
    .enter()
    .append("circle_radialChart")
    .attr("class", "grid")
    .attr("r", (d) => d)
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("opacity", 0.3);
  chartContainer
    .selectAll(".axis")
    .data(data[labels[0]])
    .enter()
    .append("line")
    .attr("class", "graph-axis")
    .attr("x1", (d) => radiusScale(0) * Math.sin(d.angle))
    .attr("y1", (d) => -radiusScale(0) * Math.cos(d.angle))
    .attr("x2", (d) => radiusScale(maxCount * 1.1) * Math.sin(d.angle))
    .attr("y2", (d) => -radiusScale(maxCount * 1.1) * Math.cos(d.angle));
  chartContainer
    .selectAll(".label")
    .data(data[labels[0]])
    .enter()
    .append("text")
    .attr("class", "label-text")
    .style("font-size", `${14 + font_size}px`)
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
    .text((d) => d.genre);

  labels.forEach((label) => {
    const filteredStats = data[label];
    const radialLine = d3
      .lineRadial()
      .angle((d) => d.angle)
      .radius((d) => radiusScale(d.count))
      .curve(d3.curveLinearClosed);
    chartContainer
      .append("path")
      .datum(filteredStats)
      .attr("d", radialLine)
      .attr("stroke", function_colors(label, labels))
      .attr("fill", "none")
      .attr("opacity", 0.8)
      .attr("stroke-width", 4);
  });

}

function add_legend(chartContainer, labels) {
  var legendGroup = chartContainer.append("g").attr("class", "legendGroup");

  var legendItems = legendGroup
    .selectAll(".legendItem")
    .data(labels)
    .enter()
    .append("g")
    .attr("class", "legendItem")
    .attr("transform", (d, i) => `translate(${i * 110}, 0)`);

  legendItems
    .append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", (d) => get_color_categories(d, labels))
    .attr("x", 0)
    .attr("y", 0)
    .attr("stroke", "black");

  legendItems
    .append("text")
    .attr("class", "legend-text")
    .attr("x", 12)
    .attr("y", 10)
    .text((d) => d);
  var legendWidth = legendItems.size();
  legendGroup.attr(
    "transform",
    `translate(${
      -(width_longevity_radialChart - legendWidth) * 0.3
    } , ${height_longevity_radialChart * 0.45})`
  );
}

function update_LongevityRadialGraph(filtered_data_input) {
  // Clear the entire chart container to allow for new charts
  d3.select("#longevity_radialChart").selectAll("*")
    .transition()
    .duration(50)
    .style("opacity", 0)
    .remove();
  const stdButtonContainer = d3.select("#std_button_id");
  stdButtonContainer.selectAll("*").remove();

  const selected_years = window.selectedYearRanges
    .sort((a, b) => a[0] - b[0])
    .map((range) => (range[0] === range[1] ? [range[0]] : range));
  const selection_features = window.selectedType;
  const singleRange = selected_years.length === 1;
  const numCharts = singleRange ? 1 : 3;

  const chartContainers = []; 

  if (selection_features === "features") {
    const radiusScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([
        innerRadius_longevity_radialChart,
        outerRadius_longevity_radialChart,
      ]);
    const stdButton = stdButtonContainer
      .append("label")
      .text("add standard deviation area")
      .style("font-size", "12px")
      .append("input")
      .attr("type", "checkbox")
      .attr("id", "myCheckbox");

    const data = loadAndProcess_FeaturesData_longevityRadialChart(
      filtered_data_input,
      selected_years
    );

    for (let i = 0; i < numCharts; i++) {
      let indexed_data = {};
      let labels = [];
      function_colors = [];
      let size_graph = 0;
      let font_size = 0;
      if (numCharts === 3) {
        data.forEach((stat) => {
          if (!indexed_data[stat.range]) {
            indexed_data[stat.range] = [];
          }
          stat[categories[i]].forEach((featureData) => {
            indexed_data[stat.range].push({
              category: featureData.category,
              feature: featureData.feature,
              avg: featureData.avg,
              min: featureData.min,
              max: featureData.max,
              angle: featureData.angle,
            });
          });
        });
        labels = selected_years;
        function_colors = get_color_yearRange;
        size_graph = 0.6;
        font_size = 4;
      } else {
        let stat = data[0];
        categories.forEach((hitType) => {
          indexed_data[hitType] = [];
          stat[hitType].forEach((featureData) => {
            indexed_data[hitType].push({
              category: featureData.category,
              feature: featureData.feature,
              avg: featureData.avg,
              min: featureData.min,
              max: featureData.max,
              angle: featureData.angle,
            });
          });
        });
        labels = categories;
        function_colors = get_color_categories;
        size_graph = 1;
        font_size = 0;
      }
      var chartX = 0;
      var chartY = -0.1;
      if (numCharts == 3){
        if (i == 0){
          var chartX = -0.1;
          var chartY = 0.05;
        }
        if (i == 1){
          var chartX = 0.1;
          var chartY = 0.05;
        }
        if (i == 2){
          var chartX = 0;
          var chartY = -0.1;
        }
      }
      const svgContainer = d3
        .select("#longevity_radialChart")
        .append("svg")
        .attr("width", 0.75 * width_longevity_radialChart * size_graph)
        .attr("height", height_longevity_radialChart * size_graph)
        .attr("viewBox", [
            -width_longevity_radialChart / 2.5,
            -height_longevity_radialChart / 3,
            width_longevity_radialChart * 0.8,
            height_longevity_radialChart * 0.6,
        ])
        .attr(
          "transform",
          `translate(${width_longevity_radialChart * chartX}, ${height_longevity_radialChart * chartY})`
      );

      svgContainer
        .append("text")
        .attr("x", 0)
        .attr("y", -height_longevity_radialChart * size_graph * 0.8)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("fill", "white")
        .style("font-weight", "bold")
        .text(
          `Chart for ${
            singleRange ? selected_years[0].join(" - ") : categories[i]
          }`
        );
        

      const chartContainer = svgContainer
        .append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");

      createInteractiveGraph_Features_longevityRadialChart(
        indexed_data,
        chartContainer,
        labels,
        radiusScale,
        function_colors,
        font_size
      );

      if (numCharts == 1) {
        add_legend(chartContainer, labels);
      }

      chartContainers.push({
        data: indexed_data,
        container: chartContainer,
        labels,
      });
    }
    // Centralize the event listener for the checkbox
    d3.select("#myCheckbox")
      .style("width", "10px")
      .style("height", "10px")
      .on("change", function (event) {
      const isChecked = event.target.checked;
      chartContainers.forEach(({ data, container, labels }) => {
        container.selectAll(".area_radial").remove();
        if (isChecked) {
          labels.forEach((label) => {
            const filteredStats = data[label];
            const areaGenerator = d3
              .areaRadial()
              .angle((d) => d.angle)
              .innerRadius((d) => radiusScale(d.min))
              .outerRadius((d) => radiusScale(d.max))
              .curve(d3.curveCardinalClosed);
            container
              .append("path")
              .datum(filteredStats)
              .attr("d", areaGenerator)
              .attr("class", "area_radial")
              .attr("opacity", 0.2)
              .attr("fill", function_colors(label, labels));
          });
        }
      });
    });
  } else {
    const data = loadAndProcess_GenresData_longevityRadialChart(
      filtered_data_input,
      selected_years
    );
    
    for (let i = 0; i < numCharts; i++) {
      let indexed_data = {};
      let labels = [];
      function_colors = [];
      let size_graph = 0;
      let font_size = 0;
      let max_count = 0;
      if (numCharts === 3) {
        data.forEach((stat) => {
          if (!indexed_data[stat.range]) {
            indexed_data[stat.range] = [];
          }
          stat[categories[i]].forEach((genreData) => {
            indexed_data[stat.range].push({
              category: genreData.category,
              genre: genreData.genre,
              count: genreData.count,
              angle: genreData.angle,
            });
            if (typeof genreData.count === "number" && genreData.count > max_count) {
              max_count = genreData.count;
          }
          });
        });
        labels = selected_years;
        function_colors = get_color_yearRange;
        size_graph = 0.6;
        font_size = 4;
      } else {
        let stat = data[0];
        categories.forEach((hitType) => {
          indexed_data[hitType] = [];
          stat[hitType].forEach((genreData) => {
            indexed_data[hitType].push({
              category: genreData.category,
              genre: genreData.genre,
              count: genreData.count,
              angle: genreData.angle,
            });
            if (typeof genreData.count === "number" && genreData.count > max_count) {
              max_count = genreData.count;
          }
          });
        });
        labels = categories;
        function_colors = get_color_categories;
        size_graph = 1;
        font_size = 0;
      }
      var chartX = 0;
      var chartY = -0.1;
      if (numCharts == 3){
        if (i == 0){
          var chartX = -0.1;
          var chartY = 0.05;
        }
        if (i == 1){
          var chartX = 0.1;
          var chartY = 0.05;
        }
        if (i == 2){
          var chartX = 0;
          var chartY = -0.1;
        }
      }
    const radiusScale = d3
      .scaleLinear()
      .domain([0, max_count * 1.1])
      .range([
        innerRadius_longevity_radialChart,
        outerRadius_longevity_radialChart,
      ]);

    const svgContainer = d3
        .select("#longevity_radialChart")
        .append("svg")
        .attr(
          "width",
          0.75 *  (width_longevity_radialChart) *
            size_graph
        )
        .attr(
          "height",
          (height_longevity_radialChart) *
            size_graph
        )
        .attr("viewBox", [
          -width_longevity_radialChart / 2.5,
          -height_longevity_radialChart / 3,
          width_longevity_radialChart * 0.8,
          height_longevity_radialChart * 0.6,
        ])
        .attr(
          "transform",
          `translate(${width_longevity_radialChart * chartX}, ${height_longevity_radialChart * chartY})`
        );

        svgContainer
        .append("text")
        .attr("x", 0)
        .attr("y", -height_longevity_radialChart * size_graph * 0.8)
        .attr("text-anchor", "middle")
        .style("font-size", "22px")
        .style("fill", "white")
        .style("font-weight", "bold")
        .text(
          `Chart for ${
            singleRange ? selected_years[0].join(" - ") : categories[i]
          }`
        );
      const chartContainer = svgContainer
        .append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round");
    createInteractiveGraph_GenresData_longevityRadialChart(
      indexed_data,
      chartContainer,
      labels,
      radiusScale,
      function_colors,
      max_count,
      font_size
    );
    if (numCharts == 1) {
      add_legend(chartContainer, labels);
      }
    }
  }
}