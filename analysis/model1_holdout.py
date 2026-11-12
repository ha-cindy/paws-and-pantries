"""Model 1 holdout test: train the wait model on 2014 to 2022 adoptions, test on 2023 to 2024.
Reports how well the model ranks and predicts waits for pets it has never seen, plus a
'slow 20%' flag check. Also fits the final model on all years and saves it for the site predictor."""
import sys, json
import numpy as np, pandas as pd
import statsmodels.formula.api as smf
from scipy.stats import spearmanr

a = pd.read_csv(sys.argv[1], parse_dates=["in_dt"])
a["year"] = a.in_dt.dt.year
out = {"split": "train 2014-2022, test 2023-2024", "species": {}}

def pct(b): return 100 * (np.exp(b) - 1)

for sp in ["Cat", "Dog"]:
    d = a[a["Animal Type"] == sp].copy()
    f = "y ~ C(age_grp, Treatment('Young (1-3)')) + female + intact + black + C(intake_type, Treatment('Stray')) + C(condition)"
    if sp == "Dog": f += " + pit_type"
    tr, te = d[d.year <= 2022], d[d.year >= 2023]
    m = smf.ols(f, tr).fit()
    pred = np.expm1(m.predict(te))                       # predicted days
    y = te.los_days.values
    rho = spearmanr(pred, y).correlation
    mae = np.mean(np.abs(pred - y)); med_ae = np.median(np.abs(pred - y))
    base = np.full_like(y, tr.los_days.median()); mae_base = np.mean(np.abs(base - y))
    # "slow 20%" flag: does the top fifth by predicted wait actually wait longer?
    cut = np.quantile(pred, 0.8)
    flag = pred >= cut
    med_flag, med_rest = np.median(y[flag]), np.median(y[~flag])
    long = y > np.quantile(y, 0.8)                        # truly slow fifth
    hit = long[flag].mean()                               # precision of the flag
    # decile table for the site
    dec = pd.qcut(pred, 10, labels=False, duplicates="drop")
    tab = pd.DataFrame({"dec": dec, "pred": pred, "y": y}).groupby("dec").agg(pred_median=("pred", "median"), actual_median=("y", "median"), n=("y", "size")).round(1)
    # within-factor-of-two accuracy
    within2 = np.mean((pred / np.maximum(y, 0.5) <= 2) & (y / np.maximum(pred, 0.5) <= 2))
    print(f"\n===== {sp}: train n={len(tr)}, test n={len(te)}")
    print(f"rank correlation (Spearman) {rho:.3f}; MAE {mae:.1f} days vs {mae_base:.1f} for 'always guess the median'; median abs error {med_ae:.1f}")
    print(f"slow-20% flag: median wait {med_flag:.1f} days vs {med_rest:.1f} for the rest; {100*hit:.0f}% of flagged pets were truly in the slowest fifth (20% = chance)")
    print(f"within a factor of 2 of the real wait: {100*within2:.0f}%")
    print(tab.to_string())
    # final model on all years, for the predictor
    mf = smf.ols(f, d).fit(cov_type="HC1")
    resid_sd = float(np.std(mf.resid))
    out["species"][sp.lower()] = {
        "n_train": int(len(tr)), "n_test": int(len(te)),
        "spearman": round(float(rho), 3), "mae_days": round(float(mae), 1), "mae_baseline_days": round(float(mae_base), 1),
        "median_abs_error_days": round(float(med_ae), 1), "within_2x_pct": round(100 * float(within2), 1),
        "flag_median_days": round(float(med_flag), 1), "rest_median_days": round(float(med_rest), 1), "flag_precision_pct": round(100 * float(hit), 1),
        "deciles": [{"pred": float(r.pred_median), "actual": float(r.actual_median), "n": int(r.n)} for r in tab.itertuples()],
        "coef": {k: round(float(v), 4) for k, v in mf.params.items()},
        "resid_sd": round(resid_sd, 4),
        "slow20_cut_log": round(float(np.log1p(np.quantile(np.expm1(mf.fittedvalues), 0.8))), 4),
        "formula": f,
    }
json.dump(out, open(sys.argv[2], "w"), indent=1)
print("\nsaved", sys.argv[2])
