import json
import os
import pandas as pd

# Read your data
df = pd.read_csv("data.csv")
GRID_SIZE = 0.0015

# Calculate total counts per species and rank them
species_totals = df.groupby("COMMON NAME")["OBSERVATION COUNT"].sum().sort_values(ascending=False)
species_list = []

# Create ranked species list with counts
for species, count in species_totals.items():
    species_list.append({
        "name": species,
        "count": int(count),
        "rank": len(species_list) + 1  # Rank starts at 1 and increases
    })


# Create observations data
observations = {}
for species_info in species_list:
    species = species_info["name"]
    tdf = df[df["COMMON NAME"] == species]

    # Create monthly data
    monthly_data = {}
    for month in range(1, 13):
        month_df = tdf[tdf["month"] == month]

        if len(month_df) > 0:
            # Grid aggregation
            month_df.loc[:, "lat_grid"] = (month_df["lat"] // GRID_SIZE) * GRID_SIZE
            month_df.loc[:, "lng_grid"] = (month_df["lng"] // GRID_SIZE) * GRID_SIZE

            aggregated = (
                month_df.groupby(["lat_grid", "lng_grid"])
                .agg(count=("OBSERVATION COUNT", "sum"))
                .reset_index()
                .rename(columns={"lat_grid": "lat", "lng_grid": "lng"})
            )

            aggregated["count"] = aggregated["count"].clip(upper=1000)
            monthly_data[str(month)] = aggregated.to_dict(orient="records")

    observations[species] = monthly_data

# Create output directories
os.makedirs("../frontend/public/data/species", exist_ok=True)

# Save species list
with open("../frontend/public/data/species-list.json", "w") as f:
    json.dump(species_list, f)

# Save individual species files
for species_info in species_list:
    species = species_info["name"]
    species_filename = species.lower().replace(" ", "-")
    with open(f"../frontend/public/data/species/{species_filename}.json", "w") as f:
        json.dump(observations[species], f)
