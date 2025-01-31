import pandas as pd
import matplotlib.pyplot as plt

import pandas as pd
import matplotlib.pyplot as plt

# Load the dataset
df = pd.read_csv('../data/top40_with_ids.csv')

# === FIRST COMPARISON: TOTAL SONGS vs. MISSING SONGS ===

# Count total songs per Year and Week
total_songs_per_year = df.groupby('Jaar').size()
total_songs_per_week = df.groupby('Weeknr').size()

# Count missing Song_IDs per Year and Week (including duplicates)
missing_songs_per_year = df[df['Song_ID'].isna()].groupby('Jaar').size()
missing_songs_per_week = df[df['Song_ID'].isna()].groupby('Weeknr').size()

# Align indices to avoid mismatches
missing_songs_per_year = missing_songs_per_year.reindex(total_songs_per_year.index, fill_value=0)
missing_songs_per_week = missing_songs_per_week.reindex(total_songs_per_week.index, fill_value=0)

# === SECOND COMPARISON: UNIQUE SONGS vs. UNIQUE MISSING SONGS ===

# Remove duplicates based on 'Artiest' (Artist) & 'Titel' (Title)
unique_songs = df.drop_duplicates(subset=['Artiest', 'Titel'])

# Unique songs per Year and per Week
unique_songs_per_year = unique_songs.groupby('Jaar').size()
unique_songs_per_week = unique_songs.groupby('Weeknr').size()

# Unique missing songs (Songs without Song_ID, but unique by Artist & Title)
unique_missing_songs = df[df['Song_ID'].isna()].drop_duplicates(subset=['Artiest', 'Titel'])

# Unique missing songs per Year and per Week
unique_missing_songs_per_year = unique_missing_songs.groupby('Jaar').size()
unique_missing_songs_per_week = unique_missing_songs.groupby('Weeknr').size()

# Align indices
unique_missing_songs_per_year = unique_missing_songs_per_year.reindex(unique_songs_per_year.index, fill_value=0)
unique_missing_songs_per_week = unique_missing_songs_per_week.reindex(unique_songs_per_week.index, fill_value=0)

# === PRINT TOTAL COUNTS ===
total_unique_songs = len(unique_songs)
total_unique_missing_songs = len(unique_missing_songs)
total_unique_included_songs = total_unique_songs - total_unique_missing_songs
total_missing_songs = df['Song_ID'].isna().sum()  # Includes duplicates
length_missing = len(missing_songs_per_year)
total_length = len(total_songs_per_year)

print(f"Total Songs: {length_missing}")
print(f"Total Missing Songs: {total_length}")
print(f"Total Unique Songs: {total_unique_songs}")
print(f"Total Unique Missing Songs: {total_unique_missing_songs}")
print(f"Total Unique Included Songs: {total_unique_included_songs}")
print(f"Total Missing Songs (Including Duplicates): {total_missing_songs}")

# === PLOTTING ===

# Color scheme:
color_total = 'lightgray'  # Total songs
color_missing = 'salmon'  # Missing songs
color_unique = 'silver'  # Unique songs
color_unique_missing = 'royalblue'  # Unique missing songs


def add_min_max_labels(ax, data):
    """Annotate min and max values on a bar plot."""
    if len(data) == 0:
        return
    min_val = data.min()
    max_val = data.max()
    min_year = data.idxmin()
    max_year = data.idxmax()

    ax.text(min_year, min_val, f"Min: {min_val}", ha='center', va='bottom', fontsize=18, color='black')
    ax.text(max_year, max_val, f"Max: {max_val}", ha='center', va='bottom', fontsize=18, color='black')

font_size = 20
# Plot 1: Total Songs vs. Missing Songs per Year
fig, ax = plt.subplots(figsize=(12, 8))
ax.bar(total_songs_per_year.index, total_songs_per_year, label="Total Songs", color=color_total)
ax.bar(missing_songs_per_year.index, missing_songs_per_year, label="Missing Songs", color=color_missing)
ax.set_xlabel('Year', fontsize=font_size)
ax.set_ylabel('Number of Songs', fontsize=font_size)
ax.legend(fontsize=font_size)
ax.grid(axis='y', linestyle='--', alpha=0.7)
add_min_max_labels(ax, missing_songs_per_year)
plt.xticks(rotation=45, fontsize=font_size)
plt.yticks(fontsize=font_size)
plt.tight_layout()
plt.show()

# Plot 2: Total Songs vs. Missing Songs per Week
fig, ax = plt.subplots(figsize=(12, 8))
ax.bar(total_songs_per_week.index, total_songs_per_week, label="Total Songs", color=color_total)
ax.bar(missing_songs_per_week.index, missing_songs_per_week, label="Missing Songs", color=color_missing)
ax.set_xlabel('Week Number', fontsize=font_size)
ax.set_ylabel('Number of Songs', fontsize=font_size)
ax.legend(fontsize=font_size)
ax.grid(axis='y', linestyle='--', alpha=0.7)
add_min_max_labels(ax, missing_songs_per_week)
plt.xticks(rotation=45, fontsize=font_size)
plt.yticks(fontsize=font_size)
plt.tight_layout()
plt.show()

# Plot 3: Unique Songs vs. Unique Missing Songs per Year
fig, ax = plt.subplots(figsize=(12, 8))
ax.bar(unique_songs_per_year.index, unique_songs_per_year, label="Unique Songs", color=color_unique)
ax.bar(unique_missing_songs_per_year.index, unique_missing_songs_per_year, label="Unique Missing Songs", color=color_unique_missing)
ax.set_xlabel('Year', fontsize=font_size)
ax.set_ylabel('Number of Unique Songs', fontsize=font_size)
ax.legend(fontsize=font_size)
ax.grid(axis='y', linestyle='--', alpha=0.7)
add_min_max_labels(ax, unique_missing_songs_per_year)
plt.xticks(rotation=45, fontsize=font_size)
plt.yticks(fontsize=font_size)
plt.tight_layout()
plt.show()

# Plot 4: Unique Songs vs. Unique Missing Songs per Week
fig, ax = plt.subplots(figsize=(12, 8))
ax.bar(unique_songs_per_week.index, unique_songs_per_week, label="Unique Songs", color=color_unique)
ax.bar(unique_missing_songs_per_week.index, unique_missing_songs_per_week, label="Unique Missing Songs", color=color_unique_missing)
ax.set_xlabel('Week Number', fontsize=font_size)
ax.set_ylabel('Number of Unique Songs', fontsize=font_size)
ax.legend(fontsize=font_size)
ax.grid(axis='y', linestyle='--', alpha=0.7)
add_min_max_labels(ax, unique_missing_songs_per_week)
plt.xticks(rotation=45, fontsize=font_size)
plt.yticks(fontsize=font_size)
plt.tight_layout()
plt.show()
