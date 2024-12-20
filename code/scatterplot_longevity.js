// to do
// just use the ids instead of connecting manually
// one week & one year possibility?

var week_range = [10, 25]
var year_range = [2010, 2013];
const colorScale = d3
    .scaleSequential()
    .domain(year_range)
    .interpolator(d3.interpolateCool);


function updateLegend() {
    d3.select("#legend").selectAll("*").remove();
    const legendHeight = (year_range[1] - year_range[0] + 1) * 15;

    const legend = d3
        .select("#legend")
        .append("svg")
        .attr("width", 150)
        .attr("height", legendHeight);

    legend.selectAll("rect")
        .data(d3.range(year_range[0], year_range[1] + 1)) 
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 15) 
        .attr("width", 20)
        .attr("height", 10)
        .attr("fill", d => colorScale(d)); 

    legend.selectAll("text")
        .data(d3.range(year_range[0], year_range[1] + 1))
        .enter()
        .append("text")
        .attr("x", 25) 
        .attr("y", (d, i) => i * 15 + 9) 
        .text(d => d) 
        .style("font-size", "10px")
        .style("alignment-baseline", "middle");
}


Promise.all([
    d3.csv("../data/spotify_songs.csv", d3.autoType),
    d3.tsv("../data/top40-noteringen.csv", d3.autoType)
]).then(([spotifyData, top40Data]) => {
    let mergedData = top40Data.map(song => {
        const spotifyMatch = spotifyData.find(
            spotify =>
                spotify.Title === song.Titel &&
                spotify.Artist === song.Artiest
        );
        return {
            // return the song
            ...song,
            ...spotifyMatch,
            // and properties from the top 40
            Longevity: song.Aantal_weken,
            Jaar: song.Jaar
        };
    });

    // get the maximum longevity per song
    const maxLongevity = Array.from(
        // group by unique song (title + artist)
        d3.group(mergedData, d => `${d.Titel}_${d.Artiest}`),
        ([key, group]) => {
            const maxLong = group.reduce((max, song) =>
                song.Longevity > max.Longevity ? song : max
            );
            return maxLong;
        }
    );

    // filter out features that dont have numerical data
    const features = Object.keys(spotifyData[0]).filter(
        key => typeof spotifyData[0][key] === "number"
    );

    // get the range of years for the menu
    // d => d.something accesses the objects in the array like a for loop
    const years = Array.from(new Set(maxLongevity.map(d => d.Jaar))).sort();
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    // set the range of longevity to its max
    const longevityRange = [0, d3.max(maxLongevity, d => d.Longevity)];
    // range for features is the max of the songs of that feature, or 0
    const featureRanges = features.reduce((acc, feature) => {
        acc[feature] = [
            0,
            d3.max(maxLongevity, d => (d[feature] ? d[feature] : 0))
        ];
        return acc;
    }, {});

    // menu
    const dropdown = d3
        .select("#feature-selector")
        .append("select");

    dropdown
        .selectAll("option")
        .data(features)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // year slider
    // const slider = d3
    //     .select("#year-slider")
    //     .append("input")
    //     .attr("type", "range")
    //     .attr("min", minYear)
    //     .attr("max", maxYear)
    //     .attr("value", minYear)
    //     .attr("step", 1);

    // const sliderLabel = d3
    //     .select("#year-slider")
    //     .append("span")
    //     .text(minYear);

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    const svg = d3
        .select("#scatterplot")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const barChart = d3
        .select("#barchart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // scatterplot
    function showScatterplot(feature) {
        const filteredSongs = maxLongevity.filter(
            // what about one year & one week?
            d =>
                d.Weeknr >= week_range[0] && 
                d.Weeknr <= week_range[1] &&
                d.Jaar >= year_range[0] &&
                d.Jaar <= year_range[1] &&
                d[feature] !== null &&
                d[feature] !== undefined
        );

        const xScale = d3
            .scaleLinear()
            .domain(longevityRange)
            .range([margin.left, width - margin.right]);

        const yScale = d3
            .scaleLinear()
            .domain(featureRanges[feature])
            .range([height - margin.bottom, margin.top]);


        // clear previous plot
        svg.selectAll("*").remove();

        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(xScale));
        svg.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));

        svg.selectAll("circle")
            .data(filteredSongs)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.Longevity))
            .attr("cy", d => (d[feature] ? yScale(d[feature]) : null))
            .attr("r", 5)
            .attr("fill", d => colorScale(d.Jaar))
            // .attr("opacity", 0.5)
            // when the dot is clicked, render the bar chart
            .on("click", (event, d) => {
                d3.selectAll("circle").attr("r", 5); 
                d3.selectAll("circle").attr("stroke", "none")
                d3.selectAll("circle").attr("fill", d => colorScale(d.Jaar))
                // make clear when selecting 
                d3.select(event.target)
                    .transition()
                    .duration(200)
                    .attr("r", 8) 
                    .attr("fill", "orange")
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.8)
                showBarChart(d, feature);
            })
            .on("mouseover", (event, d) => {
                d3.select(event.target)
                    .attr("r", 8) 
                    .transition()
                    .duration(200)
            })
            .on("mouseout", (event, d) => {
                if (!d3.select(event.target).classed("selected")) {
                    d3.select(event.target)
                        .attr("r", 5) 
                }})

        // Labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 10)
            .attr("text-anchor", "middle")
            .text("Longevity (weeks)");


        // legend
        updateLegend();

    }


    // barchart
    function showBarChart(song, selectedFeature) {
        // only show these features, the others are not witin 0-1, could also do but normalise
        const selectedFeatures = ['Danceability', 'Acousticness', 'Energy', 'Liveness', 'Valence', 'Speechiness'];
        const featureData = selectedFeatures
            .map(feature => ({ feature, value: song[feature] }))
            .filter(d => 
                d.value != null &&
                d.value != undefined
            );

        // console.log("Selected Feature:", selectedFeature);  

        const xScale = d3
            .scaleBand()
            .domain(featureData.map(d => d.feature))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const yScale = d3
            .scaleLinear()
            .domain([0, 1])
            .range([height - margin.bottom, margin.top]);

        barChart.selectAll("*").remove();

        barChart.append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        barChart.append("g")
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(yScale));

        // Add bars
        barChart.selectAll("rect")
            .data(featureData)
            .enter()
            .append("rect")
            .attr("x", d => xScale(d.feature))
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth())
            .attr("height", d => height - margin.bottom - yScale(d.value))
            // colour the feature that is in the scatterplot
            .attr("fill", d => {
                return d.feature === selectedFeature ? "orange" : "darkslateblue";
            });

        // show the artist & title too
        barChart.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .text(`${song.Artist}: ${song.Title}`);
    }

    // initial render scatterplot
    showScatterplot(features[0], minYear);

    // update when feature is changed
    dropdown.on("change", function () {
        // get the feature value that is selected
        const selectedFeature = this.value;
        // // get the year value from the slider (+ = to num)
        // need to turn this back on to register changes from the year menu
        // const selectedYear = +slider.property("value");
        showScatterplot(selectedFeature);
    });

    // // update when year is changed
    // slider.on("input", function () {
    //     const selectedYear = +this.value;
    //     // update label
    //     sliderLabel.text(selectedYear);
    //     const selectedFeature = dropdown.property("value");
    //     showScatterplot(selectedFeature, selectedYear);
    // });

});

