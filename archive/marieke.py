import pandas as pd
import matplotlib.pyplot as plt
import os
import numpy as np

spotify_csv = os.path.join("../data", "spotify_songs_with_ids.csv")
top_40_csv = os.path.join("../data", "top40_with_ids.csv")

spotify_data = pd.read_csv(spotify_csv, delimiter=",")
top40 = pd.read_csv(top_40_csv, delimiter=',', encoding='latin1')
print(top40.keys())
print(spotify_data.keys())

def get_dict_feature(feature, year):
    top40_year = top40.loc[top40.Jaar == year]
    feature_dict = dict()
    notFound_no = 0
    notFound_song = []
    for i, (index, row) in enumerate(top40_year.iterrows()):
        artist = row['Artiest']
        song_title = row['Titel']
        song_ID = row['Song_ID']
        spotify_row = spotify_data.loc[(spotify_data['Song_ID'] == song_ID)]
        if not spotify_row.empty:
            feature_value = spotify_row[feature].iloc[0]
            if feature == 'Loudness':
                feature_value /= -60
            elif feature == 'Tempo':
                feature_value /= 300
            if row['Weeknr'] in feature_dict:
                feature_dict[row['Weeknr']].append(feature_value)
            else:
                feature_dict[row['Weeknr']] = [feature_value]
        else:
            if artist + song_title not in notFound_song:
                notFound_song.append(artist + song_title)
                notFound_no += 1
    return feature_dict, notFound_no

def checkMatchesCSV(year):
    top40_year = top40.loc[top40.Jaar == year]
    artist_song_lst = []
    for i, (index, row) in enumerate(top40_year.iterrows()):
        artist = row['Artiest']
        song_title = row['Titel']
        song_ID = row["Song_ID"]
        spotify_row = spotify_data.loc[(spotify_data['Song_ID'] == song_ID)]
        if spotify_row.empty:
            artist_song = [artist, song_title]
            if artist_song not in artist_song_lst:
                artist_song_lst.append(artist_song)
                print(artist_song)
    return artist_song_lst

for year in [2020, 2021, 2022, 2023, 2024]:
    print("--------------")
    print(f"Year {year}")
    artist_song_lst = checkMatchesCSV(year)
    print(f"In total: {len(artist_song_lst)}")

# for feature in ['Danceability']: #, 'Acousticness', 'Energy', 'Liveness', 'Loudness', 'Valence', 'Tempo', 'Speechiness']:
#     year1 = 1970
#     year2 = 2023
#     feature_dict1, notFound_year1 = get_dict_feature(feature, year1)
#     print(f'For {year1} there are {notFound_year1} songs not found in the spotify API.')
#     feature_dict2, notFound_year2 = get_dict_feature(feature, year2)
#     print(f'For {year2} there are {notFound_year2} songs not found in the spotify API.')
#
#     values_year1 = [value for values in feature_dict1.values() for value in values]
#     values_year2 = [value for values in feature_dict2.values() for value in values]
#     bins = np.arange(0, 1, 0.1)
#     plt.figure(figsize=(10, 6))
#     plt.hist(values_year1, bins=bins, alpha=0.5, label=year1, color='blue', edgecolor='black')
#     plt.hist(values_year2, bins=bins, alpha=0.5, label=year2, color='red', edgecolor='black')
#     plt.title(f"Histogram of {feature} Values (Top 40 Songs, {year1} vs {year2})")
#     plt.xlabel(feature)
#     plt.ylabel("Frequency")
#     plt.legend()
#     plt.show()