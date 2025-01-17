// ============================================ Manual determined variables ============================================
// Features that are taken into account
const possible_features_songs = [
    "Danceability",
    "Acousticness",
    "Energy",
    "Liveness",
    "Valence",
    "Speechiness",
  ];
  
// Keywords for the genres
const genreKeywords = {
    "pop": ["pop"],
    "hip-hop": ["hip-hop", "rap"],
    "rock": ["rock", "metal", "punk", "alternative"],
    "edm": ["edm", "house", "techno", "trance", "dubstep", "drum and bass"],
    "r&b": ["r&b", "rhythm and blues", "soul", "funk"],
    "country": ["country", "bluegrass", "folk"],
    "latin": ["latin", "salsa", "reggaeton", "bossa nova"],
    "jazz": ["jazz", "blues", "fusion"],
    "classical": ["classical", "opera", "symphony"],
    "reggae": ["reggae", "ska", "dancehall"]
};
let possible_genres = Object.keys(genreKeywords); 

// ============================================ Functions ============================================
// This function determined the coloring of the year ranges
function get_color_yearRange(selected_range, all_ranges) {
  var colorScale = d3
    .scaleSequential(d3.interpolateViridis)
    .domain([0, 4]);
  let index = all_ranges.indexOf(selected_range);
  return colorScale(index);
}

// Selection menu to select one genre or one feature
function createFeatureGenreMenu(options_drop_down, switched_type=false) {
  const menuContainer = d3.select("#genre_feature_menu");
  menuContainer.selectAll("*").remove();
  if (switched_type == true){
    window.selectedGenre = options_drop_down[0];
  }

  const dropdown = menuContainer.append("select")
      .attr("id", "genre_feature_dropdown")
      .on("change", function () {
          const selectedGenre = d3.select(this).property("value");
          window.selectedGenre = selectedGenre;
          filter_data()
              .then(output_filtered_data => {
                  update_graphs_selected_FeatureGenre(output_filtered_data);
              })
              .catch(err => {
                  console.error("Error filtering data:", err);
              });
      });
  dropdown.selectAll("option")
      .data(options_drop_down)
      .enter()
      .append("option")
      .attr("value", (d) => d)
      .text((d) => d[0].toUpperCase() + d.slice(1))
      .property("selected", (d) => d === window.selectedGenre);
}

// ============================================ Filter data and update graphs ============================================

// NEW PROPOSED FUNCTION WHERE CSV IS LOADED IN
// let cachedSpotifySongs = null;
// let cachedTop40Songs = null;
//
// async function loadData() {
//     if (!cachedSpotifySongs) {
//         cachedSpotifySongs = await d3.csv("../data/spotify_songs_with_ids.csv", d3.autoType);
//     }
//     if (!cachedTop40Songs) {
//         cachedTop40Songs = await d3.csv("../data/top40_with_ids.csv", d3.autoType);
//     }
// }
//
// function filter_data() {
//     if (window.selectedType == "features") {
//         createFeatureGenreMenu(possible_features_songs);
//     } else {
//         createFeatureGenreMenu(possible_genres);
//     }
//
//     return new Promise(async (resolve, reject) => {
//         try {
//             // Ensure data is loaded and cached
//             await loadData();
//
//             // Use cached data
//             const data_spotifySongs = cachedSpotifySongs;
//             const data_top40 = cachedTop40Songs;
//
//             let filtered_data = [];
//             const selected_weeks = window.selectedWeekRange;
//             const max_top = window.selectedTop;
//             const selectedType = window.selectedType;
//             const selectedGenre = window.selectedGenre;
//             const selected_ranges = window.selectedYearRanges
//                 .sort((a, b) => a[0] - b[0])
//                 .map(range => (range[0] === range[1] ? [range[0]] : range));
//
//             // Data processing
//             data_spotifySongs.forEach(row => {
//                 row[selectedGenre] = +row[selectedGenre];
//             });
//
//             selected_ranges.forEach(range_years => {
//                 const yearRange_data = data_top40
//                     .filter(row => (+row.Jaar >= range_years[0] && +row.Jaar <= range_years[1]) || +row.Jaar === range_years[0])
//                     .filter(row => +row.Weeknr >= selected_weeks[0] && +row.Weeknr <= selected_weeks[1])
//                     .filter(row => +row.Deze_week <= max_top)
//                     .map(data_top40_row => {
//                         const songData = data_spotifySongs.find(song => song.Song_ID === data_top40_row.Song_ID);
//                         if (songData) {
//                             const mergedRow = {
//                                 ...data_top40_row,
//                                 ...songData,
//                             };
//                             // Remove unwanted columns
//                             const excludedFields = [
//                                 'Album', 'Artiest', 'Artist', 'Artist_Country',
//                                 'Artist_Followers', 'Artist_Popularity', 'Artist_Song',
//                                 'Title', 'Titel', 'Status', 'Vorige_week', 'undefined', 'Aantal_weken',
//                             ];
//                             excludedFields.forEach(field => delete mergedRow[field]);
//                             return mergedRow;
//                         }
//                         return null;
//                     })
//                     .filter(row => row !== null);
//                 filtered_data.push(...yearRange_data);
//             });
//
//             resolve(filtered_data);
//         } catch (err) {
//             console.error("Error loading data:", err);
//             reject(err);
//         }
//     });
// }
// // Function that filter data on years, weeks and max_top. Also removes unnecessary columns
function filter_data() {
  if (window.selectedType == "features"){
    createFeatureGenreMenu(possible_features_songs);
  }
  else{
      createFeatureGenreMenu(possible_genres);
  }
  return new Promise((resolve, reject) => {
    let filtered_data = [];
    const selected_weeks = window.selectedWeekRange;
    const max_top = window.selectedTop;
    const selectedType = window.selectedType;
    const selectedGenre = window.selectedGenre;
    const selected_ranges = window.selectedYearRanges
      .sort((a, b) => a[0] - b[0])
      .map(range => (range[0] === range[1] ? [range[0]] : range));

    Promise.all([
      d3.csv("../data/spotify_songs_with_ids.csv"),
      d3.csv("../data/top40_with_ids.csv"),
    ]).then(([data_spotifySongs, data_top40]) => {
      data_spotifySongs.forEach(row => {
        row[selectedGenre] = +row[selectedGenre];
      });

      selected_ranges.forEach(range_years => {
        const yearRange_data = data_top40
          .filter(row => (+row.Jaar >= range_years[0] && +row.Jaar <= range_years[1]) || +row.Jaar === range_years[0])
          .filter(row => +row.Weeknr >= selected_weeks[0] && +row.Weeknr <= selected_weeks[1])
          .filter(row => +row.Deze_week <= max_top)
          .map(data_top40_row => {
            const songData = data_spotifySongs.find(song => song.Song_ID === data_top40_row.Song_ID);
            if (songData) {
              const mergedRow = {
                ...data_top40_row,
                ...songData,
              };
              // Remove unwanted columns
              const excludedFields = [
                'Album', 'Artiest', 'Artist', 'Artist_Country',
                'Artist_Followers', 'Artist_Popularity', 'Artist_Song',
                'Title', 'Titel', 'Status', 'Vorige_week', 'undefined', 'Aantal_weken',
              ];
              excludedFields.forEach(field => delete mergedRow[field]);
              return mergedRow;
            }
            return null;
          })
          .filter(row => row !== null);
        filtered_data.push(...yearRange_data);
      });

      resolve(filtered_data);
    }).catch(err => {
      console.error("Error loading data:", err);
      reject(err);
    });
  });
}

// All functions to graphs that take all features or genres as input
function update_graphs_all_FeaturesGenres(filtered_data){
  update_LongevityRadialGraph(filtered_data);
}

// All functions to graphs that take one genre or one feature as input
function update_graphs_selected_FeatureGenre(filtered_data){ 
  updateLineGraph(filtered_data);
}

// ============================================ Event functions, if one of the global variables has changed ============================================
// When top is updated
window.addEventListener("topUpdated", function () {
  document.getElementById("selectedTopValue").innerText = window.selectedTop;
  filter_data().then(output_filtered_data => {
    update_graphs_all_FeaturesGenres(output_filtered_data);
    update_graphs_selected_FeatureGenre(output_filtered_data);
  }).catch(err => {
    console.error("Error filtering data:", err);
  });
});

// When year range is updated
window.addEventListener("yearRangeUpdated", function () {
  document.getElementById("selectedYearRangesValue").innerText = JSON.stringify(window.selectedYearRanges);
  filter_data().then(output_filtered_data => {
    update_graphs_all_FeaturesGenres(output_filtered_data);
    update_graphs_selected_FeatureGenre(output_filtered_data);
  }).catch(err => {
    console.error("Error filtering data:", err);
  });
});
  
// When week range is updated
window.addEventListener("weekRangeUpdated", function () {
  document.getElementById("selectedWeekRangeValue").innerText = JSON.stringify(window.selectedWeekRange);
  filter_data().then(output_filtered_data => {
    update_graphs_all_FeaturesGenres(output_filtered_data);
    update_graphs_selected_FeatureGenre(output_filtered_data);
  }).catch(err => {
    console.error("Error filtering data:", err);
  });
});

// When type (genres/ featres) is updated
window.addEventListener("typeUpdated", function () {
  document.getElementById("selectedTypeValue").innerText = window.selectedType;
  if (window.selectedType == "features"){
    createFeatureGenreMenu(possible_features_songs, true)
  }
  else{
    createFeatureGenreMenu(possible_genres, true);
  }
  filter_data().then(output_filtered_data => {
    update_graphs_all_FeaturesGenres(output_filtered_data);
    update_graphs_selected_FeatureGenre(output_filtered_data);
  }).catch(err => {
    console.error("Error filtering data:", err);
  });
  
});
