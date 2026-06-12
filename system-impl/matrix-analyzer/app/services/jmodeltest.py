import os
from pathlib import Path
import re
import subprocess
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class JModelTestResult:
    best_model: str
    criterion: str
    raw_output_path: str


def select_criterion(num_taxa: int) -> str:
    """
    Selects the model selection criterion based on number of taxa.
    AICc — corrects for small sample bias, recommended under 30 taxa.
    AIC  — appropriate for moderate datasets (30–50 taxa).
    BIC  — preferred for larger datasets, penalizes complexity more heavily.
    """
    if num_taxa < 30:
        return 'AICc'
    elif num_taxa <= 50:
        return 'AIC'
    else:
        return 'BIC'


def run_jmodeltest(phy_path: str, job_dir: str, criterion: str) -> JModelTestResult:
    """
    Runs JModelTest2 on a PHYLIP alignment file.
    Returns a JModelTestResult with the best model name and output path.
    Raises RuntimeError if JModelTest2 fails or the best model cannot be parsed.
    """
    output_path: str = os.path.join(job_dir, 'jmodeltest_output.txt')

    # Resolve absolute paths so they work regardless of cwd
    jar_path: str = str(Path(settings.JMODELTEST_JAR).resolve())
    working_dir: str = str(Path(settings.JMODELTEST_DIR).resolve())
    # Windows backslashes in /tmp paths will also break Java — normalize them
    phy_path_normalized: str = str(Path(phy_path).resolve())
    output_path_normalized: str = str(Path(output_path).resolve())

    cmd: list[str] = [
        'java', '-jar', jar_path,
        '-d', phy_path_normalized,
        '-g', '4',
        '-i',
        '-f',
        f'-{criterion}',
        '-a',
        '-o', output_path_normalized,
    ]


    try:
        result: subprocess.CompletedProcess[str] = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=600,  # 10 min timeout — JModelTest2 can be slow
            cwd=working_dir,
        )

    except subprocess.TimeoutExpired:
        raise RuntimeError('JModelTest2 timed out after 10 minutes.')
    except FileNotFoundError:
        raise RuntimeError('Java not found. Make sure Java is installed and on PATH.')

    if result.returncode != 0:
        raise RuntimeError(
            f'JModelTest2 failed (exit {result.returncode}):\n'
            f'STDOUT:\n{result.stdout}\n'
            f'STDERR:\n{result.stderr}'
        )

    best_model: str = _parse_best_model(output_path_normalized, criterion)

    return JModelTestResult(
        best_model=best_model,
        criterion=criterion,
        raw_output_path=output_path_normalized,
    )


def _parse_best_model(output_path: str, criterion: str) -> str:
    """
    Parses the JModelTest2 output file to extract the best-fit model name.
    JModelTest2 output contains a block like:
        Model selected: GTR+I+G
    or depending on criterion:
        AICc Model = GTR+I+G
    """
    if not os.path.exists(output_path):
        raise RuntimeError(f'JModelTest2 output file not found: {output_path}')

    # Patterns to try in order — JModelTest2 output format varies slightly by version
    patterns: list[str] = [
        rf'{criterion}\s+model\s*[=:]\s*(\S+)',  # "AIC model = GTR+I+G"
        r'Model selected:\s*(\S+)',  # "Model selected: GTR+I+G"
        r'Best Model:\s*(\S+)',  # "Best Model: GTR+I+G"
    ]

    with open(output_path, 'r') as f:
        content: str = f.read()

    for pattern in patterns:
        match: re.Match[str] | None = re.search(pattern, content, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    # If none matched, dump the last 50 lines to help debug
    last_lines: str = '\n'.join(content.splitlines()[-50:])
    raise RuntimeError(
        f'Could not parse best model from JModelTest2 output.\n'
        f'Criterion used: {criterion}\n'
        f'Last 50 lines of output:\n{last_lines}'
    )
