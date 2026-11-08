# Model 1 in R (ABI Ch. 4): how much longer do some adopted pets wait, holding other factors equal?
library(data.table)
args <- commandArgs(trailingOnly = TRUE)
a <- fread(args[1])
a[, age_grp := relevel(factor(age_grp), ref = "Young (1-3)")]
a[, intake_type := relevel(factor(intake_type), ref = "Stray")]
a[, year := factor(year)]
pct <- function(b) round(100 * (exp(b) - 1), 1)

cats <- lm(y ~ age_grp + female + intact + black + intake_type + condition + year, data = a[`Animal Type` == "Cat"])
dogs <- lm(y ~ age_grp + female + intact + black + intake_type + condition + year + pit_type, data = a[`Animal Type` == "Dog"])
cat("Cats: % longer stay\n"); print(pct(coef(cats)[c("black", "age_grpSenior (8+)")]))
cat("Dogs: % longer stay\n"); print(pct(coef(dogs)[c("black", "pit_type", "age_grpSenior (8+)")]))
