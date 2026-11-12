# Model 3 in R (ABI Ch. 5): NJ county need score + k-means and hierarchical clustering.
# Same steps as model3.py, so the two can be checked against each other.
# Run: Rscript analysis/model3.R analysis/nj_counties.csv
args <- commandArgs(trailingOnly = TRUE)
d <- read.csv(args[1])
feats <- c("food_insecure_2023", "poverty_pct", "limited_food_access_pct", "unemployment_2024")

# standardize with the population SD, as scikit-learn's StandardScaler does
zs <- function(x) (x - mean(x)) / sqrt(mean((x - mean(x))^2))
z <- sapply(d[feats], zs)
d$need_score <- round(rowMeans(z) * 10 + 50, 1)   # 50 = NJ county average

set.seed(1)
km <- kmeans(z, centers = 3, nstart = 50)
d$kmeans <- km$cluster
d$hclust <- cutree(hclust(dist(z), method = "ward.D2"), k = 3)

cat("k-means vs hierarchical (rows = k-means groups):\n")
print(table(kmeans = d$kmeans, hclust = d$hclust))
cat("\nGroup profiles:\n")
prof <- aggregate(d[c(feats, "need_score")], by = list(group = d$kmeans), FUN = function(v) round(mean(v), 1))
prof$counties <- tapply(d$county, d$kmeans, paste, collapse = ", ")[as.character(prof$group)]
print(prof, row.names = FALSE)
cat("\nNeed score, highest first:\n")
print(d[order(-d$need_score), c("county", "need_score", "kmeans")], row.names = FALSE)
