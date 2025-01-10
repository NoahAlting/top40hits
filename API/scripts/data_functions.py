import numpy as np
import pandas as pd
import os


def merge_song_features_with_top40(songs_csv: str, top40_csv: str) -> pd.DataFrame:
    df_songs = pd.read_csv(songs_csv)
    df_40 = pd.read_csv(top40_csv, delimiter='\t', encoding='latin1')

    return pd.merge(df_songs, df_40, left_on='Title', right_on='Titel')
