library(ape)
library(phangorn)

bootreps <- read.tree(file="infile.txt.raxml.bootstraps",
                      keep.multi = TRUE)

#All trees in the list should be unrooted
sum(is.rooted.multiPhylo(bootreps))

#Get the best tree from the RAxML output
tree <- read.tree(file="infile.txt.raxml.bestTree")
#Should be unrooted too
is.rooted(tree)
plot(tree)

#look for the outgroup, in this case, we will use the A. radioresistens
#This returns the position in the format
# Returned: 40
which(tree$tip.label == "AP019740.1_Chromosome_A.radior")

#Root the tree using species 40
#tree_root <- root(tree, outgroup = 7, resolve.root = TRUE)

#Other way to do it is use the name:
tree_root <- root(tree, outgroup = "AP019740.1_Chromosome_A.radior", resolve.root = TRUE)

#Check the best tree is rooted now
is.rooted(tree_root)
#Added a title to the plot
plot(tree_root, main = "Gene Bla-OXA23")

# The tip labels of the best tree and the boostrap trees should be the same
#Here we use the setequal function to check if the tip labels are the same (order does not matter)
#Just comparing with the first bootstrap tree should be enough
setequal(tree_root$tip.label, bootreps[[1]]$tip.label)

#Give more space to the plot
par(mar=c(1,1,3,1))
plot(tree_root, cex = 0.3, main = "Gene Bla-OXA23")

#This function will add the node labels to the plot
#nodelabels() 

#This will add the bootstrap values to the plot
#At this point, the node labels are bootstrap values, raging from 0 to 1
plotBS(tree_root, bootreps, p=0, type="phylogram", cex=0.4, bs.col="red")

#Now multiply the bootstrap values by 100 to get the percentages
tre_bs <- plotBS(tree_root, bootreps, p=50, type="p", digits = 3)
tre_bs$node.label <- as.numeric(tre_bs$node.label) * 100

# get tree with all bootstraps (no threshold)
tre_bs <- plotBS(tree_root, bootreps, p = 0, type = "p", digits = 3)

bootstrap_vals_raw <- as.numeric(tre_bs$node.label)
if (max(bootstrap_vals_raw, na.rm = TRUE) <= 1) {
  bootstrap_pct <- bootstrap_vals_raw * 100
} else {
  bootstrap_pct <- bootstrap_vals_raw
}

ntips <- length(tree_root$tip.label)
ninternal <- tre_bs$Nnode
internal_nodes <- seq(ntips + 1, ntips + ninternal)
seq_ids <- seq_len(ninternal)

# table with sequential id (1..Nnode) and actual ape node number
node_bootstrap_map <- data.frame(id = seq_ids, node = internal_nodes, bootstrap = round(bootstrap_pct, 3))
print(node_bootstrap_map)

# plot showing sequential ids
plot(tree_root, cex = 0.4)

nodelabels(
  text = seq_ids,
  node = internal_nodes,
  frame = "none",
  cex = 0.28,
  col = "red",
  adj = c(1.2, 1.2)
)


plot(tree_root,
     cex = 0.4,
     no.margin = FALSE)

par(pin = c(8, 14))
