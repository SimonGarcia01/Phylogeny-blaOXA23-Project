# services/raxml.py

import os
import re
import subprocess
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings


@dataclass
class RAxMLResult:
    best_tree_path: str       # .raxml.bestTree
    bootstraps_path: str      # .raxml.bootstraps
    support_path: str         # .raxml.support  ← tree annotated with bootstrap values
    prefix: str


def _translate_model(jmodeltest_model: str) -> str:
    """
    Translates a JModelTest2 model name to its RAxML-NG equivalent.
    Key differences:
      - JC   → JC69  (RAxML-NG doesn't recognise bare "JC")
      - +G   → +G4   (explicit 4 gamma categories to match jmodeltest's -g 4 flag)
    """
    model: str = jmodeltest_model

    # Rename base model if needed
    base_renames: dict[str, str] = {'JC': 'JC69'}
    for old, new in base_renames.items():
        if model == old or model.startswith(old + '+'):
            model = new + model[len(old):]
            break

    # Replace bare +G with +G4 (but leave +G4 alone if already explicit)
    model = re.sub(r'\+G(?![\d])', '+G4', model)

    return model


def run_raxml(phy_path: str, job_dir: str, best_model: str, prefix: str) -> RAxMLResult:
    """
    Runs RAxML-NG on a PHYLIP alignment using the best-fit model from JModelTest2.
    Performs ML search + bootstrapping in one pass (--all).
    Returns a RAxMLResult with paths to the output files.
    Raises RuntimeError if RAxML-NG fails or expected output files are missing.
    """
    raxml_bin: str = str(Path(settings.RAXML_BIN).resolve())
    phy_path_normalized: str = str(Path(phy_path).resolve())
    prefix_path: str = str(Path(job_dir) / prefix)
    raxml_model: str = _translate_model(best_model)

    print(f'[raxml] Model (jmodeltest): {best_model}  →  (raxml-ng): {raxml_model}')

    cmd: list[str] = [
        raxml_bin,
        '--all',                        # ML search + bootstrapping in one run
        '--msa', phy_path_normalized,   # input alignment
        '--model', raxml_model,         # model translated from JModelTest2
        '--prefix', prefix_path,        # output prefix path
        '--bs-trees', '100',            # number of bootstrap replicates
        '--seed', '12345',              # reproducibility
        '--threads', '2',               # safe default for a container
        '--redo',                       # overwrite if files already exist
    ]

    try:
        result: subprocess.CompletedProcess[str] = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=3600,   # 1 hour — large datasets can take a while
            cwd=job_dir,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError('RAxML-NG timed out after 1 hour.')
    except FileNotFoundError:
        raise RuntimeError(
            f'RAxML-NG binary not found at {raxml_bin}. '
            f'Make sure the binary exists and is executable.'
        )

    if result.returncode != 0:
        raise RuntimeError(
            f'RAxML-NG failed (exit {result.returncode}):\n'
            f'STDOUT:\n{result.stdout}\n'
            f'STDERR:\n{result.stderr}'
        )

    # Verify expected output files exist
    best_tree_path: str = f'{prefix_path}.raxml.bestTree'
    bootstraps_path: str = f'{prefix_path}.raxml.bootstraps'
    support_path: str = f'{prefix_path}.raxml.support'

    missing: list[str] = [
        p for p in [best_tree_path, bootstraps_path, support_path]
        if not os.path.exists(p)
    ]

    if missing:
        raise RuntimeError(
            f'RAxML-NG finished but expected output files are missing:\n'
            + '\n'.join(missing)
            + f'\nSTDOUT:\n{result.stdout}'
        )

    print(f'[raxml] Best tree: {best_tree_path}')
    print(f'[raxml] Support tree: {support_path}')

    return RAxMLResult(
        best_tree_path=best_tree_path,
        bootstraps_path=bootstraps_path,
        support_path=support_path,
        prefix=prefix,
    )