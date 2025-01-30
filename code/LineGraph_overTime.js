function loadAndProcess_FeaturesData_LineGraph(filtered_data_input, selected_years, selectedGenre, max_top) {
    const plotData = [];
    selected_years.forEach(range_years=>{
        const mergedData = filtered_data_input
            .filter((row) => +row.Jaar >= range_years[0] && +row.Jaar <= range_years[1] || +row.Jaar == range_years[0]) 
            .map((row) => {
                return {
                    Song_ID: row.Song_ID,
                    Jaar: +row.Jaar,
                    Weeknr: +row.Weeknr,
                    selected_feature_value: row[selectedGenre]
                };
            });
        const weeklyAverages = d3.rollup(
            mergedData, 
            values => {
                const mean = d3.mean(values, v => v.selected_feature_value);
                let std = d3.deviation(values, v => v.selected_feature_value);
                std = Math.min(std || 0, max_top); 
                return {
                    mean_week: mean,
                    std_week: std
                };
            },
            d => d.Weeknr
        );
        weeklyAverages.forEach((values, week) => {
            plotData.push({
                year_range: range_years,
                week: week,
                avgValue: values.mean_week,
                stdDev: values.std_week
                });
            });
    });
    plotData.sort((a, b) => {
        if (a.year_range[0] !== b.year_range[0]) {
            return a.year_range[0] - b.year_range[0];
        }
        return a.week - b.week;
    });

    return plotData;
}

function loadAndProcess_GenresData_LineGraph(filtered_data_input, selected_years, selectedGenre, max_top) {
    const plotData = [];

    selected_years.forEach((range_years) => {
        const mergedData = Object.entries(filtered_data_input)
            .flatMap(([genre, songs]) => 
                songs
                    .filter((row) => +row.Jaar >= range_years[0] && +row.Jaar <= range_years[1] || +row.Jaar == range_years[0]) 
                    .map((row) => ({
                        Song_ID: row.Song_ID,
                        Jaar: +row.Jaar,
                        Weeknr: +row.Weeknr,
                        genre: genre 
                    }))
            );

        const weeklyAverages = d3.rollup(
            mergedData,
            (values) => {
                const genresThisWeek = values.map((d) => d.genre);
                const selectedGenre_count = genresThisWeek.filter(genre => genre.toLowerCase() === selectedGenre).length;
    
                return {
                    week_genres: (selectedGenre_count / genresThisWeek.length * 100).toFixed(2)
                };
            },
            (d) => d.Weeknr
        );

        weeklyAverages.forEach((values, week) => {
            plotData.push({
                year_range: range_years,
                week: week,
                genre_percentage: values.week_genres 
            });
        });
    });
    plotData.sort((a, b) => {
        if (a.year_range[0] !== b.year_range[0]) {
            return a.year_range[0] - b.year_range[0];
        }
        return a.week - b.week;
    });
    return plotData;
}

function createInteractiveGraph_Features_LineGraph(plotData, selected_years, selected_weeks, max_top, selectedGenre, linePlot, table, width_lineGraph, height_lineGraph) {
    // let minValue = Infinity;
    // let maxValue = -Infinity;
    // plotData.forEach(item => {
    //     if ((item.avgValue - item.stdDev) < minValue) minValue = item.avgValue - item.stdDev;
    //     if ((item.avgValue + item.stdDev) > maxValue) maxValue = item.avgValue + item.stdDev;
    //   });
    // var difference_y = maxValue - minValue;
    // var minY = Math.max(minValue - difference_y * 0.1, 0);
    // var maxY = Math.min(maxValue + difference_y * 0.1, 1);
    // if ((maxY - minY) < 0.2){
    //     minY = Math.max(0, (minY - (0.5) * (maxY - minY)));
    //     maxY = Math.min(1, (maxY + (0.5) * (maxY - minY)));
    // }
    var x = d3.scaleLinear()
        .domain([selected_weeks[0], selected_weeks[1]])
        .range([0, width_lineGraph])
        .clamp(true);
    var y = d3.scaleLinear()
        .domain([0, 1])
        .range([height_lineGraph, 0])
        .clamp(true);
    // Label x-axis
    linePlot.append("g")
    .attr("transform", "translate(0," + height_lineGraph + ")")
    .attr("class", "axis-group")
    .call(d3.axisBottom(x)
        .ticks(5)
        .tickFormat(d => `${d}`)) 
    .selectAll("text") 
    .style("font-size", "18px"); 
    linePlot.append("text")
        .attr("class", "label-text")
        .style("font-size", "22px")
        .attr("text-anchor", "middle")
        .attr("x", width_lineGraph * 0.5)
        .attr("y", height_lineGraph * 1.2) 
        .text("Weeknumber");
    // Label y-axis
    linePlot.append("g")
        .attr("class", "axis-group")
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d3.format(".2f"))) 
        .selectAll("text")
        .style("font-size", "18px"); 
    linePlot.append("text")
        .attr("class", "label-text")
        .style("font-size", "22px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)") 
        .attr("x", -height_lineGraph * 0.5) 
        .attr("y", -70)
        .text(`Average score`);

    // Y-axis grid lines
    linePlot.append("g")
        .attr("class", "grid")
        .call(
            d3.axisLeft(y)
                .ticks(5)
                .tickSize(-width_lineGraph)
                .tickFormat("") 
        )
        .attr("opacity", 0.2)
        .attr("stroke-dasharray", "2,2");
 
    /// Create all graphs/ parts
    // Average line in graph
    selected_years.forEach(year_range => {
        let rangeKey = `${year_range[0]}-${year_range[1]}`; 
        if (year_range.length === 1) {
            rangeKey = `${year_range}-${year_range}`;
        }
        const yearData = plotData.filter(d => d.year_range === year_range);
        var line = linePlot.append("path")
            .datum(yearData)
            .attr("data-range", rangeKey)
            .attr("data-original-color", get_color_yearRange(year_range, selected_years))
            .attr("fill", "none")
            .attr("stroke", get_color_yearRange(year_range, selected_years))
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => x(d.week))
                .y(d => y(d.avgValue))
            );
    });
    // Area standard deviation
    var areaGenerator = d3.area()
        .x(function(d) { return x(d.week); })
        .y0(function(d) { return y(Math.max(0, d.avgValue - d.stdDev)); }) 
        .y1(function(d) { return y(Math.min(d.avgValue + d.stdDev, 1)); }); 
    var area_std = linePlot.append("path")
        .join("path")
        .attr("class", "area")
        .attr("fill-opacity", 0.2)
        .attr("stroke", "none");
    // Table below linegraph
    const legendLabels = selected_years.map(range => 
        range.length > 1
            ? `${range[0]}-${range[1]}` 
            : `${range[0]}` 
    );
    table.style("border-collapse", "collapse");
    var header = table.append("thead").append("tr");
    header.append("th").text("Week").style("border", "1px solid white").style("padding", "5px");
    legendLabels.forEach(year_range => {
        header.append("th").text(year_range).style("border", "1px solid white").style("padding", "5px");
    });
    var tbody = table.append("tbody");
    // Navigation vertical line in graph
    // https://d3-graph-gallery.com/graph/line_cursor.html  
    var navigationLine = linePlot.append('svg:rect')
        .attr('width', width_lineGraph)
        .attr('height', height_lineGraph)
        .attr('fill', 'none')
        .attr('pointer-events', 'all');

    /// Interactivity hoovering over graph: vertical navigation line appears, table generated and standard deviation area shown
    // https://stackoverflow.com/questions/29440455/how-to-as-mouseover-to-line-graph-interactive-in-d3
    linePlot.append("path")
        .attr("class", "mouseLine")
        .attr("fill", "none")
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0);         
    linePlot
        .on('mouseout', function() {
            d3.select(".mouseLine").style("opacity", "0");
            table.style("visibility", "hidden");
            area_std.style("visibility", "hidden");
        })
        .on('mouseover', function() {
            d3.select(".mouseLine").style("opacity", "1");
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
            selected_years.forEach(year_range => {
                var dataForYear = weekData.filter(d => d.year_range === year_range);
                if (dataForYear.length > 0) {
                    var distance = Math.abs(yDate - dataForYear[0].avgValue); 
                    if (distance < Math.abs(yDate - closest_value)) {
                        closest_value = dataForYear[0].avgValue;
                        closest_year = year_range; 
                    }
                }
            });
            if (closest_year != 0) {
                linePlot.selectAll(".area")
                    .data(selected_years.map(year => plotData.filter(d => d.year_range === closest_year)))
                    .attr("fill", d => get_color_yearRange(d[0]?.year_range, selected_years))
                    .attr("d", d => areaGenerator(d))
                    .style("visibility", function(d) {
                        return d[0]?.year_range === closest_year ? "visible" : "hidden";
                    });
            } else {
                area_std.style("visibility", "hidden"); 
            }
            d3.select(".mouseLine")
                .attr("d", function() {
                    var yRange = y.range(); 
                    return `M${xCoor},${yRange[0]}L${xCoor},${yRange[1]}`; 
                });
            if (weekData.length > 0) {
                var rowData = weekData[0]; 
                tbody.selectAll("tr").remove();
                var row = tbody.append("tr");
                row.append("td").text(rowData.week).style("border", "1px solid white").style("padding", "5px");
                selected_years.forEach(year_range => {
                    var dataForYear = weekData.filter(d => d.year_range === year_range);
                    row.append("td").text(dataForYear.length > 0 ? 
                        `${dataForYear[0].avgValue.toFixed(2)} ± ${dataForYear[0].stdDev.toFixed(2)}` 
                        : "No data")
                        .style("border", "1px solid white").style("padding", "5px");
                });
            }
        });
}

function createInteractiveGraph_Genress_LineGraph(plotData, selected_years, selected_weeks, max_top, selectedGenre, linePlot, table, width_lineGraph, height_lineGraph){
    // let minValue = Infinity;
    // let maxValue = -Infinity;
    // plotData.forEach(item => {
    //     const value = parseFloat(item.genre_percentage);
    //     if (!isNaN(value)) {
    //         if (value < minValue) minValue = value;
    //         if (value > maxValue) maxValue = value;
    //     }
    // });    
    // var difference_y = maxValue - minValue;
    // var minY = Math.max(minValue - difference_y * 0.2, 0);
    // var maxY = Math.min(maxValue + difference_y * 0.2, 100);
    // maxY = Math.max(maxY, 10);
    /// Graph settings
    // Set domain and ranges for axes
    var x = d3.scaleLinear()
        .domain([selected_weeks[0], selected_weeks[1]])
        .range([0, width_lineGraph])
        .clamp(true);
    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([height_lineGraph, 0])
        .clamp(true);
    // Label x-axis
    linePlot.append("g")
        .attr("transform", "translate(0," + height_lineGraph + ")")
        .attr("class", "axis-group")
        .call(d3.axisBottom(x)
            .ticks(5)
            .tickFormat(d => `${d}`)) 
        .selectAll("text") 
        .style("font-size", "18px"); 
    linePlot.append("text")
        .attr("class", "label-text")
        .style("font-size", "22px")
        .attr("text-anchor", "middle")
        .attr("x", width_lineGraph * 0.5)
        .attr("y", height_lineGraph * 1.2) 
        .text("Weeknumber");
    // Label y-axis
    linePlot.append("g")
        .attr("class", "axis-group")
        .call(d3.axisLeft(y)
            .ticks(5)
            .tickFormat(d3.format(".0f"))) 
        .selectAll("text")
        .style("font-size", "18px"); 
    linePlot.append("text")
        .attr("class", "label-text")
        .style("font-size", "22px")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)") 
        .attr("x", -height_lineGraph * 0.5) 
        .attr("y", -70)
        .text(`Amount of songs (in %)`);
    // Y-axis grid lines
    linePlot.append("g")
        .attr("class", "grid")
        .call(
            d3.axisLeft(y)
                .ticks(5)
                .tickSize(-width_lineGraph)
                .tickFormat("") 
        )
        .attr("opacity", 0.2)
        .attr("stroke-dasharray", "2,2");
    /// Create all graphs/ parts
    // Average line in graph
    selected_years.forEach(year_range => {
        let rangeKey = `${year_range[0]}-${year_range[1]}`; 
        if (year_range.length === 1) {
            rangeKey = `${year_range}-${year_range}`;
        }
        const yearData = plotData.filter(d => d.year_range === year_range);
        var line = linePlot.append("path")
            .datum(yearData)
            .attr("data-range", rangeKey)
            .attr("data-original-color", get_color_yearRange(year_range, selected_years))
            .attr("fill", "none")
            .attr("stroke", get_color_yearRange(year_range, selected_years))
            .attr("stroke-width", 2)
            .attr("d", d3.line()
                .x(d => x(d.week))
                .y(d => y(d.genre_percentage))
            );
    });
    // Table below linegraph
    const legendLabels = selected_years.map(range => 
        range.length > 1
            ? `${range[0]}-${range[1]}` 
            : `${range[0]}` 
    );
    table.style("border-collapse", "collapse");
    var header = table.append("thead").append("tr");
    header.append("th").text("Week").style("border", "1px solid white").style("padding", "5px");
    legendLabels.forEach(year_range => {
        header.append("th").text(year_range).style("border", "1px solid white").style("padding", "5px");
    });
    var tbody = table.append("tbody");
    // Navigation vertical line in graph
    // https://d3-graph-gallery.com/graph/line_cursor.html  
    var navigationLine = linePlot.append('svg:rect')
        .attr('width', width_lineGraph)
        .attr('height', height_lineGraph)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')

    /// Create interactivity: mouse line (vertical line) + Table to display the values below the legend
    // https://stackoverflow.com/questions/29440455/how-to-as-mouseover-to-line-graph-interactive-in-d3
    linePlot.append("path")
        .attr("class", "mouseLine")
        .attr("fill", "none")
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0);
    linePlot
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
                row.append("td").text(rowData.week).style("border", "1px solid white").style("padding", "5px");
                selected_years.forEach(year_range => {
                    var dataForYear = weekData.filter(d => d.year_range === year_range);
                    row.append("td").text(dataForYear.length > 0 ? 
                        `${dataForYear[0].genre_percentage} %` 
                        : "No data")
                        .style("border", "1px solid white").style("padding", "5px");
                });
            }
        });
}

function updateLineGraph(filtered_data_input) {
    if (typeof linePlot !== "undefined") {
        d3.select("#lineGraph_overTime").selectAll("*")
            .transition()
            .duration(5)
            .ease(d3.easeLinear)
            .remove();
    }
    if (typeof table !== "undefined") {
        table.selectAll("*").remove();
    }
    
    var linegraph_containerWidth = document.getElementById("lineGraphContainer").clientWidth;
    var linegraph_containerHeight = document.getElementById("lineGraphContainer").clientHeight;
    var margin_lineGraph = {top: linegraph_containerHeight * 0.15, right: linegraph_containerWidth * 0.05, bottom: linegraph_containerHeight * 0.2, left: linegraph_containerWidth * 0.05};
    var width_lineGraph = linegraph_containerWidth - margin_lineGraph.left - margin_lineGraph.right;
    var height_lineGraph = linegraph_containerHeight - margin_lineGraph.top - margin_lineGraph.bottom;
    linePlot = d3.select("#lineGraph_overTime")
        .append("svg")
        .attr("width", width_lineGraph) 
        .attr("height", height_lineGraph) 
        .attr("viewBox", `0 0 ${linegraph_containerWidth} ${linegraph_containerHeight}`) 
        .attr("preserveAspectRatio", "xMidYMid meet") 
        .append("g")
        .attr("transform", `translate(${margin_lineGraph.left}, ${margin_lineGraph.top})`)  
        .style("overflow", "visible"); 
    var tableContainer = d3.select("#lineGraph_overTime")
        .append("div")
        .attr("class", "table-container")
        .style("width", `${width_lineGraph}px`);
    var table = tableContainer.append("table")
        .attr("class", "value-table")
        .style("width", "100%")
        .style("border-collapse", "collapse")
        .style("visibility", "hidden");    

    const selected_years = window.selectedYearRanges.sort((a, b) => a[0] - b[0])
        .map(range => range[0] === range[1] ? [range[0]] : range);
    const selectedType = window.selectedType;
    const selectedGenre = window.selectedGenre;
    const max_top = window.selectedTop;
    const selected_weeks = window.selectedWeekRange;

    const header_linegraph = d3.select("#heading-container-linegraph");
    if (selectedType == "features"){
        header_linegraph.text(`Weekly ${selectedGenre} Scores Over the Year`);
        removeButtonByContainerId("lineGraphContainer")
        createInfoButtonWithTooltip(
            "lineGraphContainer",
            `Weekly ${window.selectedGenre} Scores Over the Year`,
            `This line graph displays the average ${window.selectedGenre} scores of songs in the Top ${window.selectedTop} for each week across all selected year ranges. You can compare the ${window.selectedGenre} distribution across different year ranges or within a single year range.`,
            "The week number within the year.",
            `The average ${window.selectedGenre} score of all songs in the Top ${window.selectedTop} for a specific week.`,
            "Lines (average values) and areas (standard deviation) are the marks.",
            "Color hue for year ranges, y-postion for feature value, x-position for week.",
            "Hover over the graph to view the standard deviation of scores. Use the vertical search line to display detailed scores for a specific week.",
            "right"
        );        
        const data = loadAndProcess_FeaturesData_LineGraph(filtered_data_input, selected_years, selectedGenre, max_top);
        createInteractiveGraph_Features_LineGraph(data, selected_years, selected_weeks, max_top, selectedGenre,  linePlot, table, width_lineGraph, height_lineGraph);
    }
    else {
        header_linegraph.text(`Weekly Amount of ${selectedGenre} Songs Over the Year`);
        removeButtonByContainerId("lineGraphContainer")
        createInfoButtonWithTooltip(
            "lineGraphContainer",
            `Weekly ${window.selectedGenre} Scores Over the Year`,
            `This line graph shows the proportion of ${window.selectedGenre} songs in the Top ${window.selectedTop} for each week across all selected year ranges. You can compare the ${window.selectedGenre} distribution across different year ranges or within a single year range.`,
            "The week number within the year.",
            `The percentage of ${window.selectedGenre} songs in the Top ${window.selectedTop} for a specific week.`,
            "Lines (average values) and areas (standard deviation) are the marks.",
            "Color hue for year ranges, y-postion for genre count, x-position for week.",
            "Hover over the graph to use the vertical search line to view detailed scores for a specific week.",
            "right"
        );        
        const data = loadAndProcess_GenresData_LineGraph(filtered_data_input, selected_years, selectedGenre, max_top);
        createInteractiveGraph_Genress_LineGraph(data, selected_years, selected_weeks, max_top, selectedGenre,  linePlot, table, width_lineGraph, height_lineGraph);
    }
}

function linegraph_yearhighlight(selectedRange) {
    const svg = d3.select("#lineGraph_overTime");
    svg.selectAll("path")
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.4)
        .attr("stroke", function () {
            return d3.select(this).attr("data-original-color");
        });

    if (!selectedRange || !Array.isArray(selectedRange) || selectedRange.length !== 2) {
        svg.selectAll("path")
            .attr("stroke-width", 2)
            .attr("opacity", 1)
            .attr("stroke", function () {
                return d3.select(this).attr("data-original-color");
            });
    }
    const rangeKey = `${selectedRange[0]}-${selectedRange[1]}`;
    const highlightedPath = svg.selectAll("path")
        .filter(function () {
            return d3.select(this).attr("data-range") === rangeKey;
        })
        .attr("stroke-width", 3)
        .attr("opacity", 1);
    highlightedPath.raise();
}
