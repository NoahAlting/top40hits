const infoButton = document.createElement("button_introduction");
const container = document.getElementById("introduction");
var width_container = container.clientWidth;
var height_container = container.clientHeight;
infoButton.id = "information_button_introduction";
infoButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
        <circle cx="12" cy="12" r="20" fill="#007bff"></circle> <!-- Adjusted cy to 13 for more space -->
        <line x1="12" y1="18" x2="12" y2="10" stroke="white" stroke-width="3"></line> <!-- No need to move line if circle is moved -->
        <circle cx="12" cy="6" r="2" fill="white"></circle>
    </svg>`;
infoButton.style.border = "none";
infoButton.style.background = "none";
infoButton.style.cursor = "pointer";
infoButton.style.position = "absolute";
infoButton.style.top = `${height_container * 0.7}px`;
infoButton.style.right = `${0.5 * width_container}px`;

const tooltip = document.createElement("div");
tooltip.id = "information_button_content";
tooltip.style.position = "absolute";
tooltip.style.top = `${height_container * 0.7}px`;
tooltip.style.right = `${width_container / 2 - 600}px`;
tooltip.style.padding = "10px";
tooltip.style.background = "rgba(0, 0, 0, 0.9)";
tooltip.style.color = "white";
tooltip.style.borderRadius = "8px";
tooltip.style.fontSize = "18px";
tooltip.style.maxWidth = "1600px";
tooltip.style.display = "none";
tooltip.style.zIndex = "11";

function createTooltipLine(title, text) {
    const line = document.createElement("div");
    line.style.display = "flex";
    line.style.justifyContent = "flex-start";
    line.style.marginBottom = "17px";

    const titleElement = document.createElement("strong");
    titleElement.textContent = title;
    titleElement.style.flex = "1";
    titleElement.style.textAlign = "left";

    const textElement = document.createElement("span");
    textElement.innerHTML = text;
    textElement.style.flex = "2";
    textElement.style.textAlign = "left";

    line.appendChild(titleElement);
    line.appendChild(textElement);

    return line;
}

tooltip.appendChild(createTooltipLine("General:", "This dashboard is divided into three sections: (1) Year graphs on the left, (2) the Selector dashboard in the center, and (3) Longevity graphs on the right. Each graph has its own description, which you can view by clicking the i-button."));
tooltip.appendChild(createTooltipLine("Filtering Data:", `
    <strong>Year and Week Range:</strong> You can select specific ranges for years and weeks. The data will be filtered accordingly.<br>
    <strong>Selecting Position:</strong> View songs that ranked in the Top 1, 3, 4, 10, 20, or Top 40 each week.<br>
    <strong>Selecting Specific Genre/Feature:</strong> In the probability density graphs, select a specific feature or genre. The two related graphs will update automatically.<br>
    <strong>Genres and Features:</strong> Songs can be categorized by genres or assigned feature scores. Toggle between these two views as needed.`));    
tooltip.appendChild(createTooltipLine("Possible Features:", 
    `There are six features, each ranging from 0 to 1. Below are their descriptions, taken from <a href="https://developer.spotify.com/documentation/web-api/reference/get-audio-features" target="_blank" style="color: #1DB954; text-decoration: underline;">Spotify's Developer Documentation</a>:
    <br><strong>(1) Danceability:</strong> Measures how suitable a track is for dancing, based on factors like tempo, rhythm stability, beat strength, and overall regularity.
    <br><strong>(2) Acousticness:</strong> A confidence score that determines whether a track is acoustic.
    <br><strong>(3) Energy:</strong> Represents the intensity and activity of a track. High-energy tracks tend to feel fast, loud, and noisy.
    <br><strong>(4) Valence:</strong> Describes the positivity of a track's musical mood. Tracks with high valence sound more cheerful or happy.
    <br><strong>(5) Loudness:</strong> The average loudness of a track, measured in decibels (dB), <strong>transformed by</strong> normalizing to a range of 0 to 1.
    <br><strong>(6) Tempo:</strong> The estimated tempo of a track in beats per minute (BPM), <strong>transformed by</strong> normalizing to a range of 0 to 1.`));
tooltip.appendChild(createTooltipLine("Possible Genres:", 
    `The dashboard defines 10 main genres, each encompassing more specific subgenres (some examples are given):
    <br><strong>(1) Pop:</strong> Includes girl groups, boy bands, and comedy musicals.
    <br><strong>(2) Hip-Hop:</strong> Includes rap, Miami bass, and more.
    <br><strong>(3) Rock:</strong> Includes metal, punk, and indie music.
    <br><strong>(4) EDM:</strong> Includes house, techno, and deep house.
    <br><strong>(5) R&B:</strong> Includes soul, funk, and LT Z.
    <br><strong>(6) Country:</strong> Includes bluegrass, folk, and Americana.
    <br><strong>(7) Latin:</strong> Includes salsa, reggaeton, and tropical music.
    <br><strong>(8) Jazz:</strong> Includes blues, fusion, and swing.
    <br><strong>(9) Classical:</strong> Includes opera, symphonies, and orchestral music.
    <br><strong>(10) Reggae:</strong> Includes dancehall, dub, and mento.`));
tooltip.appendChild(createTooltipLine("Longevity Meaning:", `The longevity graphs on the right track how long songs remain in the Top ${window.selectedTop} rankings over a given period. 
    This means that the graphs are categorizing songs based on their duration of success in the top rankings. 
    These graphs help analyze how different songs maintain their position in the charts over time and can provide insights into which features of genres have enduring popularity.`));
tooltip.appendChild(createTooltipLine("Missing Data:",
    'The Spotify API was utilized to automatically collect data on the unique songs in the Top 40 charts. However, not all songs were successfully matched due to several reasons: the artist name or song title may have changed since the Top 40 entry, the Top 40 entry could have included multiple songs, or the song might not be available on Spotify. As a result, when comparing data across year ranges, some datasets will be based on a larger number of entries and more averaged results.   <br>\n' +
    '\n' +
    'Below, a figure illustrates the distribution of missing data. The plots are divided into two categories: total song count (which represents the total number of appearances a song made in the Top 40) and unique song count (which reflects each song’s unique appearance in the Top 40). These plots show the distribution of missing data across both weeks and years.  <br>\n' +
    'In total, there are 123,801 entries for the total song count, of which 11,842 (9.5%) are missing. For the unique song count, there are 14,876 songs, with 1,765 (11.8%) missing.\n <img src="distributions.jpg" alt="Data Distribution" style="width: 1200px; vertical-align: middle; margin-left: 10px;">'));


infoButton.addEventListener("click", (event) => {
    event.stopPropagation();
    tooltip.style.display = tooltip.style.display === "none" ? "block" : "none";
});

document.addEventListener("click", (event) => {
if (!infoButton.contains(event.target) && !tooltip.contains(event.target)) {
    tooltip.style.display = "none";
}
});

container.style.position = "relative";
container.appendChild(infoButton);
container.appendChild(tooltip);
    
  