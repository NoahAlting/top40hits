const possible_features_songs = [
    "Danceability",
    "Acousticness",
    "Energy",
    "Liveness",
    "Valence",
    "Speechiness",
  ];
  
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

function get_color_yearRange(selected_range, all_ranges) {
    var colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain([0, 4]);
    let index = all_ranges.indexOf(selected_range);
    return colorScale(index);
  }