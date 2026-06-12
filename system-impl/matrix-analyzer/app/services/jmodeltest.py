def select_criterion(num_taxa: int) -> str:
    """
    Selects the best model selection criterion based on the number of taxa.
    AICc corrects for small sample bias — recommended when n/K < 40
    (roughly under 30 taxa for typical alignments).
    AIC is appropriate for moderate datasets.
    BIC is preferred for larger datasets as it penalizes complexity more.
    """
    if num_taxa < 30:
        return 'AICc'
    elif num_taxa <= 50:
        return 'AIC'
    else:
        return 'BIC'