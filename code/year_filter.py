import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import os
from tqdm import tqdm
from matplotlib.cm import viridis

def merge_features_with_top40(songs_csv: str, top40_csv: str) -> pd.DataFrame:
    df_songs = pd.read_csv(songs_csv)
    df_40 = pd.read_csv(top40_csv, delimiter='\t', encoding='latin1')

    return pd.merge(df_songs, df_40, left_on='Title', right_on='Titel')

def print_row(df_row):
    max_key_length = max(len(key) for key in df_row.keys())  

    for key, value in df_row.items():
        print(f"{key.ljust(max_key_length + 2)}\t{str(value.values[0])}")


def song_data_in_week(df: pd.DataFrame, year: int, week: int) -> pd.DataFrame:
    df_year = df[(df['Jaar'] == year) & (df['Weeknr'] == week)]

    return df_year


def get_data_for_year_range(df: pd.DataFrame, start_year: int, end_year: int) -> pd.DataFrame:
    df_filtered = df[(df['Jaar'] >= start_year) & (df['Jaar'] <= end_year)]
    
    return df_filtered


def plot_data_per_week(df: pd.DataFrame, column_name: str):

    x_axis = 'Weeknr'

    if column_name not in df.columns:
        raise KeyError(f"Column '{column_name}' not found in DataFrame.")
    if x_axis not in df.columns:
        raise KeyError(f"Column '{x_axis}' not found in DataFrame.")

    # Group by Weeknr and calculate the mean of the column
    grouped = df.groupby(x_axis)[column_name].mean().reset_index()

    # Plot the data
    plt.figure(figsize=(10, 6))
    plt.plot(grouped[x_axis], grouped[column_name], marker='o', linestyle='-', label=f"Average {column_name}")
    plt.title(f"Average {column_name} per Week")
    plt.xlabel("Week Number")
    plt.ylabel(f"Average {column_name}")
    plt.legend()
    plt.grid(True)
    plt.show()

def plot_data_per_week_multiple_dfs(dfs: dict, column_name: str):
    """
    Plots the average of the specified column per week for multiple DataFrames,
    using colors from the viridis colormap for the labels.

    Args:
        dfs (dict): A dictionary where keys are labels (e.g., year ranges) and values are DataFrames.
        column_name (str): The name of the column to plot.

    Raises:
        KeyError: If the column is not found in any of the DataFrames.
    """
    x_axis = 'Weeknr'

    # Check column existence in all DataFrames
    for label, df in dfs.items():
        if column_name not in df.columns:
            raise KeyError(f"Column '{column_name}' not found in DataFrame for '{label}'.")
        if x_axis not in df.columns:
            raise KeyError(f"Column '{x_axis}' not found in DataFrame for '{label}'.")

    # Initialize the plot
    plt.figure(figsize=(12, 8))

    # Get a list of colors from the viridis colormap
    cmap = viridis  # Use the viridis colormap
    colors = cmap(np.linspace(0, 1, len(dfs)))  # Generate evenly spaced colors

    # Process each DataFrame
    for (label, df), color in zip(dfs.items(), colors):
        # Group by Weeknr and calculate the mean of the column
        grouped = df.groupby(x_axis)[column_name].mean().reset_index()

        # Plot the data for the current DataFrame with its color
        plt.plot(grouped[x_axis], grouped[column_name], marker='o', linestyle='-', label=f"{label}", color=color)

    # Add plot details
    plt.title(f"Average {column_name} per Week Across Year Selections", size=16)
    plt.xlabel("Week Number")
    plt.ylabel(f"Average {column_name}")
    plt.legend(title="Year Selections")
    plt.grid(True)
    plt.show()

def create_multi_attribute_radar_plot(df: pd.DataFrame, column_names: list, title=''):
    x_axis = 'Weeknr'

    if x_axis not in df.columns:
        raise KeyError(f"Column '{x_axis}' not found in DataFrame.")

    # Ensure the column_names list contains only valid numeric columns
    valid_columns = [
        col for col in column_names if col in df.columns and np.issubdtype(df[col].dtype, np.number)
    ]
    if not valid_columns:
        raise ValueError("None of the specified columns are numeric and valid for plotting.")

    # Group by Weeknr and calculate the mean for numeric columns
    grouped = df.groupby(x_axis)[valid_columns].mean().reset_index()

    # Prepare data for the radar plot
    weeks = grouped[x_axis].tolist()
    angles = np.linspace(0, 2 * np.pi, len(weeks), endpoint=False).tolist()
    angles += angles[:1]  # Close the radar plot

    # Initialize the radar plot
    fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))

    # Plot each attribute
    for column in valid_columns:
        values = grouped[column].tolist()
        values += values[:1]  # Close the plot for each attribute
        ax.plot(angles, values, marker='o', linestyle='-', label=column)

    # Add labels and legend
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(weeks, fontsize=10)
    ax.set_title("Radar Plot of Weekly Averages", size=16, pad=20)
    ax.grid(True)
    plt.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1))

    # Show the plot
    plt.title(f'features for the year {title}')
    plt.show()


def create_yearly_dataframes(df: pd.DataFrame, start_year: int, end_year: int, step: int):

        dfs = {}
        for year in tqdm(range(start_year, end_year, step), desc='year interval'):
            range_end = min(year + step - 1, end_year)  # Avoid overshooting the end year
            label = f"{year}-{range_end}"
            dfs[label] = get_data_for_year_range(df, year, range_end)
        return dfs


if __name__ == "__main__":

    songs_csv = os.path.join("data", "spotify_songs.csv")
    top40_csv = os.path.join("data", "top40-noteringen.csv")

    df = merge_features_with_top40(songs_csv, top40_csv)
    
    # plot_data_per_week(df_filtered, 'Danceability')

    attr_list = ['Danceability', 'Energy', 'Valence']
    # create_multi_attribute_radar_plot(df_filtered, attr_list)

    # for year in range(1980, 1990):
    #     df_year = get_data_for_year_range(df, start_year=year, end_year=year)
    #     attr_list = ['Danceability', 'Energy', 'Valence']
    #     create_multi_attribute_radar_plot(df_year, attr_list, title=year)


    

    # Example usage
    # dfs = create_yearly_dataframes(df, start_year=1965, end_year=2020, step=5)


    # Call the function with the column you want to plot
    # plot_data_per_week_multiple_dfs(dfs, column_name="Energy")
    # plot_data_per_week_multiple_dfs(dfs, column_name="Acousticness")
    # plot_data_per_week_multiple_dfs(dfs, column_name="Valence")

    year = 1970
    df_filtered = get_data_for_year_range(df, year, year+1)


    print(f'amount of songs between {year}-{year+1}:\t{len(df_filtered)}')
    
    df_song_features = df_filtered[['Danceability', 
                            'Acousticness', 
                            'Energy', 
                            'Liveness', 
                            'Loudness', 
                            'Valence', 
                            'Speechiness']]

    # Export to JSON
    df_song_features.to_json(os.path.join('code', 'noah', "filtered_song_features.json"), orient="records")


    