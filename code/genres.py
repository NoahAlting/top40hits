import pandas as pd
import os

from year_filter import merge_features_with_top40, get_data_for_year_range
songs_csv = os.path.join("data", "spotify_songs_with_ids.csv")
top40_csv = os.path.join("data", "top40_with_ids.csv")


def merge_new(songs_csv: str, top40_csv: str) -> pd.DataFrame:
    df_songs = pd.read_csv(songs_csv)
    df_40 = pd.read_csv(top40_csv)

    return pd.merge(df_songs, df_40, left_on='Song_ID', right_on='Song_ID')

# df_merged = merge_features_with_top40(songs_csv, top40_csv)
df_merged = merge_new(songs_csv, top40_csv)

print(f"type of genre column:\t{type(df_merged['Artist_Genres'].iloc[0])}")  # Type of the first value in the column



year = 2018
df = get_data_for_year_range(df_merged, year, year+1)
df['Artist_Genres'] = df['Artist_Genres'].apply(lambda x: x.split(', '))

print(df[['Titel', 'Artist_Genres']].head())

# # Check the result
print(df['Artist_Genres'].head())
print(type(df['Artist_Genres'].iloc[0]))