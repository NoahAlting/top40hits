// ============================================ Manual determined variables ============================================
// Features that are taken into account
const possible_features_songs = [
    "Danceability",
    "Acousticness",
    "Energy",
    // "Liveness",
    "Valence",
    // "Speechiness",
    "Normalized_Loudness", 
    // "Normalized_Popularity", 
    "Normalized_Tempo",
  ];

  
// Keywords for the genres
const genreKeywords = {
  "pop": ["pop", "boy band", "girl group", "bubblegum dance", "british invasion", "beatlesque", "disco", "hi-nrg", "a cappella", "synthesizer", "disco, post-disco", "disco, motown", "deep disco", "boogie", "itolo disco", "new italo disco", "vintage french electronic", "super eurobeat", "rare groove", "adult standards", "easy listening", "chanson", "chanson, ye ye", "chanson, chanson paillarde", "vintage chanson", "vintage chanson, ye ye", "ballroom, easy listening", "easy listening, lounge", "deep adult standards", "novelty", "novelty, outsider", "british invasion, merseybeat", "british invasion, vaudeville", "british comedy", "comedy musical", "workout product"],
  "hip-hop": ["hip-hop", "rap", "hip hop", "grime", "afroswing", "perreo", "old school nederhop", "freestyle", "miami bass", "atlanta bass, miami bass", "uk garage", "breakbeat, nu skool breaks", "uk garage, 2-step", "new beat", "new beat, rave"],
  "rock": ["rock", "metal", "punk", "alternative", "indie", "alternative rock", "garage rock", "gothic rock", "post-punk", "dark clubbing", "shoegaze", "nu metal", "neo-singer-songwriter", "stomp and holler", "grunge", "madchester", "punk rock", "hard rock", "classic rock"],
  "edm": ["edm", "house", "techno", "trance", "dubstep", "drum and bass", "bassline", "big beat", "big room", "deep house", "progressive house", "trap", "psytrance", "hardstyle", "tekno", "rave", "tech house", "electronica", "downtempo", "dubstep, drum and bass", "big beat, breakbeat", "big beat, downtempo, electronica, trip hop", "breakbeat", "breakbeat, trip hop", "deep talent show", "electronica, trip hop", "deep eurodance", "belgian dance", "belgian dance, euphoric hardstyle", "eurodance", "swedish eurodance", "italo dance", "german dance", "basshall", "hands up", "jumpstyle", "gabber", "happy hardcore", "gabber, happy hardcore", "jumpstyle", "big beat, soundtrack", "big beat, trip hop", "freestyle, miami bass", "big beat, electronica", "freestyle, post-disco"],
  "r&b": ["r&b", "rhythm and blues", "soul", "funk", "new jack swing", "quiet storm", "afrobeats", "neo mellow", "neo mellow, singer-songwriter", "adult contemporary", "lilith", "alt z", "idol", "british singer-songwriter", "black thrash", "vocal harmony group", "gospel", "soul music", "classic sierreno, musica sonorense", "smooth jazz"],
  "country": ["country", "bluegrass", "folk", "americana", "alt-country", "bluegrass, americana", "old country", "honky-tonk", "celtic", "bush ballad", "cowboy western", "nashville sound", "dutch americana", "friese muziek", "german americana"],
  "latin": ["latin", "salsa", "reggaeton", "bossa nova", "mambo", "merengue", "tropical", "soca, vincy soca", "sega, sega mauricien", "musique guadeloupe, zouk", "zouk", "bossa nova", "salsa, reggaeton", "canzone napoletana, italian romanticism, post-romantic era", "flamenco, rumba, world", "rumba, rumba catalana", "flamenco electronica", "german soundtrack, orchestral soundtrack, scorecore, soundtrack"],
  "jazz": ["jazz", "blues", "fusion", "smooth jazz", "neo-soul", "funk jazz", "vintage jazz", "free jazz", "bebop", "dixieland", "swing", "latin jazz", "electro swing"],
  "classical": ["classical", "opera", "symphony", "baroque", "chamber music", "early romantic era", "german romanticism", "orchestral soundtrack", "scorecore", "classic soundtrack", "vintage italian soundtrack", "orchestral", "french classical music", "musical advocacy"],
  "reggae": ["reggae", "ska", "dancehall", "rocksteady", "dub", "roots reggae", "reggae fusion", "dubstep", "reggae dub", "mento", "afroswing"]
};
let possible_genres = Object.keys(genreKeywords);
const remaining_genres = "other";

const viridisScale = d3.scaleSequential(d3.interpolateCool).domain([0, 5]);


// ============================================ Functions ============================================
// This function determined the coloring of the year ranges
function get_color_yearRange(selected_range, all_ranges) {
  var colorScale = d3
    .scaleSequential(d3.interpolateCool)
    .domain([0, 5]);
  let index = all_ranges.indexOf(selected_range);
  return colorScale(index+1);
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


const dragHandleLeft = document.getElementById("drag-handle-left");
const root1 = document.documentElement;

// Initial column sizes
let initialLineGraphWidth = 2; // Represents 2fr
let initialSelectorWidth = 1; // Represents 1fr

dragHandleLeft.addEventListener("mousedown", (e) => {
    const startX = e.clientX;

    const onMouseMove = (event) => {
        const delta = event.clientX - startX;

        // Adjust column sizes based on the drag delta
        const totalWidth = initialLineGraphWidth + initialSelectorWidth;
        const newLineGraphWidth = Math.max(1.4, initialLineGraphWidth + delta / window.innerWidth * totalWidth);
        const newSelectorWidth = totalWidth - newLineGraphWidth;

        // Update CSS variables
        root1.style.setProperty("--linegraph-width", `${newLineGraphWidth}fr`);
        root1.style.setProperty("--selector-width", `${newSelectorWidth}fr`);
    };

    const onMouseUp = () => {
        // Remove listeners when the drag ends
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        // Update initial sizes
        initialLineGraphWidth = parseFloat(root1.style.getPropertyValue("--linegraph-width") || initialLineGraphWidth);
        initialSelectorWidth = parseFloat(root1.style.getPropertyValue("--selector-width") || initialSelectorWidth);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
});



// ============================================ Filter data and update graphs ============================================

// NEW PROPOSED FUNCTION WHERE CSV IS LOADED IN

let cachedSpotifySongs = null;
let cachedTop40Data = null;

let cachedGenreData = {}; // Cache for filtered genre data by genre

function filter_data() {
    // Initialize genre or feature menu
    if (window.selectedType == "features") {
        createFeatureGenreMenu(possible_features_songs);
    } else {
        createFeatureGenreMenu(possible_genres.concat(remaining_genres));
    }

    return new Promise((resolve, reject) => {
        const selected_weeks = window.selectedWeekRange;
        const max_top = window.selectedTop;
        const selectedType = window.selectedType; // "genres" or "features"
        const selected_ranges = window.selectedYearRanges
            .sort((a, b) => a[0] - b[0])
            .map(range => (range[0] === range[1] ? [range[0]] : range));

        // Load and cache the original datasets if not already cached
        if (!cachedSpotifySongs || !cachedTop40Data) {
            Promise.all([
                d3.csv("../data/spotify_songs_with_ids_norm.csv"),
                d3.csv("../data/top40_with_ids.csv"),
            ]).then(([data_spotifySongs, data_top40]) => {
                // Cache the original datasets
                cachedSpotifySongs = data_spotifySongs;
                cachedTop40Data = data_top40;

                if (selectedType === "genres") {
                    // Filter by genre if type is "genres"
                    const genreDataByGenre = processAllGenresFilter(cachedSpotifySongs);

                    // Process the data for each genre separately
                    const dataByGenre = {};
                    possible_genres.concat(remaining_genres).forEach(genre => {
                        const genreData = genreDataByGenre[genre] || [];
                        const filtered_data = [];
                        processData(selected_ranges, selected_weeks, max_top, genre, genreData, cachedTop40Data, filtered_data);
                        dataByGenre[genre] = filtered_data;
                    });

                    resolve(dataByGenre); // Return data grouped by genre
                } else {
                    // Process the data for features
                    const filtered_data = [];
                    processData(selected_ranges, selected_weeks, max_top, null, cachedSpotifySongs, cachedTop40Data, filtered_data);
                    resolve(filtered_data); // Return a single array of filtered data
                }
                
            }).catch(err => {
                console.error("Error loading data:", err);
                reject(err);
            });
        } else {
            if (selectedType === "genres") {
                // Filter and cache all genres
                const genreDataByGenre = processAllGenresFilter(cachedSpotifySongs);

                // Process the data for each genre separately
                const dataByGenre = {};
                possible_genres.concat(remaining_genres).forEach(genre => {
                    const genreData = genreDataByGenre[genre] || [];
                    const filtered_data = [];
                    processData(selected_ranges, selected_weeks, max_top, genre, genreData, cachedTop40Data, filtered_data);
                    dataByGenre[genre] = filtered_data;
                });

                resolve(dataByGenre); // Return data grouped by genre
            } else {
                // Process the data for features
                const filtered_data = [];
                processData(selected_ranges, selected_weeks, max_top, null, cachedSpotifySongs, cachedTop40Data, filtered_data);
                resolve(filtered_data); // Return a single array of filtered data
            }
        }
    });
}

// Separate function to filter and cache genre data
function processAllGenresFilter(data_spotifySongs) {
    possible_genres.forEach(genre => {
        if (!cachedGenreData[genre]) {
            const genreKeywordsList = genreKeywords[genre.toLowerCase()] || [];
            cachedGenreData[genre] = data_spotifySongs.filter(row => {
                if (row.Artist_Genres && typeof row.Artist_Genres === "string") {
                    return genreKeywordsList.some(keyword => row.Artist_Genres.toLowerCase().includes(keyword));
                }
                return false;
            });
        }
    });

    cachedGenreData[remaining_genres] = data_spotifySongs.filter(row => {
      if (row.Artist_Genres && typeof row.Artist_Genres === "string") {
          let isMatched = false;
          for (const genre of possible_genres) {
              const genreKeywordsList = genreKeywords[genre.toLowerCase()] || [];
              if (genreKeywordsList.some(keyword => row.Artist_Genres.toLowerCase().includes(keyword))) {
                  isMatched = true;
                  break;
              }
          }
          return !isMatched;
      }
      return false;
  });

    return cachedGenreData;
}

// Updated processData to use cached genre data or the full dataset as needed
function processData(selected_ranges, selected_weeks, max_top, selectedGenre, data_spotifySongs, data_top40, filtered_data) {
    // Use a Map for faster lookups instead of .find() on large datasets
    const spotifySongsMap = new Map(data_spotifySongs.map(song => [song.Song_ID, song]));

    selected_ranges.forEach(range_years => {
        const yearRange_data = data_top40
            .filter(row => (+row.Jaar >= range_years[0] && +row.Jaar <= range_years[1]) || +row.Jaar === range_years[0])
            .filter(row => +row.Weeknr >= selected_weeks[0] && +row.Weeknr <= selected_weeks[1])
            .filter(row => +row.Deze_week <= max_top)
            .map(data_top40_row => {
                const songData = spotifySongsMap.get(data_top40_row.Song_ID);
                if (songData) {
                    const mergedRow = {
                        ...data_top40_row,
                        ...songData,
                    };
                    // Remove unwanted columns
                    const excludedFields = [
                        'Album', 'Artiest', 'Artist_Country',
                        'Artist_Followers', 'Artist_Popularity',
                         'Status', 'Vorige_week', 'undefined'
                    ];
                    excludedFields.forEach(field => delete mergedRow[field]);
                    return mergedRow;
                }
                return null;
            })
            .filter(row => row !== null);
        filtered_data.push(...yearRange_data);
    });
}

// All functions to graphs that take all features or genres as input
function update_graphs_all_FeaturesGenres(filtered_data){
  if (window.selectedType === "features"){
    update_radial_features(filtered_data);
  }
  update_LongevityRadialGraph(filtered_data);
}

// All functions to graphs that take one genre or one feature as input
function update_graphs_selected_FeatureGenre(filtered_data){
  updateLineGraph(filtered_data);
    if (window.selectedType === "features"){
      update_scat_features(filtered_data, selectedGenre);
    }
    else{
        renderGenrePlot(filtered_data, selectedGenre);
    }
}


// All functions that highlight the selected year
function highlight_selection(selectedRange) {
  linegraph_yearhighlight(selectedRange);
  longevity_radialChart_yearhighlight(selectedRange);
    if (window.selectedType === "genres"){
        longevity_genre_yearhighlight(selectedRange);
    }

}



// ============================================ Event functions, if one of the global variables has changed ============================================
// When top is updated
window.addEventListener("topUpdated", function () {
  filter_data().then(output_filtered_data => {
    update_graphs_all_FeaturesGenres(output_filtered_data);
    update_graphs_selected_FeatureGenre(output_filtered_data);
  }).catch(err => {
    console.error("Error filtering data:", err);
  });
});

// When year range is updated
window.addEventListener("yearRangeUpdated", function () {
  filter_data().then(output_filtered_data => {
    update_graphs_all_FeaturesGenres(output_filtered_data);
    update_graphs_selected_FeatureGenre(output_filtered_data);
  }).catch(err => {
    console.error("Error filtering data:", err);
  });
});
  
// When week range is updated
window.addEventListener("weekRangeUpdated", function () {
  filter_data().then(output_filtered_data => {
    update_graphs_all_FeaturesGenres(output_filtered_data);
    update_graphs_selected_FeatureGenre(output_filtered_data);
  }).catch(err => {
    console.error("Error filtering data:", err);
  });
});


// When type (genres/ featres) is updated
window.addEventListener("typeUpdated", function () {
  const selectedRadialPlot = document.getElementById('radial-plot');
  if (window.selectedType == "features") {
    selectedRadialPlot.style.visibility = 'visible';
    selectedRadialPlot.style.opacity = '1';
    createFeatureGenreMenu(possible_features_songs, true);
  } else {
    selectedRadialPlot.style.visibility = 'hidden';
    selectedRadialPlot.style.opacity = '0';
    createFeatureGenreMenu(possible_genres.concat(remaining_genres), true);
  }
  updateLongevityChartContent();
  filter_data().then(output_filtered_data => {
    update_graphs_all_FeaturesGenres(output_filtered_data);
    update_graphs_selected_FeatureGenre(output_filtered_data);
  }).catch(err => {
    console.error("Error filtering data:", err);
  });
  
});

document.addEventListener('DOMContentLoaded', () => {
  filter_data()
     .then(output_filtered_data => {
      update_graphs_all_FeaturesGenres(output_filtered_data);
      update_graphs_selected_FeatureGenre(output_filtered_data);
     })
     .catch(err => console.error("Error initializing chart:", err));
});


window.addEventListener("selectedRangeUpdated", function () {
    const selectedRange = window.selectedRange;
    highlight_selection(selectedRange)
    console.log("selected range:", window.selectedRange);

});