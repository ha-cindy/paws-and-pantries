"""Model 3: NJ county need score + clustering (ABI Ch. 5)."""
import sys
import numpy as np, pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from scipy.cluster.hierarchy import linkage, fcluster

d = pd.read_csv(sys.argv[1])
# official 2023 counts from each county's NJ Office of the Food Security Advocate chart book (Map the Meal Gap)
d["food_insecure_people"] = d.food_insecure_people_2023.astype(int)
feats = ["food_insecure_2023", "poverty_pct", "limited_food_access_pct", "unemployment_2024"]
z = StandardScaler().fit_transform(d[feats])
d["need_score"] = (z.mean(axis=1) * 10 + 50).round(1)   # 50 = NJ county average
km = KMeans(n_clusters=3, n_init=50, random_state=1).fit(z)
d["kmeans"] = km.labels_
d["hclust"] = fcluster(linkage(z, "ward"), 3, "maxclust")
print(pd.crosstab(d.kmeans, d.hclust))
prof = d.groupby("kmeans")[feats + ["need_score"]].mean().round(1)
prof["counties"] = d.groupby("kmeans").county.apply(lambda s: ", ".join(s))
print(prof.to_string())
print(d.sort_values("need_score", ascending=False)[["county", "need_score", "food_insecure_2023", "poverty_pct", "limited_food_access_pct", "unemployment_2024", "food_insecure_people", "kmeans"]].to_string(index=False))
d.to_csv(sys.argv[2], index=False)
