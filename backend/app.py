from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd


app = FastAPI()

origins = [
       "http://localhost:8080",  # Your Vue.js app
   ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows the specified origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],   # Allows all headers
)


df = pd.read_csv("../../eBird Data 2019-2024/ebd_IN-MH-MS_201901_202401_unv_smp_relSep-2024.txt", delimiter='\t',
                 low_memory=False,
                 usecols=['COMMON NAME',
                   'OBSERVATION COUNT',
                   'LATITUDE', 'LONGITUDE'],
                 nrows=2000
                )

df['OBSERVATION COUNT'] = pd.to_numeric(df['OBSERVATION COUNT'], errors='coerce')
df = df.rename(columns={'LATITUDE': 'lat', 'LONGITUDE': 'lng'})
unique_species = list(df['COMMON NAME'].value_counts().keys())
print(unique_species[:5])


@app.get("/speciesList", response_model=List[str])
async def get_speciesList():
    # Mock data for the example
    return unique_species


@app.get("/locationData/{species_name}", response_model=List[dict])
async def get_location_data(species_name: str):
    # Mock data for the example
    tdf = df[df['COMMON NAME'] == species_name]
    if(len(tdf)):
        location_data = tdf.loc[tdf.index.repeat(tdf['OBSERVATION COUNT'])].to_dict(orient='records')
        print(location_data[:2])
        return location_data
    return []
