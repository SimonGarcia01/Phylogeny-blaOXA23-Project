import os
from Bio import AlignIO
from Bio.Align import MultipleSeqAlignment


def convert_to_phylip(nex_path: str, job_dir: str) -> str:
    """
    Reads a .nex alignment file and converts it to PHYLIP-relaxed format.
    Returns the path to the output .phy file.
    Raises FileNotFoundError if the .nex file doesn't exist.
    Raises ValueError if the file cannot be parsed as a valid Nexus alignment.
    """
    if not os.path.exists(nex_path):
        raise FileNotFoundError(f'Alignment file not found: {nex_path}')

    try:
        alignment: MultipleSeqAlignment = MultipleSeqAlignment(
            AlignIO.read(nex_path, 'nexus')  # type: ignore[arg-type]
        )
    except Exception as e:
        raise ValueError(f'Failed to parse Nexus file at {nex_path}: {e}')

    phy_path: str = os.path.join(job_dir, 'input.phy')

    try:
        AlignIO.write(alignment, phy_path, 'phylip-relaxed')  # type: ignore[arg-type]
    except Exception as e:
        raise ValueError(f'Failed to write PHYLIP file to {phy_path}: {e}')

    return phy_path
