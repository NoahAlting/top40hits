// Data structure for years
// ludwig schubert 2016 multiple brush https://github.com/ludwigschubert/d3-brush-multiple

// mapfn -> transforming indices to correspond with years
const years = Array.from({ length: 59 }, (_, i) => 1965 + i);

const svg_yearselect = d3.select("#yearSelector");
const margin = { top: 6, bottom: 6, left: 4, right: 4 };
const width = +svg_yearselect.attr("width") - margin.left - margin.right;
const height = +svg_yearselect.attr("height") - margin.top - margin.bottom;

// Define the height for each year block
const yearHeight = 10;
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

const selectedRanges = [];
const multiBrushes = [];

// Function to highlight selected years
function highlightSelectedYears(selectedYears) {
    yearRects.attr("fill", (d) =>
        selectedYears.includes(d) ? "gold" : "steelblue"
    );
}

function resetYearColors() {
    const colors = ["gold", "orange", "lightgreen", "skyblue"];
    const highlightedYears = {};

    selectedRanges.forEach((r, i) => {
        const [start, end] = r.range;
        years.filter((d) => d >= start && d <= end).forEach((year) => {
            highlightedYears[year] = colors[i % colors.length];
        });
    });

    yearRects.attr("fill", (d) => highlightedYears[d] || "steelblue");
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
    // Create a new brush without clearing any existing selections
    const newBrush = d3.brushY()
        .extent([[0, 0], [width, height]])
        .on("brush", (event) => handleMultiBrush(event, newBrush)) // on brushing (dragging or resizing)
        .on("end", (event) => handleMultiBrush(event, newBrush)); // on brush end (finalizing the selection)

    const brushGroup = svg_yearselect
        .append("g")
        .attr("class", "multi-brush")
        .call(newBrush);

    multiBrushes.push({ brush: newBrush, group: brushGroup });
    resetYearColors();
}

function handleMultiBrush({ selection }, currentBrush) {
    if (!selection) return;

    const [y0, y1] = selection;
    const selectedYears = years.filter((d) => {
        const y = yScale(d) + yScale.bandwidth() / 2;
        return y >= y0 && y <= y1;
    });

    if (selectedYears.length > 0) {
        const range = [selectedYears[0], selectedYears[selectedYears.length - 1]];
        updateRanges(currentBrush, range);
        resetYearColors();
    }
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