library(ape)
library(phangorn)

bootreps <- read.tree(file="infile.txt.raxml.bootstraps",
                      keep.multi = TRUE)

# todos los árboles deben estar sin enraizar
sum(is.rooted.multiPhylo(bootreps))
# todos están sin enraizar

tree <- read.tree(file="infile.txt.raxml.bestTree")
is.rooted(tree)
plot(tree)

#enraizar con la especie 7, pq es la 7 que aparece en el formato newick
tree_root <- root(tree, outgroup = 7, resolve.root = TRUE) 
is.rooted(tree_root)
plot(tree_root, main = "Arbol Anolis")


# los tiplabels de ambos sets de árboles deben ser lo mismo
setequal(tree_root$tip.label, bootreps[[1]]$tip.label) # aqui lo comparo con el primer árbol de los bootstraps

par(mar=c(1,1,3,1)) # para ampliar los márgenes
plot(tree_root, cex = 0.6)

#nodelabels() 
# esto permite saber el número del nodo


plotBS(tree_root, bootreps, p=0, type="phylogram", cex=0.6, bs.col="black") # aqui me aparecen como valores de 0-1

# aqui multiplico por 100 los node labels
tre_bs <- plotBS(tree_root, bootreps, p=50, type="p", digits = 3)
tre_bs$node.label <- as.numeric(tre_bs$node.label) * 100
plot(tre_bs, cex=0.8)
nodelabels(tre_bs$node.label, frame="none", cex=0.7)

plotBS(tre1_root, bootreps, )

