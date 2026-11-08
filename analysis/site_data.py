"""Build the site's JSON data files from the model outputs and NJ county shapes."""
import json, math, sys
import numpy as np, pandas as pd

scratch, repo = sys.argv[1], sys.argv[2]

# ---- counties: need score + groups + svg paths
need = pd.read_csv(f"{scratch}/out/nj_need.csv")
grp_name = {}
for k, g in need.groupby("kmeans"):
    names = set(g.county)
    grp_name[k] = "south" if "Cumberland" in names else ("urban" if "Essex" in names else "other")
geo = json.load(open(f"{scratch}/geo/us_counties.json"))
feats = [f for f in geo["features"] if f["id"].startswith("34")]
lat0 = 40.2; kx = math.cos(math.radians(lat0))
pts = [(c[0], c[1]) for f in feats for poly in (f["geometry"]["coordinates"] if f["geometry"]["type"] == "Polygon" else [p for mp in f["geometry"]["coordinates"] for p in mp]) for c in poly]
minx = min(p[0] for p in pts) * kx; maxx = max(p[0] for p in pts) * kx
miny = min(p[1] for p in pts); maxy = max(p[1] for p in pts)
W, H = 340, 520; pad = 10
s = min((W - 2 * pad) / (maxx - minx), (H - 2 * pad) / (maxy - miny))
def P(c): return (pad + (c[0] * kx - minx) * s, pad + (maxy - c[1]) * s)
def ring(r):
    xy = [P(c) for c in r]
    return "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in xy) + "Z"
out = []
for f in feats:
    name = f["properties"]["NAME"]
    rings = f["geometry"]["coordinates"] if f["geometry"]["type"] == "Polygon" else [p for mp in f["geometry"]["coordinates"] for p in mp]
    row = need[need.county == name].iloc[0]
    xs = [P(c) for c in rings[0]]
    out.append({
        "county": name, "path": "".join(ring(r) for r in rings),
        "cx": round(sum(x for x, _ in xs) / len(xs), 1), "cy": round(sum(y for _, y in xs) / len(xs), 1),
        "need_score": float(row.need_score), "group": grp_name[row.kmeans],
        "food_insecure_pct": float(row.food_insecure_2023), "child_food_insecure_pct": float(row.child_food_insecure_2023),
        "poverty_pct": float(row.poverty_pct), "limited_access_pct": float(row.limited_food_access_pct),
        "unemployment_pct": float(row.unemployment_2024), "population": int(row.population_2024),
        "food_insecure_people": int(row.food_insecure_people),
    })
out.sort(key=lambda d: -d["need_score"])
json.dump({"viewBox": f"0 0 {W} {round(pad * 2 + (maxy - miny) * s)}", "counties": out,
           "sources": {"food_insecurity": "Feeding America, Map the Meal Gap (2023), via NJ Office of the Food Security Advocate chart book, Dec 2025",
                       "poverty": "US Census ACS 2019-2023, via the same chart book",
                       "limited_access": "County Health Rankings / USDA Food Access Research Atlas (2019), via the same chart book",
                       "unemployment": "NJ Dept. of Labor (2024), via the same chart book",
                       "population": "US Census Bureau (2024), via the same chart book"}},
          open(f"{repo}/data/counties.json", "w"), separators=(",", ":"))

# ---- wait model
a = pd.read_csv(f"{scratch}/out/adopted_model_data.csv")
wait = {"source": "Austin Animal Center intakes and outcomes, Oct 2013 to Jul 2024 (City of Austin open data)", "species": {}}
for sp in ["Cat", "Dog"]:
    t = pd.read_csv(f"{scratch}/out/model1_{sp.lower()}.csv", index_col=0)
    d = a[a["Animal Type"] == sp]
    def g(k): return {"pct": float(t.loc[k, "pct_change_in_stay"]), "lo": float(t.loc[k, "ci_low"]), "hi": float(t.loc[k, "ci_high"])}
    pre = "C(age_grp, Treatment('Young (1-3)'))[T."
    eff = {"age_baby": g(pre + "Baby (<1)]"), "age_adult": g(pre + "Adult (4-7)]"), "age_senior": g(pre + "Senior (8+)]"),
           "black": g("black"), "female": g("female")}
    if sp == "Dog": eff["pit_type"] = g("pit_type")
    med = d.groupby("age_grp").los_days.agg(["count", "median"]).round(1)
    wait["species"][sp.lower()] = {"n": int(len(d)), "median_days": float(round(d.los_days.median(), 1)), "effects": eff,
        "median_by_age": {k: {"n": int(v["count"]), "median": float(v["median"])} for k, v in med.iterrows()}}
json.dump(wait, open(f"{repo}/data/wait.json", "w"), indent=1)
print("counties", len(out), "viewBox", W, "x", round(pad * 2 + (maxy - miny) * s))
print(json.dumps(wait["species"]["cat"]["effects"]), json.dumps(wait["species"]["dog"]["effects"]["pit_type"]))
