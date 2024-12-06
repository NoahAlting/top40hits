import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import os


if __name__ == "__main__":

    songs_csv = os.path.join("data", "spotify_songs.csv")
    df_songs = pd.read_csv(songs_csv)

    top40_csv = os.path.join("data", "top40-noteringen.csv")
    df_40 = pd.read_csv(top40_csv)

    print(df_40.info())
    
    