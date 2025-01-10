import os
import time
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


from API.scripts import data_functions
from API.scripts import filter_1 as f1
from API.scripts import filter_2 as f2

#define paths to data to use
cwd = os.getcwd()
spotify_csv = os.path.join(cwd, "data", "spotify_songs_with_ids.csv")
top40_csv = os.path.join(cwd, "data", "top40-noteringen.csv")

#read csvs as dataframe
df_all = data_functions.merge_song_features_with_top40(spotify_csv,top40_csv)


class TimeRange(BaseModel):
    years: tuple[int, int]

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500"],  # Adjust to match your frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/")
async def root():
    return {"message": "Welcome to the music data API!"}


@app.post("/song_features_interval")
async def get_song_features_interval(timerange: TimeRange):
    try:
        years = timerange.years
        df_features_in_range = f1.song_features_for_time_interval(df_all, *years)

        # Check if the DataFrame is empty
        if df_features_in_range.empty:
            return {"message": "No data found for the given range", "data": []}

        # Save result to a file (optional)
        cache_dir = os.path.join('code', 'noah', "filtered_song_features.json")
        df_features_in_range.to_json(cache_dir, orient="records")

        return {"message": "Data retrieved successfully"}

    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/endpoint2")
async def endpoint2(month: int):
    try:
        result = f2.filter_on_month()
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
