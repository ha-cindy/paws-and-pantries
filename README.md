# Paws & Pantries

Free pet food and low-cost pet care help in New Jersey, starting with Middlesex County.

When families can't afford pet food, people skip meals or give up their pets. Paws & Pantries helps by:

- **Find help:** a bilingual, source-labeled (English and Spanish) map and list of pet food pantries, food pantries that give pet food, and low-cost vet and spay clinics.
- **NJ need dashboard:** which counties have the highest food need, using public state data.
- **Pets who wait:** which adopted shelter pets wait longest, from an analysis of Austin Animal Center records.

Live site: https://ha-cindy.github.io/paws-and-pantries/

## Data and methods

- `data/resources.json`: listings. Local listings are added only after a phone or email check.
- `data/counties.json`: NJ county need score and groups. Built by `analysis/model3.py` (standardized average of food insecurity, poverty, limited food access, unemployment; k-means checked against hierarchical clustering) from `analysis/nj_counties.csv`, which comes from the NJ Office of the Food Security Advocate's Dec 2025 chart book.
- `data/wait.json`: length-of-stay regression for adopted cats and dogs at the Austin Animal Center (Oct 2013 to Jul 2024). Built by `analysis/build_stays.py` and `analysis/model1.py`; `analysis/model1.R` reproduces the key results in R.
- County shapes: US Census county boundaries via the plotly/datasets GeoJSON.

A solo project by Cindy Ha, MS in Marketing Analytics and Insights, Rutgers Business School.

## Model checks (added Nov 11, 2026)
- `analysis/model1_holdout.py`: trains the wait model on 2014 to 2022 adoptions and tests it on 2023 to 2024. Writes `data/wait_holdout.json` (test results, final coefficients for the site predictor, slow-20% cutoff).
- `analysis/model4_pet_need.py`: estimates food-insecure households with a pet per county (food-insecure people / 2.6 per household x 47% NJ pet ownership; low bound 38%). Adds `pet_hh_est` and `pet_hh_low` to `data/counties.json`.
