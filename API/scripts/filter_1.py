import numpy as np
import pandas as pd
import os


def merge_features_with_top40(songs_csv: str, top40_csv: str) -> pd.DataFrame:
    df_songs = pd.read_csv(songs_csv)
    df_40 = pd.read_csv(top40_csv, delimiter='\t', encoding='latin1')

    return pd.merge(df_songs, df_40, left_on='Title', right_on='Titel')

def get_data_for_year_range(df: pd.DataFrame, start_year: int, end_year: int) -> pd.DataFrame:
    df_filtered = df[(df['Jaar'] >= start_year) & (df['Jaar'] <= end_year)]
    
    return df_filtered


def song_features_for_time_interval(df_merged: pd.DataFrame, lower_bound_year: int, upper_bound_year: int):
    
    df_filtered = get_data_for_year_range(df_merged, lower_bound_year, upper_bound_year)

    df_song_features = df_filtered[[
        'Danceability', 
        'Acousticness', 
        'Energy', 
        'Liveness', 
        'Loudness', 
        'Valence', 
        'Speechiness'
        ]
    ]
    print(f'filtered data for range [{lower_bound_year}, {upper_bound_year}]')
    return df_song_features
    # # # Export to JSON
    # df_song_features.to_json(os.path.join('code', 'noah', "filtered_song_features.json"), orient="records")

