import pandas as pd
import matplotlib.pyplot as plt
import os

spotify_csv = os.path.join("data", "spotify_songs.csv")
top_40_csv = os.path.join("data", "top40-noteringen.csv")

spotify_data = pd.read_csv(spotify_csv, delimiter=",")
top40 = pd.read_csv(top_40_csv, delimiter='\t', encoding='latin1')
print(top40.keys())
print(spotify_data.keys())

year = 2023
top40_year = top40.loc[top40.Jaar == year]
danceability = dict()
for i, (index, row) in enumerate(top40_year.iterrows()):
        artist = row['Artiest']
        song_title = row['Titel']
        spotify_row = spotify_data.loc[(spotify_data['Artist'] == artist) &
                                       (spotify_data['Title'] == song_title)]
        
        if not spotify_row.empty:
            danceability_value = spotify_row['Danceability'].iloc[0]
            if row['Weeknr'] in danceability:
                danceability[row['Weeknr']].append(danceability_value)
            else:
                danceability[row['Weeknr']] = [danceability_value]