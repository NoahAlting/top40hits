// Data structure for years

// mapfn -> transforming indices to correspond with years
const years = Array.from({ length: 59 }, (_, i) => 1965 + i);

// Select the SVG container for year selection
const svg_yearselect = d3.select("#yearSelector");
const margin = { top: 6, bottom: 6, left: 4, right: 4 };
const width = +svg_yearselect.attr("width") - margin.left - margin.right;
const height = +svg_yearselect.attr("height") - margin.top - margin.bottom;

// Define the height for each year block
const yearHeight = 8;
const stackGroup = svg_yearselect
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Scale for positioning year blocks vertically
const yScale = d3
    .scaleBand()
    .domain(years)
    .range([0, years.length * yearHeight])
    .padding(0.1);

// Draw year rectangles
const yearRects = stackGroup
    .selectAll("rect")
    .data(years)
    .enter()
    .append("rect")
    .attr("class", "year-rect")
    .attr("x", 0)
    .attr("y", (d) => yScale(d))
    .attr("width", width)
    .attr("height", yScale.bandwidth())
    .attr("fill", "steelblue")
    .attr("stroke", "white");

// Add year labels
stackGroup
    .selectAll("text")
    .data(years)
    .enter()
    .append("text")
    .attr("x", width / 2)
    .attr("y", (d) => yScale(d) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text((d) => d)
    .style("fill", "white");

// Initialize brushing for aggregated mode
const brush = d3
    .brushY()
    .extent([
        [0, 0],
        [width, height],
    ])
    .on("brush end", brushed);

svg_yearselect.append("g").attr("class", "brush").call(brush);

// Function to highlight selected years
function highlightSelectedYears(selectedYears) {
    yearRects.attr("fill", (d) =>
        selectedYears.includes(d) ? "gold" : "steelblue"
    );
}

// Brushing event handler
function brushed({ selection }) {
    if (!selection) return;

    const [y0, y1] = selection;

    const selectedYears = years.filter((d) => {
        const y = yScale(d) + yScale.bandwidth() / 2;
        return y >= y0 && y <= y1;
    });

    if (selectedYears.length > 0) {
        highlightSelectedYears(selectedYears);
        console.log("Aggregated Range:", [selectedYears[0], selectedYears[selectedYears.length - 1]]);
    } else {
        console.log("No Selection");
    }
}

// Create a multi-brush for distinct ranges
const multiBrushes = [];

function createBrush() {
    const newBrush = d3
        .brushY()
        .extent([
            [0, 0],
            [width, height],
        ])
        .on("brush end", (event) => handleMultiBrush(event, newBrush));

    const brushGroup = svg_yearselect
        .append("g")
        .attr("class", "multi-brush")
        .call(newBrush);

    // Listen for the double-click event to remove the brush
    brushGroup.on("dblclick", function () {
        removeBrush(brushGroup); // Call removeBrush on double-click
    });

    // Store the brush in the multiBrushes array for later removal
    multiBrushes.push(brushGroup);
}

// Handle brushing for multi-brush mode
function handleMultiBrush({ selection }, currentBrush) {
    if (!selection) return;

    const [y0, y1] = selection;

    // Determine the selected years based on the brush position
    const selectedYears = years.filter((d) => {
        const y = yScale(d) + yScale.bandwidth() / 2;
        return y >= y0 && y <= y1;
    });

    if (selectedYears.length > 0) {
        console.log("Distinct Range:", selectedYears);
        highlightSelectedYears(selectedYears);
    } else {
        console.log("No Selection");
    }
}

// Function to remove a brush (distinct range)
function removeBrush(brushGroup) {
    // Remove the brush from the multiBrushes array
    const index = multiBrushes.indexOf(brushGroup);
    if (index !== -1) {
        multiBrushes.splice(index, 1);
    }

    // Remove the brush from the SVG
    brushGroup.remove();
    console.log("Removed the selected distinct range.");

    // Reset the year blocks back to their default color
    resetYearColors();
}

// Reset year colors back to blue
function resetYearColors() {
    yearRects.attr("fill", "steelblue");
}

// Button to toggle between modes
document.getElementById("modeToggle").addEventListener("click", () => {
    const mode = d3.select("#modeToggle").attr("data-mode");

    if (mode === "aggregated") {
        // Switch to distinct mode
        d3.select("#modeToggle")
            .attr("data-mode", "distinct")
            .text("Switch to Aggregated");

        svg_yearselect.select(".brush").remove(); // Remove the aggregated brush
        createBrush(); // Create the first multi-brush for distinct ranges
    } else {
        // Switch to aggregated mode
        d3.select("#modeToggle")
            .attr("data-mode", "aggregated")
            .text("Switch to Distinct");

        svg_yearselect.selectAll(".multi-brush").remove(); // Remove all multi-brushes
        svg_yearselect.append("g").attr("class", "brush").call(brush); // Restore the aggregated brush
    }
});

// Now call the setupSlider function for the week slider functionality
function setupSlider(v1, v2, updateGraph, color) {
    const sliderVals = [v1, v2];
    const width = 400;

    // Append SVG for slider under the year selection (in the slider-holder)
    const svg = d3.select("#slider-holder")
        .append("svg")
        .attr('width', width + 30)
        .attr('height', 50);

    const x = d3.scaleLinear()
        .domain([1, 52]) // Weeks from 1 to 52
        .range([0, width])
        .clamp(true);

    const xMin = x(1);
    const xMax = x(52);

    // Add slider group
    const slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(5,20)");

    slider.append("line")
        .attr("class", "track")
        .attr("x1", xMin)
        .attr("x2", xMax)
        .style("stroke", "#ccc")
        .style("stroke-width", 6);

    // Selection range
    const selRange = slider.append("line")
        .attr("class", "sel-range")
        .attr("x1", x(sliderVals[0]))
        .attr("x2", x(sliderVals[1]))
        .style("stroke", "steelblue")
        .style("stroke-width", 6);

    // Add ticks
    slider.insert("g", ".track-overlay")
        .attr("class", "ticks")
        .attr("transform", "translate(10,24)")
        .selectAll("text")
        .data(x.ticks(10)) // 10 ticks for the weeks
        .enter().append("text")
        .attr("x", x)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .style("fill", (d) => color(d))
        .text((d) => d);

    // Add handles
    const handle = slider.selectAll("rect")
        .data([0, 1])
        .enter().append("rect", ".track-overlay")
        .attr("class", "handle")
        .attr("y", -8)
        .attr("x", (d) => x(sliderVals[d]))
        .attr("rx", 3)
        .attr("height", 16)
        .attr("width", 20)
        .style("fill", "#666")
        .call(
            d3.drag()
                .on("start", startDrag)
                .on("drag", drag)
                .on("end", endDrag)
        )
        .on("mouseover", function() {
            d3.select(this).style("width", "30px"); // Enlarge the handle
        })
        .on("mouseout", function() {
            d3.select(this).style("width", "20px"); // Restore handle size
        });

    function startDrag() {
        d3.select(this).raise().classed("active", true);
    }

    function drag(d) {
        sliderVals[d] = Math.min(Math.max(1, x.invert(d3.event.x)), 52);
        selRange.attr("x1", x(sliderVals[0]))
            .attr("x2", x(sliderVals[1]));
        handle.attr("x", (d) => x(sliderVals[d]));
    }

    function endDrag() {
        d3.select(this).classed("active", false);
        updateGraph(sliderVals[0], sliderVals[1]); // Update graph on drag end
    }
}


// Initialize slider after the year selection
function updateGraph(week1, week2) {
    console.log(`Selected weeks: ${week1} to ${week2}`);
}

// Call the slider setup after year selection
setupSlider(1, 52, updateGraph, (week) => week <= 26 ? "green" : "red");