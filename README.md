# HitSpot Dashboard

## Overview
The **HitSpot Dashboard** is an interactive web application for analyzing the longevity and popularity of songs based on features and genres. It provides dynamic visualizations powered by **D3.js**, allowing users to explore song trends over time using radial charts, line graphs, scatterplots, and more. The dataset includes information sourced from **Gerrit Mantel's Sub Top 40** and the **Spotify Web API**.

## Features
- **Interactive Visualizations**: Explore song longevity and feature distributions using scatterplots, bar charts, and radial graphs.
- **Genre & Feature Selection**: Toggle between genres and song features to analyze trends.
- **Customizable Year & Week Selection**: Use interactive sliders to filter data by time range.
- **Dynamic Tooltips**: Hover over elements to get in-depth details about each data point.

## Installation & Setup
### Prerequisites
Ensure you have a web browser with JavaScript enabled. The project runs as a static web page and does not require a server.

### Running the Project
1. Clone or download the project files.
2. Open `index.html` in a web browser.
3. The dashboard will load with interactive charts and data selection options.

## Data
- **`data/`**: Contains CSV files with song rankings, feature scores and other metadata used for generationg visualizations.

## File Structure
### HTML & CSS
- **`index.html`**: Main entry point containing the structure of the dashboard.
- **`indexstyle.css`**: Styles for the dashboard, including grid layout and chart styling.

### JavaScript Modules
- **Global Variables**:
  - `global_variables.js`: Defines constants for song features, genre keywords, color scales and interactive updating functions.

- **User Interaction & Selection**:
  - `selection_typetop.js`: Manages genre/feature toggle buttons and top-position selectors.
  - `selection_yearweek.js`: Implements interactive year and week selection using brush snapping.
  - `Feature_Genre_selectors.js`: Handles the selection of features/genres of interest by displaying the probability density functions (PDFs) for features and bar charts for genres.

- **Charts & Visualizations**:
  - `longevity_detailPlots.js`: Generates scatterplots and line charts for song longevity.
  - `Longevity_radialCharts.js`: Creates radial charts for longevity categories.
  - `radial_plot.js`: Displays average feature values for songs per week using a radial format.
  - `LineGraph_overTime.js`: Generates a time-series line graph showing weekly trends across the selected years.
  

- **UI Elements & Buttons**:
  - `information_button.js`: Creates information buttons with tooltips for different charts.
  - `introduction_button.js`: Provides an overview tooltip for the dashboard.



## Usage Guide
- **Selecting Year Ranges**: Click "Add Range" to create custom year selections.
- **Filtering by Features & Genres**: Use the toggle buttons to switch between genre-based and feature-based visualizations.
- **Interpreting Radial Charts**: Colors indicate different longevity categories; hover to see details.
- **Exploring Trends Over Time**: The line graph shows weekly trends across multiple years.

## Credits
- **Data Sources**: [Gerrit Mantel's Sub Top 40](https://gerritmantel.nl/sub_top40.html), [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- **Libraries Used**: [D3.js](https://d3js.org/)

## License
This project is for educational and analytical purposes. If using or modifying, please provide attribution.

