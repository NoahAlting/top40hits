import os
import time
import pandas as pd

from fastapi import FastAPI, HTTPException
from API.scripts import filter_1 as f1
from API.scripts import filter_2 as f2

#define paths to data to use
cwd = os.getcwd()
spotify_csv = os.path.join(cwd, "data", "spotify_songs_with_ids.csv")
top40_csv = os.path.join(cwd, "data", "top40_with_ids.csv")

#read csv as dataframe
df_spotify = pd.read_csv(spotify_csv)
df_40 = pd.read_csv(top40_csv)

# Initialize FastAPI app
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Welcome to the music data API!"}

@app.get("/endpoint1")
async def endpoint1(timerange: tuple[int, int]):
    try:
        #input timerange is (begin_year, end_year)
        result = f1.filter_on_year(df_spotify, timerange)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/endpoint2")
async def endpoint2(month: int):
    try:
        result = f2.filter_on_month()
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
