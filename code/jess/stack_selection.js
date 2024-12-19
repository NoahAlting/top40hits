// Data structure for years
// ludwig schubert 2016 multiple brush https://github.com/ludwigschubert/d3-brush-multiple
// brush snapping https://observablehq.com/@d3/brush-snapping

// mapfn -> transforming indices to correspond with years
const years = Array.from({ length: 59 }, (_, i) => 1965 + i);
const svg_yearselect = d3.select("#yearSelector");
const margin = { top: 6, bottom: 6, left: 4, right: 4 };
const width = +svg_yearselect.attr("width") - margin.left - margin.right;
const height = +svg_yearselect.attr("height") - margin.top - margin.bottom;
const basecolors = ["#dedede", "#cccccc"]

// Define the height for each year block
const yearHeight = 6;
const stackGroup = svg_yearselect
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Scale for positioning year blocks vertically
const yScale = d3
    .scaleBand()
    .domain(years) // Full list of years (1965 to 2023)
    .range([0, years.length * yearHeight]) // Cover the entire SVG height
    .padding(0.05);

svg_yearselect
    .attr("height", years.length * yearHeight + margin.top + margin.bottom);

// Draw year rectangles
const yearRects = stackGroup
    .selectAll("rect")
    .data(years)
    .enter()
    .append("rect")
    .attr("class", "year-rect")
    .attr("x", 20)
    .attr("y", (d) => yScale(d))
    .attr("width", width)
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) => {
        const blockIndex = Math.floor((d - 1965) / 5);  // Group years into blocks of 5
        return basecolors[blockIndex % basecolors.length];  // Cycle through the colors for each block of 5 years
    })
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)

stackGroup
    .selectAll("line")
    .data(years)
    .enter()
    .append("line")
    .attr("x1", 20)
    .attr("x2", 112)
    .attr("y1", (d) => yScale(d) + yScale.bandwidth())  // Position the tick at the bottom of the year block
    .attr("y2", (d) => yScale(d) + yScale.bandwidth())  // Make the line horizontal, same as y1
    .attr("stroke", "white")
    .attr("stroke-width", (d) => (d % 5 === 0 ? 1.5 : 0))  // Thicker stroke for every 5th year (d % 5 === 0)
    .attr("transform", "translate(0, -5.75)");

// Add year labels
stackGroup
    .selectAll("text")
    .data(years.filter((d) => d % 5 === 0)) // Filter to include only years divisible by 5
    .enter()
    .append("text")
    .attr("x", 15)  // Position the text to the left of the SVG blocks
    .attr("y", (d) => yScale(d) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")  // Align the text to the right
    .text((d) => d)
    .style("fill", "black")
    .style("font-size", "8px")  // Make the text smaller by default
    .on("mouseover", function(event, d) {
        d3.select(this).style("font-size", "12px"); // Increase font size on hover
    })
    .on("mouseout", function(event, d) {
        d3.select(this).style("font-size", "8px"); // Reset font size on mouse out
    });




const selectedRanges = [];
const multiBrushes = [];

// Function to highlight selected years

function resetYearColors() {
    const colors = ["gold", "orange", "lightgreen", "skyblue", "red"];
    const highlightedYears = {};

    // Determine which years should be highlighted with a color
    selectedRanges.forEach((r, i) => {
        const [start, end] = r.range;
        years.filter((d) => d >= start && d <= end).forEach((year) => {
            highlightedYears[year] = colors[i % colors.length];
        });
    });

    // Apply transition to the year rectangles
    yearRects.transition()
        .attr("fill", (d) => highlightedYears[d] || basecolors[Math.floor((d - 1965) / 5) % basecolors.length]);
}

function removeRange(index) {
    const { group } = selectedRanges[index];

    // Remove the brush group from the DOM
    group.remove();

    // Remove the range from selectedRanges and multiBrushes
    selectedRanges.splice(index, 1);
    multiBrushes.splice(index, 1);

    renderRanges(); // Update the displayed list of ranges
    resetYearColors(); // Reset year colors after removal
}

function createBrush() {
    const brushHeight = years.length * yearHeight;
    const horizontalOffset = 22; // Shifting the brush right
    const verticalOffset = 6;   // Shifting the brush downward

    const newBrush = d3.brushY()
        .extent([[horizontalOffset, verticalOffset], [width + horizontalOffset, brushHeight + verticalOffset]]) // Offset the extent
        .on("brush", function (event) {
            handleMultiBrush.call(this, event, newBrush);
        })
        .on("end", function (event) {
            handleMultiBrush.call(this, event, newBrush);
        });

    const brushGroup = svg_yearselect
        .append("g")
        .attr("class", "multi-brush")
        .attr("transform", `translate(${horizontalOffset}, ${verticalOffset})`) // Apply the same offsets here
        .call(newBrush);

    // Remove the fill from the brush selection area
    brushGroup.selectAll(".selection")
        .style("fill", "none") // Set fill to none
        .style("stroke", "none");

    multiBrushes.push({ brush: newBrush, group: brushGroup });
    resetYearColors();
}

let isProgrammaticMove = false; // Flag to suppress recursion

function handleMultiBrush(event, currentBrush) {
    if (isProgrammaticMove) return; // Prevent infinite recursion

    if (!event.selection) return; // Exit if there's no selection

    const [y0, y1] = event.selection;

    // Snap the brush to the nearest year block boundaries
    const snappedY0 = snapToNearestYear(y0) - yScale.bandwidth() / 2;
    const snappedY1 = snapToNearestYear(y1) + yScale.bandwidth() / 2;

    const snappedSelection = [snappedY0, snappedY1];

    // Move the brush to the snapped position
    isProgrammaticMove = true; // Set the flag before programmatic move
    d3.select(this).call(currentBrush.move, snappedSelection);
    isProgrammaticMove = false; // Reset the flag after move

    // Update selected years
    const selectedYears = years.filter((year) => {
        const yearCenter = yScale(year) + yScale.bandwidth() / 2;
        return yearCenter >= snappedY0 && yearCenter <= snappedY1;
    });

    if (selectedYears.length > 0) {
        const range = [selectedYears[0], selectedYears[selectedYears.length - 1]];
        updateRanges(currentBrush, range);
    }

    resetYearColors();
}
function snapToNearestYear(y) {
    // Find the closest year Y-coordinate (center of each year block)
    const yearCenters = years.map((year) => yScale(year) + yScale.bandwidth() / 2);
    return yearCenters.reduce((closest, centerY) => {
        return Math.abs(y - centerY) < Math.abs(y - closest) ? centerY : closest;
    });
}

function updateRanges(brush, range) {
    const existingIndex = selectedRanges.findIndex((r) => r.brush === brush);
    if (existingIndex !== -1) {
        selectedRanges[existingIndex].range = range;
    } else {
        selectedRanges.push({ brush, range, group: multiBrushes.find((b) => b.brush === brush).group });
    }

    renderRanges();
}

function renderRanges() {
    const rangeContainer = document.getElementById("rangeContainer");
    rangeContainer.innerHTML = "";

    selectedRanges.forEach(({ range }, index) => {
        const rangeDiv = document.createElement("div");
        rangeDiv.className = "range-item";
        rangeDiv.textContent = `${range[0]} - ${range[1]}`;

        // Remove button
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.onclick = () => removeRange(index);

        // Edit button
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.onclick = () => editRange(index);

        rangeDiv.appendChild(removeButton);
        rangeDiv.appendChild(editButton);
        rangeContainer.appendChild(rangeDiv);
    });
}

function editRange(index) {
    const { brush, group, range } = selectedRanges[index];
    console.log("editing range:", index);

    // Remove any visible selection on other brushes
    multiBrushes.forEach(({ group: otherGroup }) => {
        if (otherGroup !== group) {
            otherGroup.select(".selection").remove();
            otherGroup.selectAll(".handle").remove();
        }
    });

    // Set the brush extent again before re-enabling it
    brush.extent([
        [22, 6],
        [width + 22, years.length * yearHeight + 6]
    ]);

    // Re-enable brush selection for the range
    group.call(
        brush.on("brush end", (event) => handleMultiBrush(event, brush)) // Attach the handler to the specific brush
    );

    // Highlight the previously selected range with the brush
    const [start, end] = range.map((year) => yScale(year) + yScale.bandwidth() / 2);
    group.call(brush.move, [start, end]); // Move the brush to highlight the range
}

// Event Listener for Adding New Brushes
document.getElementById("addBrushButton").addEventListener("click", createBrush);


// WEEK SELECTOR
const margin_week = { top: 10, right: 0, bottom: 20, left: 0 };
const width_week = 200;
const height_week = 50;
const colors_week = ["#777099", "#AFCF9D", "#FFF7D4", "#FFD4A1"];  // Array of colors

// Create an array representing 52 weeks
const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

const xScale = d3.scaleBand()
    .domain(weeks) // Use weeks array as the domain
    .range([margin_week.left, width_week - margin_week.right])
    .paddingInner(0.1) // Space between bars
    .paddingOuter(0.05);

const xAxis = g => g
    .attr("transform", `translate(${xScale.bandwidth() / 2},${height_week - margin_week.bottom})`)
    .call(d3.axisBottom(xScale)
        .tickValues(weeks.filter(d => d % 4 === 0)) // Label every 4th week
        .tickSize(-height_week + margin_week.top + margin_week.bottom))
    .call(g => g.selectAll(".tick line")
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 1))
    .call(g => g.selectAll(".tick line")
        .filter(d => d % 4 === 0)  // Apply thicker tick for every 4th week
        .attr("stroke-width", 2))  // Thicker line for every 4th week
    .call(g => g.selectAll(".tick text")
        .attr("font-size", "12px")
        .attr("fill", "#000"));

const svg_weekselect = d3.select("#weekSelector")
    .attr("viewBox", [0, 0, width_week, height_week]);

// Append rectangles for each week with correct colors
svg_weekselect.append("g")
    .selectAll("rect")
    .data(weeks)
    .join("rect")
    .attr("x", d => xScale(d))
    .attr("y", margin_week.top)
    .attr("width", xScale.bandwidth())
    .attr("height", height_week - margin_week.top - margin_week.bottom)
    .attr("fill", (d) => {
        // Color based on the week index (group by blocks of 13 weeks)
        const blockIndex = Math.floor((d - 1) / 13);  // Group weeks into blocks of 13
        return colors_week[blockIndex % colors_week.length];  // Cycle through the colors
    });

// Append axis
svg_weekselect.append("g")
    .call(xAxis);
const brush = d3.brushX()
    .extent([[margin_week.left, margin_week.top], [width_week - margin_week.right, height_week - margin_week.bottom]]) // Define the brushable area
    .on("brush", brushed) // Attach event listener for brushing
    .on("end", brushended); // Attach event listener for brush end

svg_weekselect.append("g")
    .call(brush)
    .select(".selection") // Target the overlay element within the brush
    .attr("fill", "#2CE9EC") // Set the fill color of the overlay (brushed area)
    .attr("fill-opacity", 0.6); // Optional: Set the opacity of the brushed area

let isProgrammaticMove2 = false;

function brushed(event) {
    if (!event.selection || isProgrammaticMove2) return;

    const selection = event.selection;
    const x0 = selection[0];
    const x1 = selection[1];

    // Snap to nearest weeks
    const snappedStart = snapToNearestWeek(x0);
    const snappedEnd = snapToNearestWeek(x1);

    // Convert snapped weeks back to pixel positions
    const snappedSelection = [
        xScale(snappedStart), // Get the pixel position of the snapped start week
        xScale(snappedEnd) + xScale.bandwidth() // Add bandwidth to snapped end to ensure the full range is covered
    ];

    // Prevent recursion during programmatic move
    isProgrammaticMove2 = true;
    d3.select(this).call(brush.move, snappedSelection);
    isProgrammaticMove2 = false;
}
function brushended(event) {
    const selection = event.selection;
    if (!event.sourceEvent || !selection) return;

    const x0 = selection[0];
    const x1 = selection[1];

    // Snap to nearest weeks
    const snappedStart = snapToNearestWeek(x0);
    const snappedEnd = snapToNearestWeek(x1);

    // Convert snapped weeks back to pixel positions
    const snappedSelection = [
        xScale(snappedStart), // Get the pixel position of the snapped start week
        xScale(snappedEnd) + xScale.bandwidth() // Add bandwidth to snapped end to ensure the full range is covered
    ];

    // Ensure the brush stays within bounds
    const brushSelection = [
        Math.max(margin_week.left, Math.min(width_week - margin_week.right, snappedSelection[0])),
        Math.max(margin_week.left, Math.min(width_week - margin_week.right, snappedSelection[1]))
    ];

    d3.select(this).transition().call(brush.move, brushSelection);

    // Log the selected weeks
    console.log(`Selected weeks: ${snappedStart} to ${snappedEnd}`);

    // Update the week range display
    weekRangeContainer.innerHTML = `Week ${snappedStart} - ${snappedEnd}`;
}

function snapToNearestWeek(x) {
    // Find the closest week index by comparing distances to the center of each week
    const weekCenters = weeks.map((week) => xScale(week) + xScale.bandwidth() / 2);
    const closestCenter = weekCenters.reduce((closest, centerX) => {
        return Math.abs(x - centerX) < Math.abs(x - closest) ? centerX : closest;
    });

    // Find and return the week corresponding to the closest center
    return weeks[weekCenters.indexOf(closestCenter)];
}

const weekRangeContainer = document.getElementById("weekRangeContainer");