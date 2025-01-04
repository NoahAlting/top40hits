import pandas as pd

file_path = 'spotify_songs_with_ids.csv'
data = pd.read_csv(file_path)

def min_max_normalize(column):
    min_val = column.min()
    max_val = column.max()
    return (column - min_val) / (max_val - min_val)

data['Normalized_Loudness'] = min_max_normalize(data['Loudness'])
data['Normalized_Popularity'] = min_max_normalize(data['Popularity'])
data['Normalized_Tempo'] = min_max_normalize(data['Tempo'])

print(data[['Artist', 'Title', 'Loudness', 'Popularity', 'Tempo', 'Normalized_Loudness', 'Normalized_Popularity', 'Normalized_Tempo']])

data.to_csv('spotify_songs_with_ids_norm', index=False)