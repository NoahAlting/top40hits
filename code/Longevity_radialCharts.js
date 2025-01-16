var margin_longevity_radialChart = {top: 30, right: 30, bottom: 150, left: 60,},
  width_longevity_radialChart = 460 - margin_longevity_radialChart.left - margin_longevity_radialChart.right,
  height_longevity_radialChart = 400 - margin_longevity_radialChart.top - margin_longevity_radialChart.bottom;

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

function loadAndProcess_FeaturesData_longevityRadialChart(
  filtered_data_input,
  selected_years
) {
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
    const mergedData = filtered_data_input
      .filter((row) => (+row.Jaar >= range_years[0] && +row.Jaar <= range_years[1]) || +row.Jaar == range_years[0])
      .map((row) => {
          return {
            Song_ID: row.Song_ID,
            Jaar: parseInt(row.Jaar),
            Weeknr: parseInt(row.Weeknr),
            genres: row["Artist_Genres"] || null,
          };
      });
    const longevity_information = d3.rollup(
      mergedData,
      (values) => ({
        maximum_amount_of_weeks: values.length,
        genres: values[0].genres,
      }),
      (d) => d.Song_ID
    );

    function calculateStats(songs_inCategories, category_name) {
      const genresStats = {};
      var total_genres_divided = 0;
      for (const [broadGenre, keywords] of Object.entries(genreKeywords)) {
        genresStats[broadGenre] = 0;
      }
      genresStats["other"] = 0;
      songs_inCategories.forEach((song) => {
        if (song.genres == null) {
          genresStats["other"] += 1;
          total_genres_divided += 1;
          return;
        }
        let genre_oneSong = song.genres.toLowerCase();
          let genreMatched = false;
          for (const [broadGenre, keywords] of Object.entries(genreKeywords)) {
            if (keywords.some((keyword) => genre_oneSong.includes(keyword))) {
              genresStats[broadGenre] += 1;
              genreMatched = true;
              total_genres_divided += 1;
            }
          }
          if (!genreMatched) {
            genresStats["other"] += 1;
            total_genres_divided += 1;
          }
        });
        const stats = [];
        Object.keys(genresStats).forEach((genre, index) => {
          let genre_counted = genresStats[genre];
          if (genre_counted > 0) {
            const percentage = genre_counted/ total_genres_divided * 100;
            stats.push({
              category: category_name,
              genre: genre,
              count: percentage,
              angle: 2 * Math.PI * (index / (possible_genres.length + 1)),
            });
          }
          else{
            stats.push({
              category: category_name,
              genre: genre,
              count: 0,
              angle: 2 * Math.PI * (index / (possible_genres.length + 1)),
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
  function_colors
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
    .attr("class", "axis")
    .attr("x1", (d) => radiusScale(0) * Math.sin(d.angle))
    .attr("y1", (d) => -radiusScale(0) * Math.cos(d.angle))
    .attr("x2", (d) => radiusScale(1) * Math.sin(d.angle))
    .attr("y2", (d) => -radiusScale(1) * Math.cos(d.angle))
    .attr("stroke", "#999")
    .attr("opacity", 0.3);
  chartContainer
    .selectAll(".label")
    .data(data[labels[0]])
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
      .attr("stroke-width", 2);
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
  maxCount
  ) {
  // const maxCount = Math.max(
  //   ...data.map((item) => {
  //     return typeof item.count === "number" && !isNaN(item.count)
  //       ? item.count
  //       : -Infinity;
  //   })
  // );
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
    .attr("class", "axis")
    .attr("x1", (d) => radiusScale(0) * Math.sin(d.angle))
    .attr("y1", (d) => -radiusScale(0) * Math.cos(d.angle))
    .attr("x2", (d) => radiusScale(maxCount * 1.1) * Math.sin(d.angle))
    .attr("y2", (d) => -radiusScale(maxCount * 1.1) * Math.cos(d.angle))
    .attr("stroke", "#999")
    .attr("opacity", 0.3);
  chartContainer
    .selectAll(".label")
    .data(data[labels[0]])
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
      .attr("stroke-width", 2);
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
    .attr("x", 12)
    .attr("y", 10)
    .text((d) => d);
  var legendWidth = legendItems.size();
  legendGroup.attr(
    "transform",
    `translate(${
      -(width_longevity_radialChart - legendWidth) * (labels.length / 7)
    } , ${height_longevity_radialChart * 0.6})`
  );
}

function update_LongevityRadialGraph(filtered_data_input) {
  // Clear the entire chart container to allow for new charts
  d3.select("#longevity_radialChart").selectAll("*")
    .transition()
    .duration(100)
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

    const stdButtonContainer = d3.select("#std_button_id");
    stdButtonContainer.selectAll("*").remove();
    const stdButton = stdButtonContainer
      .append("label")
      .text("add standard deviation area")
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
        size_graph = 0.65;
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
      }

      const svgContainer = d3
        .select("#longevity_radialChart")
        .append("svg")
        .attr(
          "width",
          (width_longevity_radialChart +
            margin_longevity_radialChart.left +
            margin_longevity_radialChart.right) *
            size_graph
        )
        .attr(
          "height",
          (height_longevity_radialChart +
            margin_longevity_radialChart.top +
            margin_longevity_radialChart.bottom) *
            size_graph
        )
        .attr("viewBox", [
          -width_longevity_radialChart / 2,
          -height_longevity_radialChart / 2,
          width_longevity_radialChart,
          height_longevity_radialChart,
        ]);

      svgContainer
        .append("text")
        .attr("x", 0)
        .attr("y", -height_longevity_radialChart / 2 - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
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
        function_colors
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
    d3.select("#myCheckbox").on("change", function (event) {
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
        size_graph = 0.65;
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
          (width_longevity_radialChart +
            margin_longevity_radialChart.left +
            margin_longevity_radialChart.right) *
            size_graph
        )
        .attr(
          "height",
          (height_longevity_radialChart +
            margin_longevity_radialChart.top +
            margin_longevity_radialChart.bottom) *
            size_graph
        )
        .attr("viewBox", [
          -width_longevity_radialChart / 2,
          -height_longevity_radialChart / 2,
          width_longevity_radialChart,
          height_longevity_radialChart,
        ]);

      svgContainer
        .append("text")
        .attr("x", 0)
        .attr("y", -height_longevity_radialChart / 2 - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
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
      max_count
    );
    if (numCharts == 1) {
      add_legend(chartContainer, labels);
      }
    }
  }
}