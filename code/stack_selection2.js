// Data structure for years
// ludwig schubert 2016 multiple brush https://github.com/ludwigschubert/d3-brush-multiple
// brush snapping https://observablehq.com/@d3/brush-snapping

// ============================================ YEAR SELECTOR =================================================
// mapfn -> transforming indices to correspond with years
const years = Array.from({ length: 59 }, (_, i) => 1965 + i);
const margin_year = { top: 6, bottom: 6, left: 4, right: 4 };
const width_year = 100;
const height_year = 360;
const basecolors = ["#dedede", "#cccccc"]

const svg_yearselect = d3.select("#yearSelector")
    .attr("viewBox", [0, 0, width_year, height_year]);

// Define the height for each year block
// TODO: INSTEAD MAKE THIS MORE LIKE WEEK SELECTOR WHERE IT IS DERIVED FROM THE YEAR_HEIGHT AND WIDTH
const yearHeight = 6;
const stackGroup = svg_yearselect
    .append("g")
    .attr("transform", `translate(${margin_year.left},${margin_year.top})`);

// Scale for positioning year blocks vertically
const yScale = d3
    .scaleBand()
    .domain(years)
    .range([0, years.length * yearHeight])
    .padding(0.05);

svg_yearselect
    .attr("height", years.length * yearHeight + margin_year.top + margin_year.bottom);

// Draw year rectangles
const yearRects = stackGroup
    .selectAll("rect")
    .data(years)
    .enter()
    .append("rect")
    .attr("class", "year-rect")
    .attr("x", 20)
    .attr("y", (d) => yScale(d))
    .attr("width", width_year)
    .attr("height", yScale.bandwidth())
    .attr("fill", (d) => {
        const blockIndex = Math.floor((d - 1965) / 5);
        return basecolors[blockIndex % basecolors.length];
    })
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)

// Draw the strokes between the years
stackGroup
    .selectAll("line")
    .data(years)
    .enter()
    .append("line")
    .attr("x1", 20)
    .attr("x2", 112)
    .attr("y1", (d) => yScale(d) + yScale.bandwidth())
    .attr("y2", (d) => yScale(d) + yScale.bandwidth())
    .attr("stroke", "white")
    .attr("stroke-width", (d) => (d % 5 === 0 ? 1.5 : 0))
    .attr("transform", "translate(0, -5.75)");

// Add year labels
stackGroup
    .selectAll("text")
    .data(years.filter((d) => d % 5 === 0))
    .enter()
    .append("text")
    .attr("x", 15)
    .attr("y", (d) => yScale(d) + yScale.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text((d) => d)
    .style("fill", "black")
    .style("font-size", "8px")
    // make years bigger when hovering over
    .on("mouseover", function(event, d) {
        d3.select(this).style("font-size", "12px");
    })
    .on("mouseout", function(event, d) {
        d3.select(this).style("font-size", "8px");
    });


const selectedRanges = [];
const multiBrushes = [];

// Function to highlight selected years
function resetYearColors() {
    const colors = ["gold", "orange", "lightgreen", "skyblue", "red"];
    const highlightedYears = {};

    selectedRanges.forEach((r, i) => {
        const [start, end] = r.range;
        years.filter((d) => d >= start && d <= end).forEach((year) => {
            highlightedYears[year] = colors[i % colors.length];
        });
    });

    yearRects.transition()
        .attr("fill", (d) => highlightedYears[d] || basecolors[Math.floor((d - 1965) / 5) % basecolors.length]);
}

// Function ro remove a year range from the selection
function removeRange(index) {
    const { group } = selectedRanges[index];

    group.remove();

    selectedRanges.splice(index, 1);
    multiBrushes.splice(index, 1);

    renderRanges();
    resetYearColors();
}


// Function to create a new brush for selecting multiple year ranges
function createBrush() {
    const brushHeight = years.length * yearHeight;
    const horizontalOffset = 22;
    const verticalOffset = 6;

    const newBrush = d3.brushY()
        .extent([[horizontalOffset, verticalOffset], [width_year + horizontalOffset, brushHeight + verticalOffset]])
        .on("brush", function (event) {
            multiBrush.call(this, event, newBrush);
        })
        .on("end", function (event) {
            multiBrush.call(this, event, newBrush);
        });

    const brushGroup = svg_yearselect
        .append("g")
        .attr("class", "multi-brush")
        .attr("transform", `translate(${horizontalOffset}, ${verticalOffset})`)
        .call(newBrush);

    // removing the styling of the brush
    brushGroup.selectAll(".selection")
        .style("fill", "none")
        .style("stroke", "none");

    multiBrushes.push({ brush: newBrush, group: brushGroup });
    resetYearColors();
}

let moveYear = false;

// Function to snap the brush selection to year blocks
function multiBrush(event, currentBrush) {
    // checking if brush really should move
    if (!event.selection || (moveYear)) return;

    const [y0, y1] = event.selection;

    // Snap the brush to the nearest year block boundaries
    const snappedY0 = snapToNearestYear(y0) - yScale.bandwidth() / 2;
    const snappedY1 = snapToNearestYear(y1) + yScale.bandwidth() / 2;

    const snappedSelection = [snappedY0, snappedY1];

    // Move the brush to the snapped position
    moveYear = true;
    d3.select(this).call(currentBrush.move, snappedSelection);
    moveYear = false;

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

// Function to find the closest year to snap to
function snapToNearestYear(y) {
    const yearCenters = years.map((year) => yScale(year) + yScale.bandwidth() / 2);
    return yearCenters.reduce((closest, centerY) => {
        return Math.abs(y - centerY) < Math.abs(y - closest) ? centerY : closest;
    });
}

// Function to update the year ranges
function updateRanges(brush, range) {
    const existingIndex = selectedRanges.findIndex((r) => r.brush === brush);

    if (existingIndex !== -1) {
        // Ensure the group exists
        if (!selectedRanges[existingIndex].group) {
            console.error("Group is missing in selectedRanges at index:", existingIndex);
        }

        selectedRanges[existingIndex].range = range;
    } else {
        // Attempt to find the associated group
        const associatedGroup = multiBrushes.find((b) => b.brush === brush)?.group;

        if (!associatedGroup) {
            console.error("Could not find associated group for brush:", brush);
            return;
        }

        // Add a new range if it doesn't already exist
        selectedRanges.push({ brush, range, group: associatedGroup });
    }
    window.selectedYearRanges = selectedRanges.map(r => r.range);
    renderRanges();
}

// Function to disable the add brush button when 5 ranges are selected (max)
function updateAddBrushButton() {
    const addBrushButton = document.getElementById("addBrushButton");
    if (selectedRanges.length >= 5) {
        addBrushButton.disabled = true;
    } else {
        addBrushButton.disabled = false;
    }
}

// Function to show the selected year ranges on the dashboard, & remove & edit them
function renderRanges() {
    const rangeContainer = document.getElementById("rangeContainer");
    rangeContainer.innerHTML = "";

    selectedRanges.forEach(({ range }, index) => {
        const rangeDiv = document.createElement("div");
        rangeDiv.className = "range-item";
        rangeDiv.textContent = `${range[0]} - ${range[1]}`;

        const removeButton = document.createElement("button");
        removeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M3 6l3 16h12l3-16H3zm16 14H5L4.5 8h15l-.5 12zM9 10h2v8H9zm4 0h2v8h-2zM15 4l-1-1h-4l-1 1H5v2h14V4z"/>
            </svg>`;
        removeButton.onclick = () => {
            removeRange(index);
            updateAddBrushButton();
        };

        const editButton = document.createElement("button");
        editButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm3.37 1.43H5v-1.37l9.44-9.44 1.37 1.37L6.37 18.68zM21 7.34c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.17 1.17 3.75 3.75 1.17-1.17z"/>
            </svg>`;
        editButton.onclick = () => editRange(index);

        rangeDiv.appendChild(removeButton);
        rangeDiv.appendChild(editButton);
        rangeContainer.appendChild(rangeDiv);
    });

    updateAddBrushButton();
    console.log(selectedRanges);
}

// Function to edit the range of a previous created year range
function editRange(index) {
    const { range, group: oldGroup } = selectedRanges[index];

    // Remove the old group from the SVG
    oldGroup.remove();

    // Remove the old range and brush data from arrays
    selectedRanges.splice(index, 1);
    multiBrushes.splice(index, 1);

    // Create a new brush
    const newBrush = d3.brushY()
        .extent([[22, 6], [width_year + 22, years.length * yearHeight + 6]])
        .on("brush", function (event) {
            multiBrush.call(this, event, newBrush);
        })
        .on("end", function (event) {
            multiBrush.call(this, event, newBrush);
        });

    const newGroup = svg_yearselect
        .append("g")
        .attr("class", "multi-brush")
        .attr("transform", `translate(22, 6)`)
        .call(newBrush);

    newGroup.selectAll(".selection")
        .style("fill", "none")
        .style("stroke", "none");

    // Set the new brush to match the range of the old brush
    const [start, end] = range.map((year) => yScale(year) + yScale.bandwidth() / 2);
    newGroup.call(newBrush.move, [start, end]);

    // Add the new brush to the arrays
    multiBrushes.splice(index, 0, { brush: newBrush, group: newGroup });
    selectedRanges.splice(index, 0, { brush: newBrush, range, group: newGroup });

    // Refresh display
    resetYearColors();
    renderRanges();
}

// Event Listener for new brushes
document.getElementById("addBrushButton").addEventListener("click", createBrush);


// ============================================ WEEK SELECTOR =================================================
const margin_week = { top: 10, right: 0, bottom: 20, left: 0 };
const width_week = 200;
const height_week = 50;
const colors_week = ["#777099", "#AFCF9D", "#FFF7D4", "#FFD4A1"];  // Array of colors
const weeks = Array.from({ length: 52 }, (_, i) => i + 1);

// Scale for positioning week blocks horizontally
const xScale = d3.scaleBand()
    .domain(weeks)
    .range([margin_week.left, width_week - margin_week.right])
    .paddingInner(0.1)
    .paddingOuter(0.05);

// Labelling and ticks for X-axis, hierarchy by each 4th week
const xAxis = g => g
    .attr("transform", `translate(${xScale.bandwidth() / 2},${height_week - margin_week.bottom})`)
    .call(d3.axisBottom(xScale)
        .tickValues(weeks.filter(d => d % 4 === 0))
        .tickSize(-height_week + margin_week.top + margin_week.bottom))
    .call(g => g.selectAll(".tick line")
        .attr("stroke", "#FFFFFF")
        .attr("stroke-width", 1)
        .attr("stroke-opacity", 1))
    .call(g => g.selectAll(".tick line")
        .filter(d => d % 4 === 0)
        .attr("stroke-width", 2))
    .call(g => g.selectAll(".tick text")
        .attr("font-size", "12px")
        .attr("fill", "#000"));

const svg_weekselect = d3.select("#weekSelector")
    .attr("viewBox", [0, 0, width_week, height_week]);

// Append rectangles for each week with correct colors ( by season)
svg_weekselect.append("g")
    .selectAll("rect")
    .data(weeks)
    .join("rect")
    .attr("x", d => xScale(d))
    .attr("y", margin_week.top)
    .attr("width", xScale.bandwidth())
    .attr("height", height_week - margin_week.top - margin_week.bottom)
    .attr("fill", (d) => {
        const blockIndex = Math.floor((d - 1) / 13);
        return colors_week[blockIndex % colors_week.length];
    });

svg_weekselect.append("g")
    .call(xAxis);
const brush = d3.brushX()
    .extent([[margin_week.left, margin_week.top], [width_week - margin_week.right, height_week - margin_week.bottom]])
    .on("brush", brushed)
    .on("end", brushended);

// change the fill of the brush
svg_weekselect.append("g")
    .call(brush)
    .select(".selection")
    .attr("fill", "#2CE9EC")
    .attr("fill-opacity", 0.6);

let weekMove = false;

// Function to handle the brushing event, where selection snaps to closest week
function brushed(event) {
    if (!event.selection || weekMove) return;

    const selection = event.selection;
    const x0 = selection[0];
    const x1 = selection[1];

    // Snap to nearest weeks
    const snappedStart = snapToNearestWeek(x0);
    const snappedEnd = snapToNearestWeek(x1);

    const snappedSelection = [
        xScale(snappedStart),
        xScale(snappedEnd) + xScale.bandwidth()
    ];

    weekMove = true;
    d3.select(this).call(brush.move, snappedSelection);
    weekMove = false;
}

// Function to handle the end of brushing, snapping to weeks & updating range
function brushended(event) {
    const selection = event.selection;
    if (!event.sourceEvent || !selection) return;

    const x0 = selection[0];
    const x1 = selection[1];

    const snappedStart = snapToNearestWeek(x0);
    const snappedEnd = snapToNearestWeek(x1);

    const snappedSelection = [
        xScale(snappedStart),
        xScale(snappedEnd) + xScale.bandwidth()
    ];

    const brushSelection = [
        Math.max(margin_week.left, Math.min(width_week - margin_week.right, snappedSelection[0])),
        Math.max(margin_week.left, Math.min(width_week - margin_week.right, snappedSelection[1]))
    ];

    d3.select(this).transition().call(brush.move, brushSelection);

    window.selectedWeekRange = [snappedStart, snappedEnd];
    console.log(`Selected weeks: ${snappedStart} to ${snappedEnd}`);
    weekRangeContainer.innerHTML = `Week ${snappedStart} - ${snappedEnd}`;
}

// Function to snap to the nearest week
function snapToNearestWeek(x) {
    const weekCenters = weeks.map((week) => xScale(week) + xScale.bandwidth() / 2);
    const closestCenter = weekCenters.reduce((closest, centerX) => {
        return Math.abs(x - centerX) < Math.abs(x - closest) ? centerX : closest;
    });

    return weeks[weekCenters.indexOf(closestCenter)];
}

const weekRangeContainer = document.getElementById("weekRangeContainer");