"""Model 4: estimated food-insecure households with a pet, by NJ county.
   pet_households = food_insecure_people / avg household size * pet ownership share
   Pet ownership share: 47% of NJ households own a pet (APPA 2023-24, via Pet Advocacy Network state sheet).
   Lower-income households own pets a bit less often, so we also show a conservative 38% (about 20% lower).
   Household size: NJ average 2.6 (Census ACS 2019-2023). Numbers are estimates, rounded to the nearest 100."""
import sys, json
import pandas as pd
HH = 2.6; SHARE_HI = 0.47; SHARE_LO = 0.38
d = json.load(open(sys.argv[1]))
rows = []
for c in d["counties"]:
    hh = c["food_insecure_people"] / HH
    c["pet_hh_est"] = int(round(hh * SHARE_HI, -2))
    c["pet_hh_low"] = int(round(hh * SHARE_LO, -2))
    rows.append((c["county"], c["food_insecure_people"], c["pet_hh_low"], c["pet_hh_est"]))
d["pet_need"] = {
    "method": "food_insecure_people / 2.6 people per household * 47% pet ownership (low: 38%)",
    "sources": {"pet_share": "APPA National Pet Owners Survey 2023-2024, NJ: 47% of households own a pet (Pet Advocacy Network state data sheet)",
                "household_size": "U.S. Census Bureau ACS 2019-2023, NJ average household size 2.6",
                "food_insecurity": d["sources"].get("food_insecurity", "")},
    "total_est": int(sum(c["pet_hh_est"] for c in d["counties"])), "total_low": int(sum(c["pet_hh_low"] for c in d["counties"])),
}
json.dump(d, open(sys.argv[1], "w"))
t = pd.DataFrame(rows, columns=["county", "food_insecure_people", "pet_hh_low", "pet_hh_est"]).sort_values("pet_hh_est", ascending=False)
print(t.to_string(index=False)); print("NJ total est:", d["pet_need"]["total_est"], "low:", d["pet_need"]["total_low"])
