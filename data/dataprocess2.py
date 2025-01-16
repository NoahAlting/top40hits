import pandas as pd
genre_keywords = {
    "pop": ["pop"],
    "hip-hop": ["hip-hop", "rap"],
    "rock": ["rock", "metal", "punk", "alternative"],
    "edm": ["edm", "house", "techno", "trance", "dubstep", "drum and bass"],
    "r&b": ["r&b", "rhythm and blues", "soul", "funk"],
    "soul": ["soul", "motown"],
    "country": ["country", "bluegrass", "folk"],
    "latin": ["latin", "salsa", "reggaeton", "bossa nova"],
    "jazz": ["jazz", "blues", "fusion"],
    "classical": ["classical", "opera", "symphony"],
    "reggae": ["reggae", "ska", "dancehall"],
}

# Map genres to numeric IDs
genre_id_map = {genre: idx for idx, genre in enumerate(genre_keywords.keys(), start=1)}
genre_id_map["other"] = len(genre_id_map) + 1
genre_id_map["unknown"] = 0  #

def preprocess_data(spotify_file_path, output_file_path):
    """
    Preprocesses the Spotify songs dataset to add a numeric "Genre_IDs" column
    and saves the result to a new file.

    Args:
        spotify_file_path (str): Path to the input Spotify CSV file.
        output_file_path (str): Path to save the preprocessed CSV file.
    """
    spotify_songs = pd.read_csv(spotify_file_path)

    def classify_genres(artist_genres):
        """
        Classifies the genres of an artist based on the defined keywords.

        Args:
            artist_genres (str): String containing the artist's genres.

        Returns:
            list[int]: List of genre IDs or [0] (unknown) if no matches are found.
        """
        if pd.isna(artist_genres):  # Missing data
            return [genre_id_map["unknown"]]
        matching_genres = [
            genre_id_map[genre]
            for genre, keywords in genre_keywords.items()
            if any(keyword in artist_genres.lower() for keyword in keywords)
        ]
        return matching_genres if matching_genres else [genre_id_map["other"]]

    spotify_songs["Genre_IDs"] = spotify_songs["Artist_Genres"].apply(classify_genres)

    spotify_songs.to_csv(output_file_path, index=False)
    print(f"Preprocessed data saved to {output_file_path}")

# Example usage
input_file = "spotify_songs_with_ids_norm.csv"
output_file = "spotify_songs_with_genre_ids_norm.csv"

preprocess_data(input_file, output_file)