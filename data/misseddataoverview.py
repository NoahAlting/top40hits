import pandas as pd
import matplotlib.pyplot as plt

# Load the dataset (replace 'your_file.csv' with your actual file name)
df = pd.read_csv('top40_with_ids.csv')

# Filter the rows where Song_ID is missing
missing_song_id_df = df[df['Song_ID'].isna()]

# Plot 1: Songs without Song_ID per Year
yearly_missing_song_id = missing_song_id_df.groupby('Jaar').size()

plt.figure(figsize=(10, 6))
yearly_missing_song_id.plot(kind='bar', color='skyblue')
plt.title('Songs Without Song_ID by Year')
plt.xlabel('Year')
plt.ylabel('Number of Songs')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# Plot 2: Songs without Song_ID per Week
weekly_missing_song_id = missing_song_id_df.groupby('Weeknr').size()

plt.figure(figsize=(10, 6))
weekly_missing_song_id.plot(kind='bar', color='salmon')
plt.title('Songs Without Song_ID by Week')
plt.xlabel('Week Number')
plt.ylabel('Number of Songs')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

unique_missing_songs = missing_song_id_df.drop_duplicates(subset=['Artiest', 'Titel'])

# Plot 1: Unique songs without Song_ID per Year
yearly_missing_song_id = unique_missing_songs.groupby('Jaar').size()

plt.figure(figsize=(10, 6))
yearly_missing_song_id.plot(kind='bar', color='skyblue')
plt.title('Unique Songs Without Song_ID by Year')
plt.xlabel('Year')
plt.ylabel('Number of Unique Songs')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# Plot 2: Unique songs without Song_ID per Week
weekly_missing_song_id = unique_missing_songs.groupby('Weeknr').size()

plt.figure(figsize=(10, 6))
weekly_missing_song_id.plot(kind='bar', color='salmon')
plt.title('Unique Songs Without Song_ID by Week')
plt.xlabel('Week Number')
plt.ylabel('Number of Unique Songs')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()