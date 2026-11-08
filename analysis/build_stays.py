"""Join Austin Animal Center intakes to outcomes into one row per shelter stay."""
import sys, re
import numpy as np, pandas as pd

d = sys.argv[1]
out = sys.argv[2]
ins = pd.read_csv(f"{d}/Austin_Animal_Center_Intakes_07_06_2024.csv")
outs = pd.read_csv(f"{d}/Austin_Animal_Center_Outcomes_07_06_2024.csv")
ins["in_dt"] = pd.to_datetime(ins["DateTime"], format="%m/%d/%Y %I:%M:%S %p", errors="coerce")
outs["out_dt"] = pd.to_datetime(outs["DateTime"], format="%m/%d/%Y %I:%M:%S %p", errors="coerce")
ins = ins.dropna(subset=["in_dt"]).drop_duplicates(["Animal ID", "in_dt"])
outs = outs.dropna(subset=["out_dt"]).drop_duplicates(["Animal ID", "out_dt"])
print("intakes", len(ins), "outcomes", len(outs), "intake range", ins.in_dt.min(), ins.in_dt.max())

# match each intake to the first outcome for that animal on/after it (and before its next intake)
ins = ins.sort_values("in_dt"); outs = outs.sort_values("out_dt")
m = pd.merge_asof(ins, outs[["Animal ID", "out_dt", "Outcome Type", "Outcome Subtype", "Age upon Outcome", "Date of Birth"]],
                  left_on="in_dt", right_on="out_dt", by="Animal ID", direction="forward")
ins_next = ins[["Animal ID", "in_dt"]].copy()
ins_next["next_in"] = ins_next.groupby("Animal ID")["in_dt"].shift(-1)
m = m.merge(ins_next, on=["Animal ID", "in_dt"], how="left")
m = m[m.out_dt.notna() & (m.next_in.isna() | (m.out_dt <= m.next_in))]
m["los_days"] = (m.out_dt - m.in_dt).dt.total_seconds() / 86400

def age_years(s):
    if not isinstance(s, str): return np.nan
    mm = re.match(r"(-?\d+)\s+(\w+)", s)
    if not mm: return np.nan
    n, u = int(mm.group(1)), mm.group(2)
    return n / {"year": 1, "years": 1, "month": 12, "months": 12, "week": 52, "weeks": 52, "day": 365, "days": 365}.get(u, np.nan)
m["age_yrs"] = m["Age upon Intake"].map(age_years)
m.to_csv(out, index=False)
print("stays", len(m), "outcome types", m["Outcome Type"].value_counts().head(8).to_dict())
