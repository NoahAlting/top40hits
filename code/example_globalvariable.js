

// Listen for the 'yearRangeUpdated' event
window.addEventListener('yearRangeUpdated', function (event) {
    document.getElementById("selectedYearRangesValue").innerText = JSON.stringify(window.selectedYearRanges);
    console.log("updating year range")
});

window.addEventListener('weekRangeUpdated', function (event) {
    document.getElementById("selectedWeekRangeValue").innerText = JSON.stringify(window.selectedWeekRange);
    console.log("updating week range")
});

window.addEventListener('typeUpdated', function (event) {
    document.getElementById("selectedTypeValue").innerText = window.selectedType;
    console.log("updating type value", window.selectedType)
});

window.addEventListener('topUpdated', function (event) {
    document.getElementById("selectedTopValue").innerText = window.selectedTop;
    console.log("updating top value", window.selectedTop)
});



function updateGlobalVariablesDisplay() {
    // Update the HTML content with the current global variables
    document.getElementById("selectedTypeValue").innerText = window.selectedType;
    document.getElementById("selectedTopValue").innerText = window.selectedTop;
    document.getElementById("selectedYearRangesValue").innerText = JSON.stringify(window.selectedYearRanges);
    document.getElementById("selectedWeekRangeValue").innerText = JSON.stringify(window.selectedWeekRange);
}

updateGlobalVariablesDisplay();