"""Model 1: which adopted cats and dogs waited longest, and does color or breed matter after controls."""
import sys
import numpy as np, pandas as pd
import statsmodels.formula.api as smf

s = pd.read_csv(sys.argv[1], parse_dates=["in_dt", "out_dt"])
a = s[(s["Outcome Type"] == "Adoption") & s["Animal Type"].isin(["Cat", "Dog"])].copy()
a = a[(a.los_days >= 0) & (a.los_days <= 365) & a.age_yrs.notna() & (a.age_yrs >= 0)]
a = a[a.in_dt >= "2014-01-01"]

a["age_grp"] = pd.cut(a.age_yrs, [-0.01, 0.999, 3.999, 7.999, 40], labels=["Baby (<1)", "Young (1-3)", "Adult (4-7)", "Senior (8+)"])
sx = a["Sex upon Intake"].fillna("Unknown")
a["female"] = sx.str.contains("Female").astype(int)
a["intact"] = sx.str.contains("Intact").astype(int)
col = a["Color"].fillna("")
a["black"] = col.str.match(r"^Black(/Black)?$").astype(int)          # solid black only
a["mostly_black"] = col.str.startswith("Black").astype(int)
br = a["Breed"].fillna("")
a["pit_type"] = br.str.contains("Pit Bull|Staffordshire|American Bully", case=False).astype(int)
a["intake_type"] = a["Intake Type"].where(a["Intake Type"].isin(["Stray", "Owner Surrender", "Public Assist"]), "Other")
cond = a["Intake Condition"].fillna("Normal")
a["condition"] = np.select([cond.eq("Normal"), cond.isin(["Nursing", "Neonatal", "Pregnant"])], ["Normal", "Nursing/neonatal"], "Sick/injured/other")
a["year"] = a.in_dt.dt.year.astype(str)
a["y"] = np.log1p(a.los_days)

def pct(b): return 100 * (np.exp(b) - 1)

for sp in ["Cat", "Dog"]:
    d = a[a["Animal Type"] == sp]
    print(f"\n===== {sp}s adopted: n={len(d)}, median stay={d.los_days.median():.1f} days")
    print(d.groupby("age_grp", observed=True).los_days.agg(["count", "median"]).round(1).to_string())
    print("solid black vs not, median days:", d.groupby("black").los_days.median().round(1).to_dict(), "share black", round(d.black.mean(), 3))
    if sp == "Dog":
        print("pit-type vs not, median days:", d.groupby("pit_type").los_days.median().round(1).to_dict(), "share", round(d.pit_type.mean(), 3))
    f = "y ~ C(age_grp, Treatment('Young (1-3)')) + female + intact + black + C(intake_type, Treatment('Stray')) + C(condition) + C(year)"
    if sp == "Dog": f += " + pit_type"
    r = smf.ols(f, d).fit(cov_type="HC1")
    keep = [k for k in r.params.index if not k.startswith("C(year)") and k != "Intercept"]
    t = pd.DataFrame({"pct_change_in_stay": pct(r.params[keep]).round(1), "ci_low": pct(r.conf_int().loc[keep, 0]).round(1), "ci_high": pct(r.conf_int().loc[keep, 1]).round(1), "p": r.pvalues[keep].round(4)})
    print(t.to_string()); print("R2", round(r.rsquared, 3))
    t.to_csv(f"{sys.argv[2]}/model1_{sp.lower()}.csv")
a.to_csv(f"{sys.argv[2]}/adopted_model_data.csv", index=False)
