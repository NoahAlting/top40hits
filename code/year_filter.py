import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import os


def merge_features_with_top40(songs_csv, top40_csv):
    df_songs = pd.read_csv(songs_csv)
    df_40 = pd.read_csv(top40_csv, delimiter='\t', encoding='latin1')

    return pd.merge(df_songs, df_40, left_on='Title', right_on='Titel')

def print_row(df_row):
    max_key_length = max(len(key) for key in df_row.keys())  

    for key, value in df_row.items():
        print(f"{key.ljust(max_key_length + 2)}\t{str(value.values[0])}")



if __name__ == "__main__":

    songs_csv = os.path.join("data", "spotify_songs.csv")
    top40_csv = os.path.join("data", "top40-noteringen.csv")

    df = merge_features_with_top40(songs_csv, top40_csv)

    print(df.info())

    first_row = df.head(1)

    print_row(first_row)
    