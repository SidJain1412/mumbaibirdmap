import warnings
warnings.filterwarnings('ignore')
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

GRID_SIZE = 0.0015

df = pd.read_csv("data.csv")
unique_species = list(df['COMMON NAME'].unique())
print(unique_species[:5])


@app.get("/speciesList", response_model=List[str])
async def get_speciesList():
    return unique_species

AGGREGATE = True
@app.get("/locationData/{species_name}", response_model=List[dict])
async def get_location_data(species_name: str, month: int = None):
    # Filter by species name
    tdf = df[df['COMMON NAME'] == species_name]
    print(species_name, month)

    # Apply month filter if specified
    if month is not None:
        tdf = tdf[tdf['month'] == month]

    if len(tdf):
        if AGGREGATE:
            # Create grid columns based on latitude and longitude
            tdf.loc[:, 'lat_grid'] = (tdf['lat'] // GRID_SIZE) * GRID_SIZE
            tdf.loc[:, 'lng_grid'] = (tdf['lng'] // GRID_SIZE) * GRID_SIZE

            # Group by grid and aggregate observation counts
            aggregated_data = (tdf.groupby(['lat_grid', 'lng_grid'])
                                .agg(count=('OBSERVATION COUNT', 'sum'))
                                .reset_index())
            aggregated_data['count'].clip(upper=1000, inplace=True)

            # Prepare the final result
            location_data = aggregated_data.rename(columns={'lat_grid': 'lat', 'lng_grid': 'lng'}).to_dict(orient='records')
        else:
            location_data = tdf.loc[tdf.index.repeat(tdf['OBSERVATION COUNT'])].to_dict(orient='records')
        return location_data
    return []
