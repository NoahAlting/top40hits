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

const weekSelectorHeight = 20;
const weekSelectorWidth = 500;
const weeks = Array.from({ length: 52 }, (_, i) => i + 1); // Weeks 1 to 52

const weekSelectorSvg = d3.select("#weekSelector")// Ensure you have an <svg> with id="weekSelector" in your HTML
    .attr("width", weekSelectorWidth + margin.left + margin.right)
    .attr("height", weekSelectorHeight + margin.top + margin.bottom);

const weekSelectorGroup = weekSelectorSvg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const yScale = d3
    .scaleBand()
    .domain(years) // Full list of years (1965 to 2023)
    .range([0, years.length * yearHeight]) // Cover the entire SVG height
    .padding(0.05);

svg_yearselect
    .attr("height", years.length * yearHeight + margin.top + margin.bottom);

// Scale for positioning week blocks horizontally
const xScaleWeeks = d3
    .scaleBand()
    .domain(weeks) // Weeks from 1 to 52
    .range([0, weeks.length * width]) // Cover the SVG width
    .padding(0.05);

// Draw rectangles for weeks
weekSelectorGroup
    .selectAll("rect")
    .data(weeks)
    .enter()
    .append("rect")
    .attr("x", (d) => xScaleWeeks(d))
    .attr("y", 0)
    .attr("width", xScaleWeeks.bandwidth())
    .attr("height", weekSelectorHeight)
    .attr("fill", "#dedede")
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .attr("class", "week-rect");

// Add labels for weeks
weekSelectorGroup
    .selectAll("text")
    .data(weeks.filter((d) => d % 5 === 0)) // Label every 5th week
    .enter()
    .append("text")
    .attr("x", (d) => xScaleWeeks(d) + xScaleWeeks.bandwidth() / 2)
    .attr("y", weekSelectorHeight / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .text((d) => `W${d}`) // Prefix with 'W' for weeks
    .style("fill", "black")
    .style("font-size", "8px");

// Single-Range Brush for Week Selector
const weekBrush = d3.brushX()
    .extent([[0, 0], [width, weekSelectorHeight]]) // Brush covers the week selector area
    .on("brush end", function (event) {
        const selection = event.selection;

        if (selection) {
            const [x0, x1] = selection;

            // Snap the selection to the nearest week blocks
            const snappedX0 = snapToNearestWeek(x0);
            const snappedX1 = snapToNearestWeek(x1);

            const snappedSelection = [snappedX0, snappedX1];

            // Move the brush to the snapped position
            d3.select(this).call(weekBrush.move, snappedSelection);

            // Highlight selected weeks
            const selectedWeeks = weeks.filter((week) => {
                const weekCenter = xScaleWeeks(week) + xScaleWeeks.bandwidth() / 2;
                return weekCenter >= snappedX0 && weekCenter <= snappedX1;
            });

            highlightWeeks(selectedWeeks);
        }
    });

// Append brush to week selector group
weekSelectorGroup.append("g").call(weekBrush);

// Snap brush to the nearest week
function snapToNearestWeek(x) {
    const weekCenters = weeks.map((week) => xScaleWeeks(week) + xScaleWeeks.bandwidth() / 2);
    return weekCenters.reduce((closest, centerX) => {
        return Math.abs(x - centerX) < Math.abs(x - closest) ? centerX : closest;
    });
}

// Highlight selected weeks
function highlightWeeks(selectedWeeks) {
    weekSelectorGroup.selectAll(".week-rect")
        .attr("fill", (d) => (selectedWeeks.includes(d) ? "gold" : "#dedede"));
}