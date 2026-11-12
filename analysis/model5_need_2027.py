"""Model 5: 2027 pet-food need, by NJ county (scenario projection, not a forecast with error bars).
Inputs: Map the Meal Gap food-insecurity rates for 2020 and 2023 (NJ Office of the Food Security Advocate,
Dec 2025 chart book) and official 2023 counts. 2020 was held down by pandemic relief, so the full
2020-23 rise is not a trend to extend. Two scenarios:
  steady : 2023 rate holds through 2027
  rising : rate keeps rising at half the 2020-23 yearly pace for 4 more years
Pet households = people / 2.6 * 47% (same as model 4). Population held at 2023 levels.
Run: python3 analysis/model5_need_2027.py analysis/nj_counties.csv data/need_2027.json"""
import json, sys
import pandas as pd

R2020 = {"Atlantic":15.1,"Bergen":7.9,"Burlington":7.1,"Camden":10.9,"Cape May":12.5,"Cumberland":12.1,"Essex":12.3,"Gloucester":8.2,"Hudson":12.2,"Hunterdon":5.5,"Mercer":8.3,"Middlesex":8.4,"Monmouth":7.8,"Morris":6.4,"Ocean":9.8,"Passaic":12.0,"Salem":11.7,"Somerset":5.7,"Sussex":7.6,"Union":8.3,"Warren":8.9}
HH, PET = 2.6, 0.47
d = pd.read_csv(sys.argv[1])
d["rate_2020"] = d.county.map(R2020)
d["yearly_change"] = (d.food_insecure_2023 - d.rate_2020) / 3
d["rate_2027_rising"] = (d.food_insecure_2023 + 0.5 * d.yearly_change.clip(lower=0) * 4).round(1)
pop23 = d.food_insecure_people_2023 / (d.food_insecure_2023 / 100)
d["people_2027_steady"] = d.food_insecure_people_2023
d["people_2027_rising"] = (pop23 * d.rate_2027_rising / 100).round(-1).astype(int)
for s in ("steady", "rising"):
    d[f"pet_hh_2027_{s}"] = (d[f"people_2027_{s}"] / HH * PET).round(-2).astype(int)
out = d[["county", "rate_2020", "food_insecure_2023", "rate_2027_rising", "food_insecure_people_2023", "people_2027_rising", "pet_hh_2027_steady", "pet_hh_2027_rising"]].sort_values("pet_hh_2027_rising", ascending=False)
print(out.to_string(index=False))
tot = {k: int(out[k].sum()) for k in ["pet_hh_2027_steady", "pet_hh_2027_rising", "food_insecure_people_2023", "people_2027_rising"]}
print(tot)
json.dump({"method": __doc__.split("Run:")[0].strip(), "totals": tot, "counties": out.to_dict("records")}, open(sys.argv[2], "w"), indent=1)
